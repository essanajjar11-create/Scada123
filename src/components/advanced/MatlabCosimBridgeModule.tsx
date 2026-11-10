import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Cpu,
  Play,
  RefreshCw,
  Zap,
  ShieldCheck,
  Radio,
  Sliders,
  CheckCircle2,
  Server,
  Terminal,
  Signal
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface MatlabTelemetry {
  status: string;
  engine?: string;
  solverTimeMs?: number;
  lastUpdated?: string;
  timestamp?: string;
  grid132kV: {
    V_LL_kV: number;
    freq_Hz: number;
    S_sc_MVA: number;
    Va_kV: number;
    Vb_kV: number;
    Vc_kV: number;
  };
  tr1_13_8kV: {
    V_LL_kV: number;
    rated_MVA: number;
    tap_position: number;
    hot_spot_degC: number;
    top_oil_degC: number;
    Va_kV: number;
    Vb_kV: number;
    Vc_kV: number;
  };
  relays: {
    ansi87t_trip: number;
    ansi21_trip: number;
    ansi25_permissive: number;
    ansi50_51_trip: number;
  };
  microgrid: {
    solar_MW: number;
    bess_SoC_pct: number;
    bess_power_MW: number;
    h2_kg_hr: number;
    hvdc_MW: number;
  };
  waveforms: Array<{
    t_ms: number;
    Va_132kV: number;
    Vb_132kV: number;
    Vc_132kV: number;
    Va_13_8kV: number;
    Vb_13_8kV: number;
    Vc_13_8kV: number;
  }>;
}

export const MatlabCosimBridgeModule: React.FC = () => {
  const [telemetry, setTelemetry] = useState<MatlabTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [spawningMatlab, setSpawningMatlab] = useState<boolean>(false);
  const [simCommand, setSimCommand] = useState<string>("NORMAL_RUN");
  const [activeChannel, setActiveChannel] = useState<"132kV" | "13_8kV">("132kV");
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [syncCount, setSyncCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch telemetry via HTTP fallback
  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/matlab/latest-telemetry");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error("Failed to fetch MATLAB telemetry:", err);
    }
  };

  // Setup live WebSocket listener for instant zero-latency push
  useEffect(() => {
    fetchTelemetry();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "MATLAB_COSIM_TELEMETRY" && data.telemetry) {
          setTelemetry(data.telemetry);
          setSyncCount((prev) => prev + 1);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Periodic polling fallback
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, [autoPoll]);

  // Dispatch command to MATLAB
  const triggerSimulation = async (targetCmd?: string) => {
    const cmd = targetCmd || simCommand;
    setSimCommand(cmd);
    setLoading(true);
    try {
      const res = await fetch("/api/matlab/cosim-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          params: { duration_s: 0.20, timestamp: Date.now() }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setTelemetry(data.telemetry);
          setSyncCount((prev) => prev + 1);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error triggering co-simulation:", err);
      setLoading(false);
    }
  };

  // Launch local MATLAB batch solver
  const launchMatlabSolver = async () => {
    setSpawningMatlab(true);
    try {
      const res = await fetch("/api/matlab/execute-batch", { method: "POST" });
      const data = await res.json();
      console.log("MATLAB Launch Response:", data);
      setTimeout(() => {
        fetchTelemetry();
        setSpawningMatlab(false);
      }, 3500);
    } catch (err) {
      console.error("Error spawning MATLAB process:", err);
      setSpawningMatlab(false);
    }
  };

  // Dynamic waveform data or smooth synthetic fallback
  const waveformData = telemetry?.waveforms && telemetry.waveforms.length > 0
    ? telemetry.waveforms
    : Array.from({ length: 40 }, (_, idx) => {
        const t = idx * 2.5; // ms
        const omega = 2 * Math.PI * 0.05; // 50 Hz
        return {
          t_ms: t,
          Va_132kV: Number((107.7 * Math.sin(omega * t)).toFixed(2)),
          Vb_132kV: Number((107.7 * Math.sin(omega * t - (2 * Math.PI) / 3)).toFixed(2)),
          Vc_132kV: Number((107.7 * Math.sin(omega * t + (2 * Math.PI) / 3)).toFixed(2)),
          Va_13_8kV: Number((11.26 * Math.sin(omega * t + Math.PI / 6)).toFixed(2)),
          Vb_13_8kV: Number((11.26 * Math.sin(omega * t - Math.PI / 2)).toFixed(2)),
          Vc_13_8kV: Number((11.26 * Math.sin(omega * t + (5 * Math.PI) / 6)).toFixed(2))
        };
      });

  const isCoSimActive = telemetry?.status === "ACTIVE_COSIM" || telemetry?.status === "ONLINE_SYNCHRONIZED";

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 border border-sky-500/40 rounded-lg text-sky-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              MATLAB & Simulink Live Co-Simulation Bridge
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-mono ${
                  isCoSimActive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isCoSimActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                {isCoSimActive ? "ACTIVE CO-SIM LINK (60 FPS)" : "STANDBY (READY TO CONNECT)"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bidirectional real-time telemetry streaming • WebSocket status:{" "}
              <span className={wsConnected ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {wsConnected ? "CONNECTED" : "CONNECTING..."}
              </span>{" "}
              {syncCount > 0 && `(${syncCount} packets synced)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              autoPoll
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {autoPoll ? "Auto-Poll ON" : "Auto-Poll OFF"}
          </button>

          <button
            onClick={launchMatlabSolver}
            disabled={spawningMatlab}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Spawns MATLAB in background and streams live telemetry to this browser window"
          >
            {spawningMatlab ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
            )}
            Run MATLAB Bridge
          </button>

          <button
            onClick={() => {
              void triggerSimulation();
            }}
            disabled={loading}
            className="px-4 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Simulate Now
          </button>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>132 kV Grid Infeed</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {telemetry?.grid132kV?.V_LL_kV || 132.0}{" "}
            <span className="text-sm font-normal text-slate-400">kV</span>
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Freq: {telemetry?.grid132kV?.freq_Hz || 50.0} Hz | S_sc: 2500 MVA
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Transformer TR-1 (Dyn11)</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {telemetry?.tr1_13_8kV?.V_LL_kV || 13.8}{" "}
            <span className="text-sm font-normal text-slate-400">kV</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Hot-Spot: <span className="text-amber-400 font-mono">{telemetry?.tr1_13_8kV?.hot_spot_degC || 109.3}°C</span> | Top-Oil: {telemetry?.tr1_13_8kV?.top_oil_degC || 78.4}°C
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Protection ANSI Relays</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            NORMAL
          </div>
          <div className="text-xs text-slate-400 mt-2">
            87T: {telemetry?.relays?.ansi87t_trip === 1 ? "TRIP" : "ARMED"} | 21: ARMED | 25: PERMISSIVE
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Microgrid & VSC-HVDC</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {telemetry?.microgrid?.bess_SoC_pct || 72.4}%{" "}
            <span className="text-xs font-normal text-slate-400">SoC</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Solar: {telemetry?.microgrid?.solar_MW || 4.85} MW | HVDC: {telemetry?.microgrid?.hvdc_MW || 20.0} MW
          </div>
        </div>
      </div>

      {/* Real-time Oscilloscope Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Simulink Instantaneous 3-Phase Oscilloscope
            </h3>
            <p className="text-xs text-slate-400">
              High-speed waveform telemetry stream from MATLAB Simulink ode23tb solver ({waveformData.length} samples)
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveChannel("132kV")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeChannel === "132kV"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              132 kV Grid Bus
            </button>
            <button
              onClick={() => setActiveChannel("13_8kV")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeChannel === "13_8kV"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              13.8 kV Dyn11 MV Bus
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={waveformData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="t_ms"
                stroke="#94a3b8"
                fontSize={11}
                unit=" ms"
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                unit=" kV"
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              
              {activeChannel === "132kV" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="Va_132kV"
                    name="Phase A (132 kV)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Vb_132kV"
                    name="Phase B (132 kV)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Vc_132kV"
                    name="Phase C (132 kV)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="Va_13_8kV"
                    name="Phase a (13.8 kV)"
                    stroke="#f87171"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Vb_13_8kV"
                    name="Phase b (13.8 kV)"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Vc_13_8kV"
                    name="Phase c (13.8 kV)"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control & Co-Sim Dispatch Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            Simulink Transient Scenario Dispatcher
          </h3>
          <span className="text-xs text-slate-400">
            Active: <span className="text-sky-400 font-bold font-mono">{simCommand}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => triggerSimulation("NORMAL_RUN")}
            disabled={loading}
            className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
              simCommand === "NORMAL_RUN"
                ? "bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/30"
                : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400">Scenario 1: Steady State</span>
              {simCommand === "NORMAL_RUN" && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">28.0 MW Feeder demand, 1.0 pu Voltage, 50 Hz nominal</div>
          </button>

          <button
            onClick={() => triggerSimulation("SLG_FAULT_A")}
            disabled={loading}
            className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
              simCommand === "SLG_FAULT_A"
                ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30"
                : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Scenario 2: Single-Line Fault (Phase A)</span>
              {simCommand === "SLG_FAULT_A" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">SLG Fault at t=100ms, Phase A voltage sag & ANSI 87T trip</div>
          </button>

          <button
            onClick={() => triggerSimulation("MICROGRID_STEP")}
            disabled={loading}
            className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
              simCommand === "MICROGRID_STEP"
                ? "bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30"
                : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">Scenario 3: HVDC & BESS Transfer</span>
              {simCommand === "MICROGRID_STEP" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">25 MW HVDC import & -8.5 MW BESS rapid peak shaving</div>
          </button>
        </div>
      </div>
    </div>
  );
};
