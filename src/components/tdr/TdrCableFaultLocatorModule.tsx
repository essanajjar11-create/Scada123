import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Activity,
  Zap,
  Radio,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileSpreadsheet,
  Target,
  Sparkles,
  Layers
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

type CableDielectric = 'XLPE' | 'EPR' | 'PILC';
type FaultType = 'SHORT_CIRCUIT' | 'OPEN_CIRCUIT' | 'SPLICE_JOINT' | 'WATER_TREE';

export const TdrCableFaultLocatorModule: React.FC = () => {
  const { isArabic: isAr, addSoeEvent, addToast } = useScada();

  // Cable parameters
  const [dielectric, setDielectric] = useState<CableDielectric>('XLPE');
  const [voltageKv, setVoltageKv] = useState<132 | 13.8>(132);
  const [totalCableLengthMeters, setTotalCableLengthMeters] = useState<number>(4500); // 4.5 km
  const [faultType, setFaultType] = useState<FaultType>('SHORT_CIRCUIT');
  const [actualFaultDistanceMeters, setActualFaultDistanceMeters] = useState<number>(2340); // 2.34 km
  const [manualCursorTimeUs, setManualCursorTimeUs] = useState<number>(23.66); // Cursor 2 position in microseconds
  const [pulseWidthNs, setPulseWidthNs] = useState<number>(100); // 100ns pulse

  // Physical constants
  const c = 299.792458; // speed of light in m/μs (299.792 km/ms)
  const epsilonRMap: Record<CableDielectric, number> = {
    XLPE: 2.3, // Cross-linked polyethylene
    EPR: 3.0, // Ethylene propylene rubber
    PILC: 3.5 // Paper-insulated lead covered
  };

  // Propagation velocity v = c / sqrt(epsilon_r) in m/μs
  const propagationVelocity = useMemo(() => {
    const eps = epsilonRMap[dielectric];
    return c / Math.sqrt(eps);
  }, [dielectric]);

  // Velocity of propagation as % of speed of light (VOP %)
  const vopPercent = useMemo(() => {
    return ((propagationVelocity / c) * 100).toFixed(2);
  }, [propagationVelocity]);

  // Reflection coefficient Gamma = (Z_fault - Z0) / (Z_fault + Z0)
  const reflectionCoefficient = useMemo(() => {
    switch (faultType) {
      case 'SHORT_CIRCUIT':
        return -1.0;
      case 'OPEN_CIRCUIT':
        return 1.0;
      case 'SPLICE_JOINT':
        return 0.22;
      case 'WATER_TREE':
        return -0.45;
    }
  }, [faultType]);

  // Theoretical exact time to fault echo: delta_t = (2 * d) / v
  const exactTimeToFaultUs = useMemo(() => {
    return (2 * actualFaultDistanceMeters) / propagationVelocity;
  }, [actualFaultDistanceMeters, propagationVelocity]);

  // Total cable end reflection time
  const totalCableEndEchoTimeUs = useMemo(() => {
    return (2 * totalCableLengthMeters) / propagationVelocity;
  }, [totalCableLengthMeters, propagationVelocity]);

  // Distance calculated from manual user cursor
  const calculatedCursorDistanceMeters = useMemo(() => {
    return (propagationVelocity * manualCursorTimeUs) / 2;
  }, [propagationVelocity, manualCursorTimeUs]);

  const cursorErrorMeters = useMemo(() => {
    return calculatedCursorDistanceMeters - actualFaultDistanceMeters;
  }, [calculatedCursorDistanceMeters, actualFaultDistanceMeters]);

  // Canvas Oscilloscope Waveform Renderer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center Baseline
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Time span of the display (0 to totalCableEndEchoTimeUs * 1.15)
    const maxTimeUs = Math.max(30, totalCableEndEchoTimeUs * 1.15);

    // Draw Waveform
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8'; // Cyan oscilloscope trace
    ctx.lineWidth = 2.5;

    for (let px = 0; px < width; px++) {
      const t = (px / width) * maxTimeUs;
      let voltage = 0;

      // 1. Initial Outgoing Launch Pulse at t = 0 (positive 100V peak)
      const t0Pulse = Math.exp(-Math.pow((t - 0.4) / 0.25, 2)) * 75;
      voltage += t0Pulse;

      // 2. Fault Echo Pulse at exactTimeToFaultUs
      const attenuation = Math.exp(-0.02 * actualFaultDistanceMeters / 1000);
      const faultEcho =
        Math.exp(-Math.pow((t - exactTimeToFaultUs) / (pulseWidthNs / 300), 2)) *
        (70 * reflectionCoefficient * attenuation);
      voltage += faultEcho;

      // 3. End of Cable Reflection (if fault doesn't fully short it)
      if (faultType !== 'SHORT_CIRCUIT') {
        const endAttenuation = Math.exp(-0.04 * totalCableLengthMeters / 1000);
        const endEcho =
          Math.exp(-Math.pow((t - totalCableEndEchoTimeUs) / 0.5, 2)) * (55 * endAttenuation);
        voltage += endEcho;
      }

      // Add slight noise floor
      voltage += (Math.sin(px * 0.4) + Math.cos(px * 0.8)) * 0.8;

      const y = centerY - voltage;
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Draw Cursor 1 (T0 Launch Reference: Cyan)
    const c1X = (0.4 / maxTimeUs) * width;
    ctx.strokeStyle = '#06b6d4';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(c1X, 0);
    ctx.lineTo(c1X, height);
    ctx.stroke();

    // Draw Cursor 2 (Fault Marker: Amber)
    const c2X = (manualCursorTimeUs / maxTimeUs) * width;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c2X, 0);
    ctx.lineTo(c2X, height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Cursor Labels
    ctx.fillStyle = '#06b6d4';
    ctx.font = '10px monospace';
    ctx.fillText('T₀ Launch', c1X + 4, 20);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Cursor 2: ${manualCursorTimeUs.toFixed(2)} μs`, c2X + 4, 35);
  }, [
    dielectric,
    totalCableLengthMeters,
    faultType,
    actualFaultDistanceMeters,
    manualCursorTimeUs,
    exactTimeToFaultUs,
    totalCableEndEchoTimeUs,
    reflectionCoefficient,
    pulseWidthNs
  ]);

  const snapCursorToFault = () => {
    setManualCursorTimeUs(Number(exactTimeToFaultUs.toFixed(2)));
    addSoeEvent(
      `TDR Auto-Track: Snapped to echo at ${exactTimeToFaultUs.toFixed(2)}µs (${actualFaultDistanceMeters}m)`,
      'TDR_LOCATOR',
      'Cable Fault Locator',
      'INFO'
    );
    addToast(
      isAr
        ? `تم محاذاة المؤشر على نقطة العطل بدقة: ${actualFaultDistanceMeters} م`
        : `Auto-Aligned Cursor to Fault Echo at ${actualFaultDistanceMeters} m`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950/40 via-zinc-900 to-indigo-950/40 border border-sky-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'محاكي تحديد أعطال الكابلات الأرضية (TDR Cable Fault Locator)' : 'Time Domain Reflectometry (TDR) Cable Fault Locator'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-bold">
                    IEEE 1234 / ICEA S-94-649
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'تحليل انعكاس النبضات الكهرومغناطيسية عالي الدقة لكابلات 132kV و 13.8kV • قياس زمن العبور وسرعة الانتشار'
                    : 'Sub-nanosecond EM Wave Reflection • Velocity of Propagation (VOP) • Impedance Discontinuity Diagnostics'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={snapCursorToFault}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-sky-600/25 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isAr ? 'محاذاة تلقائية على العطل' : 'Auto-Snap Cursor to Echo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span>{isAr ? 'سرعة الانتشار (v)' : 'Propagation Velocity (v)'}</span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded">
              VOP: {vopPercent}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {propagationVelocity.toFixed(2)}{' '}
            <span className="text-xs text-zinc-500 font-normal">m/μs</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Permittivity (εᵣ):</span>
            <span className="text-zinc-200 font-bold">{epsilonRMap[dielectric]}</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span>{isAr ? 'المسافة المحسوبة بالمؤشر' : 'Cursor Measured Distance'}</span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
              {manualCursorTimeUs.toFixed(2)} μs
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {calculatedCursorDistanceMeters.toFixed(1)}{' '}
            <span className="text-xs text-zinc-500 font-normal">meters</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Actual Location:</span>
            <span className="text-zinc-200 font-bold">{actualFaultDistanceMeters.toFixed(1)} m</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span>{isAr ? 'معامل الانعكاس (Γ)' : 'Reflection Coeff (Γ)'}</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">
              {faultType}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {reflectionCoefficient > 0 ? `+${reflectionCoefficient.toFixed(2)}` : reflectionCoefficient.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Echo Polarity:</span>
            <span className={reflectionCoefficient < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {reflectionCoefficient < 0 ? 'Negative (Short/Zf<Z0)' : 'Positive (Open/Zf>Z0)'}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span>{isAr ? 'دقة القياس والخطأ' : 'Measurement Accuracy'}</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ±0.05m Limit
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${Math.abs(cursorErrorMeters) < 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {cursorErrorMeters > 0 ? `+${cursorErrorMeters.toFixed(1)}` : cursorErrorMeters.toFixed(1)}{' '}
            <span className="text-xs text-zinc-500 font-normal">m delta</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Total Cable Length:</span>
            <span className="text-zinc-200 font-bold">{totalCableLengthMeters} m</span>
          </div>
        </div>
      </div>

      {/* Main Oscilloscope & Control Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Oscilloscope Screen (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              {isAr ? 'راسم الإشارة الرقمي لانعكاس النبضات (TDR Scope)' : 'High-Speed TDR Waveform Oscilloscope'}
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              10 GS/s Digital Sampling
            </span>
          </div>

          <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={720}
              height={260}
              className="w-full h-[260px] block"
            />
          </div>

          {/* Draggable Cursor 2 Control Slider */}
          <div className="space-y-1.5 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">{isAr ? 'موضع المؤشر اليدوي (Cursor 2):' : 'Adjust Measurement Cursor 2:'}</span>
              <span className="text-white font-bold">{manualCursorTimeUs.toFixed(2)} μs ({calculatedCursorDistanceMeters.toFixed(1)} m)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max={Math.max(30, totalCableEndEchoTimeUs * 1.15)}
              step="0.05"
              value={manualCursorTimeUs}
              onChange={(e) => setManualCursorTimeUs(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Physics Formulation & Cable Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            {isAr ? 'معلمات الكابل ونوع العطل' : 'Cable Under Test (CUT) Parameters'}
          </h3>

          {/* Dielectric Material Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">
              {isAr ? 'نوع العازل وسماحية المادة (εᵣ):' : 'Insulation Dielectric Material (εᵣ):'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['XLPE', 'EPR', 'PILC'] as const).map((mat) => (
                <button
                  key={mat}
                  onClick={() => setDielectric(mat)}
                  className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    dielectric === mat
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/25'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mat} (εᵣ={epsilonRMap[mat]})
                </button>
              ))}
            </div>
          </div>

          {/* Fault Type Selector */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <label className="text-xs font-mono text-zinc-400 block">
              {isAr ? 'طبيعة العطل المحاكى:' : 'Simulated Discontinuity / Fault Type:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'SHORT_CIRCUIT', label: 'Short Circuit (Γ=-1.0)' },
                { id: 'OPEN_CIRCUIT', label: 'Open Circuit (Γ=+1.0)' },
                { id: 'SPLICE_JOINT', label: 'Splice Mismatch (Γ=+0.22)' },
                { id: 'WATER_TREE', label: 'Water Treeing (Γ=-0.45)' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFaultType(item.id as FaultType)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer text-left ${
                    faultType === item.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'موقع العطل الحقيقي:' : 'Injected Fault Distance:'}</span>
              <span className="text-sky-400 font-bold">{actualFaultDistanceMeters} m</span>
            </div>
            <input
              type="range"
              min="100"
              max={totalCableLengthMeters - 100}
              step="10"
              value={actualFaultDistanceMeters}
              onChange={(e) => setActualFaultDistanceMeters(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Mathematical Formulations Card */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-2 font-mono text-xs text-zinc-300">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'معادلات الرادار الزمني TDR' : 'TDR Governing Wave Equations'}
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1">
              <div>Velocity: <strong className="text-zinc-200">v = c / √εᵣ</strong></div>
              <div>Distance: <strong className="text-emerald-300">d = (v · Δt) / 2</strong></div>
              <div>Reflection: <strong className="text-indigo-300">Γ = (Z_fault - Z₀) / (Z_fault + Z₀)</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
