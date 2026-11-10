import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Zap,
  Activity,
  Sliders,
  Shield,
  Layers,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Radio,
  Sparkles,
  Play,
  RotateCcw,
  Maximize2,
  TrendingUp,
  Flame,
  Globe,
  Lock,
  Battery
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

type HvdcOpMode = 'GRID_FOLLOWING' | 'GRID_FORMING_BLACK_START' | 'STATCOM_MODE';
type HvdcFaultType = 'NONE' | 'DC_POLE_TO_GROUND' | 'DC_POLE_TO_POLE' | 'AC_VOLTAGE_SAG';

export const HvdcSmartIntertieModule: React.FC = () => {
  const {
    lang,
    activeTelemetry,
    addSoeEvent,
    hvdcState,
    setHvdcSetpoints,
    setHvdcControlMode,
    setHvdcFault,
    tripHvdcDccb,
    resetHvdcProtection
  } = useScada();
  const isAr = lang === 'ar';

  // Control setpoints
  const [activePowerP, setActivePowerP] = useState<number>(hvdcState.pRefMW || 120); // -200 to +200 MW
  const [reactivePowerQ, setReactivePowerQ] = useState<number>(hvdcState.qRefMVAR || 25); // -100 to +100 MVAR
  const [opMode, setOpMode] = useState<HvdcOpMode>('GRID_FOLLOWING');
  const [syntheticInertiaH, setSyntheticInertiaH] = useState<number>(4.5); // Inertia constant H in seconds (2 to 8s)
  const [lineLengthKm, setLineLengthKm] = useState<number>(150); // 150 km DC link
  const [activeFault, setActiveFault] = useState<HvdcFaultType>(() => {
    const supported: readonly string[] = ['NONE', 'DC_POLE_TO_GROUND', 'DC_POLE_TO_POLE', 'AC_VOLTAGE_SAG'];
    return supported.includes(hvdcState.faultState) ? (hvdcState.faultState as HvdcFaultType) : 'NONE';
  });
  const [isLvrtTriggered, setIsLvrtTriggered] = useState<boolean>(hvdcState.isLvrtActive || false);

  // VSC-MMC System Parameters
  const DC_VOLTAGE_POLE_KV = 320; // ±320 kV
  const DC_VOLTAGE_TOTAL_KV = 640; // 640 kV pole-to-pole
  const SUBMODULES_PER_ARM = 200; // N = 200 half-bridge SMs per arm
  const R_DC_PER_KM = 0.015; // 0.015 ohm/km per pole

  // Decoupled vector calculations (d-q synchronous frame)
  // Vd = 1.0 pu (132kV phase-to-ground base), Vq = 0 in steady state
  // P = 1.5 * (Vd * Id + Vq * Iq) => Id = P / (1.5 * Vd)
  // Q = 1.5 * (Vq * Id - Vd * Iq) => Iq = -Q / (1.5 * Vd)
  const effectiveP = opMode === 'STATCOM_MODE' ? 0 : activeFault !== 'NONE' ? 0 : activePowerP;
  const effectiveQ = activeFault !== 'NONE' ? 0 : reactivePowerQ;

  // DC Current: I_dc = P_dc / V_dc_total
  const idcAmps = useMemo(() => {
    if (Math.abs(effectiveP) === 0) return 0;
    return (Math.abs(effectiveP) * 1e6) / (DC_VOLTAGE_TOTAL_KV * 1e3);
  }, [effectiveP]);

  // Ohmic DC Loss: P_loss_dc = 2 * (I_dc)^2 * (R_dc_per_km * length)
  const totalRdcOhms = useMemo(() => {
    return R_DC_PER_KM * lineLengthKm;
  }, [lineLengthKm]);

  const hvdcLossMw = useMemo(() => {
    if (idcAmps === 0) return 0.2; // converter standby
    const copperLossWatts = 2 * Math.pow(idcAmps, 2) * totalRdcOhms;
    const converterLossWatts = Math.abs(effectiveP) * 1e6 * 0.009; // 0.9% converter switching/conduction loss
    return (copperLossWatts + converterLossWatts) / 1e6;
  }, [idcAmps, totalRdcOhms, effectiveP]);

  // HVAC Comparison loss over same distance (including cable capacitive charging currents Ic = omega * C * V)
  const equivalentHvacLossMw = useMemo(() => {
    if (Math.abs(effectiveP) === 0) return 1.5;
    // Over 180km AC cable has severe dielectric and reactive circulating current losses
    const baseAcLoss = Math.abs(effectiveP) * 0.022 * (lineLengthKm / 50);
    return Math.min(Math.abs(effectiveP) * 0.4, baseAcLoss + 4.5);
  }, [effectiveP, lineLengthKm]);

  const lossSavedMw = useMemo(() => {
    return Math.max(0, equivalentHvacLossMw - hvdcLossMw);
  }, [equivalentHvacLossMw, hvdcLossMw]);

  // Synthetic Inertia Fast Frequency Response: Delta P = 2 * H * (df/dt)
  const syntheticInertiaPowerMw = useMemo(() => {
    const roCof = activeTelemetry.rocofHzPerSec || 0.04; // Hz/s
    return Math.abs(2 * syntheticInertiaH * roCof * 15).toFixed(1);
  }, [syntheticInertiaH, activeTelemetry.rocofHzPerSec]);

  // Canvas Flow Animation Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const particles = Array.from({ length: 24 }, (_, i) => ({
      x: (i / 24) * 600,
      y: 70 + (Math.random() - 0.5) * 6
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Draw Main Grid Infeed (Left)
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(15, 25, 90, 90, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('AC GRID', 32, 60);
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('132 kV 50Hz', 27, 78);

      // Draw Converter Station A (MMC)
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(145, 20, 110, 100, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e0e7ff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('MMC STATION A', 153, 50);
      ctx.fillStyle = '#818cf8';
      ctx.font = '9px monospace';
      ctx.fillText('VSC ±320kV', 168, 70);
      ctx.fillText(`N=${SUBMODULES_PER_ARM} SM`, 165, 88);

      // Draw Converter Station B (Remote MMC)
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(445, 20, 110, 100, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d1fae5';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('MMC STATION B', 453, 50);
      ctx.fillStyle = '#34d399';
      ctx.font = '9px monospace';
      ctx.fillText('Remote Intertie', 458, 70);
      ctx.fillText('±320kV DC Term', 458, 88);

      // Draw DC Bipole Cable Lines (+320kV Top, -320kV Bottom)
      ctx.strokeStyle = activeFault === 'DC_POLE_TO_GROUND' ? '#f43f5e' : '#06b6d4';
      ctx.lineWidth = 4;
      // Positive Pole
      ctx.beginPath();
      ctx.moveTo(255, 50);
      ctx.lineTo(445, 50);
      ctx.stroke();

      // Negative Pole
      ctx.strokeStyle = activeFault === 'DC_POLE_TO_POLE' ? '#e11d48' : '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(255, 90);
      ctx.lineTo(445, 90);
      ctx.stroke();

      // Pole labels
      ctx.fillStyle = '#06b6d4';
      ctx.font = '9px monospace';
      ctx.fillText('+320 kV DC Pole 1', 305, 42);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('-320 kV DC Pole 2', 305, 106);

      // Animate Particles along DC Cable
      const speed = (effectiveP / 500) * 3.5;
      offset += speed;

      ctx.fillStyle = '#fef08a';
      particles.forEach((p) => {
        let px = (p.x + offset) % 190;
        if (px < 0) px += 190;
        const actualX = 255 + px;

        // Draw particle on Pole 1
        ctx.beginPath();
        ctx.arc(actualX, 50, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw return particle on Pole 2 (opposite flow)
        let rx = (p.x - offset) % 190;
        if (rx < 0) rx += 190;
        ctx.beginPath();
        ctx.arc(255 + rx, 90, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Flow direction arrow
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 10px monospace';
      const dirText = effectiveP > 0 ? '▶▶ EXPORTING POWER ▶▶' : effectiveP < 0 ? '◀◀ IMPORTING POWER ◀◀' : '■ STATIC ZERO MW ■';
      ctx.fillText(dirText, 280, 73);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [effectiveP, activeFault]);

  // Inject DC Fault
  const handleTriggerFault = (fault: HvdcFaultType) => {
    setActiveFault(fault);
    setHvdcFault(fault);
    addSoeEvent(
      `HVDC Fast Protection: Tripped on ${fault}. Submodules blocked in < 2.5ms!`,
      'HVDC-1',
      'HVDC_MMC',
      'CRITICAL',
      true
    );
  };

  const handleClearFault = () => {
    setActiveFault('NONE');
    setIsLvrtTriggered(false);
    resetHvdcProtection();
    addSoeEvent(
      'HVDC Protection Reset: DC Link de-blocked and de-energized to nominal ±320kV',
      'HVDC-1',
      'HVDC_MMC',
      'INFO'
    );
  };

  // Trigger AC Low-Voltage Ride-Through (LVRT)
  const handleTestLvrt = () => {
    setIsLvrtTriggered(true);
    setHvdcFault('AC_VOLTAGE_SAG');
    addSoeEvent(
      'LVRT Dynamic Support: Injected 100% reactive current Iq = 1.0 pu to support AC voltage sag',
      'HVDC-1',
      'HVDC_MMC',
      'MAJOR'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-cyan-950/40 border border-indigo-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'منظومة نقل التيار المستمر عالي الجهد (VSC-MMC HVDC ±320 kV Intertie)' : 'Smart Grid VSC-MMC HVDC Interconnection Subsystem'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold">
                    ±320kV Bipole / 1000MW
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'محولات الجهد متعددة المستويات (MMC 200 SM) • التحكم المستقل بالقدرة الفعالة والردية (P-Q Decoupled) • جدار الحماية ضد الانهيار المتسلسل'
                    : 'Modular Multilevel Converter • Decoupled d-q Vector Control • Synthetic Inertia & Dynamic Grid Decoupling'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleTestLvrt}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/25 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAr ? 'اختبار الصمود LVRT' : 'Test AC LVRT'}</span>
            </button>

            {activeFault !== 'NONE' || isLvrtTriggered ? (
              <button
                onClick={handleClearFault}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/25 cursor-pointer animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة ضبط واستئناف' : 'Reset & De-Block MMC'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleTriggerFault('DC_POLE_TO_GROUND')}
                className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAr ? 'حقن عطل قطب-أرض' : 'Inject DC Ground Fault'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              {isAr ? 'القدرة الفعالة المنقولة (P)' : 'Active Power Flow (P)'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
              {effectiveP > 0 ? 'EXPORT' : effectiveP < 0 ? 'IMPORT' : 'IDLE'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {effectiveP.toFixed(1)}{' '}
            <span className="text-xs text-zinc-500 font-normal">MW</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>DC Current:</span>
            <span className="text-zinc-200 font-bold">{idcAmps.toFixed(1)} A</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              {isAr ? 'القدرة الردية المستقلة (Q)' : 'Decoupled Reactive (Q)'}
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">
              d-q Decoupled
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {effectiveQ > 0 ? `+${effectiveQ.toFixed(1)}` : effectiveQ.toFixed(1)}{' '}
            <span className="text-xs text-zinc-500 font-normal">MVAR</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>AC Voltage Support:</span>
            <span className="text-emerald-400 font-bold">{effectiveQ > 0 ? 'Boosting +1.8%' : 'Bucking -1.2%'}</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {isAr ? 'الوفر في الفواقد مقارنة بـ AC' : 'Transmission Loss Saving'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {lineLengthKm} km Cable
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {lossSavedMw.toFixed(2)}{' '}
            <span className="text-xs text-zinc-500 font-normal">MW saved</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>HVDC Loss:</span>
            <span className="text-zinc-300 font-bold">{hvdcLossMw.toFixed(2)} MW (vs AC {equivalentHvacLossMw.toFixed(1)}MW)</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isAr ? 'القصور الذاتي الافتراضي (FFR)' : 'Synthetic Inertia FFR'}
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
              H = {syntheticInertiaH}s
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            +{syntheticInertiaPowerMw}{' '}
            <span className="text-xs text-zinc-500 font-normal">MW response</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Response Time:</span>
            <span className="text-emerald-400 font-bold">&lt; 25 ms</span>
          </div>
        </div>
      </div>

      {/* Main Animated Flow & 4-Quadrant Control Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Animated Topology & P-Q Vector Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              {isAr ? 'المخطط الطوبولوجي الحركي لتدفق التيار المستمر' : 'Dynamic MMC Bipole Power Flow Topology'}
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              Firewall Effect: 100% Asynchronous Isolation
            </span>
          </div>

          {/* Animated Canvas */}
          <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={580}
              height={140}
              className="w-full h-[140px] block"
            />
          </div>

          {/* 4-Quadrant P-Q Vector Diagram Card */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-300">{isAr ? 'مخطط الأرباع الأربعة للقدرة (4-Quadrant P-Q Plane)' : '4-Quadrant P-Q Operating Vector'}</span>
              <span className="text-zinc-500 text-[11px]">MMC Current Limit Circle (550 MVA)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-lg border ${effectiveP > 0 && effectiveQ > 0 ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold' : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'}`}>
                <div className="text-[10px]">Quadrant I</div>
                <div>Export + Inductive</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${effectiveP < 0 && effectiveQ > 0 ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold' : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'}`}>
                <div className="text-[10px]">Quadrant II</div>
                <div>Import + Inductive</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${effectiveP < 0 && effectiveQ < 0 ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold' : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'}`}>
                <div className="text-[10px]">Quadrant III</div>
                <div>Import + Capacitive</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${effectiveP > 0 && effectiveQ < 0 ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold' : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'}`}>
                <div className="text-[10px]">Quadrant IV</div>
                <div>Export + Capacitive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Controls & Modes (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            {isAr ? 'عناصر التحكم بالقدرة ونمط التشغيل' : 'HVDC Dispatch Controls & Operating Modes'}
          </h3>

          {/* Operating Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">
              {isAr ? 'نمط عمل المحول (Operating Mode):' : 'Converter Operating Mode:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'GRID_FOLLOWING', label: 'Grid Following' },
                { id: 'GRID_FORMING_BLACK_START', label: 'Grid Forming' },
                { id: 'STATCOM_MODE', label: 'STATCOM (P=0)' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setOpMode(m.id as HvdcOpMode)}
                  className={`py-2 px-1 text-[11px] font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                    opMode === m.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Power P Slider (if not STATCOM) */}
          {opMode !== 'STATCOM_MODE' && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">{isAr ? 'القدرة الفعالة المستهدفة (P):' : 'Active Power Dispatch (P):'}</span>
                <span className="text-cyan-400 font-bold">{activePowerP} MW</span>
              </div>
              <input
                type="range"
                min="-500"
                max="500"
                step="10"
                value={activePowerP}
                onChange={(e) => setActivePowerP(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>-500 MW (Import)</span>
                <span>0 MW</span>
                <span>+500 MW (Export)</span>
              </div>
            </div>
          )}

          {/* Reactive Power Q Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'القدرة الردية المستقلة (Q):' : 'Reactive Power Support (Q):'}</span>
              <span className="text-indigo-400 font-bold">{reactivePowerQ > 0 ? `+${reactivePowerQ}` : reactivePowerQ} MVAR</span>
            </div>
            <input
              type="range"
              min="-250"
              max="250"
              step="5"
              value={reactivePowerQ}
              onChange={(e) => setReactivePowerQ(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>-250 MVAR (Capacitive)</span>
              <span>0 MVAR</span>
              <span>+250 MVAR (Inductive)</span>
            </div>
          </div>

          {/* Synthetic Inertia H Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'ثابت القصور الذاتي الافتراضي (H):' : 'Synthetic Inertia Constant (H):'}</span>
              <span className="text-amber-400 font-bold">{syntheticInertiaH} seconds</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="8.0"
              step="0.5"
              value={syntheticInertiaH}
              onChange={(e) => setSyntheticInertiaH(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
