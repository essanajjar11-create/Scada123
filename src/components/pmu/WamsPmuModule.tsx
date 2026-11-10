import React, { useState, useEffect } from 'react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import { fortescueTransform } from '../../lib/engineering/symmetricalComponents';
import {
  Activity,
  Zap,
  Gauge,
  AlertTriangle,
  Radio,
  Clock,
  Sliders,
  ShieldCheck,
  TrendingDown,
  Compass,
  Layers
} from 'lucide-react';

export const WamsPmuModule: React.FC = () => {
  const { tr1State, tr2State, gridFrequency, t, lang } = useScada();
  const isAr = lang === 'ar';

  const [sampleRate, setSampleRate] = useState<50 | 60>(50);
  const [ptpLock, setPtpLock] = useState<boolean>(true);
  
  // Dynamic PMU values
  const [rocof, setRocof] = useState<number>(0.02); // df/dt Hz/s
  const [pmuTimeQuality, setPmuTimeQuality] = useState<string>('0x00 (Locked <100ns)');
  const [manualPhaseShift, setManualPhaseShift] = useState<number>(12.4); // degrees
  const [manualVoltageDrop, setManualVoltageDrop] = useState<number>(132.0); // kV

  // Derive VSI / L-Index
  // L = | 1 - (V_ref / V_actual) * exp(j * delta_theta) |
  // Simplified mathematical approximation for 132/13.8kV node:
  const vRatio = 132.0 / Math.max(80, manualVoltageDrop);
  const radShift = (manualPhaseShift * Math.PI) / 180;
  const lIndexReal = 1 - vRatio * Math.cos(radShift);
  const lIndexImag = -vRatio * Math.sin(radShift);
  const lIndex = Math.min(1.0, Math.max(0.00, Math.sqrt(lIndexReal * lIndexReal + lIndexImag * lIndexImag)));

  // ROCOF simulation update
  useEffect(() => {
    const interval = setInterval(() => {
      // Small random fluctuation around nominal
      const noise = (Math.random() - 0.48) * 0.08;
      const freqDev = ((gridFrequency ?? 50.0) - 50.0) * 0.15;
      setRocof(parseFloat((freqDev + noise).toFixed(3)));
    }, 1000 / sampleRate);

    return () => clearInterval(interval);
  }, [gridFrequency, sampleRate]);

  // Phasor geometry calculations for polar plot
  const centerX = 140;
  const centerY = 140;
  const radius = 100;

  // 132kV Busbar A Phasor (Reference: Angle 0 deg)
  const v132X = centerX + radius * 0.9 * Math.cos(0);
  const v132Y = centerY - radius * 0.9 * Math.sin(0);

  // 13.8kV Feeder Phasor (Angle: -manualPhaseShift)
  const angleRad = (-manualPhaseShift * Math.PI) / 180;
  const magFactor = ((tr1State?.gridVoltage ?? 132.0) / 132.0) * 0.85;
  const v13X = centerX + radius * magFactor * Math.cos(angleRad);
  const v13Y = centerY - radius * magFactor * Math.sin(angleRad);

  // Current Phasor (Lagging by pf angle ~ 25 deg)
  const currentAngleRad = ((-manualPhaseShift - 25) * Math.PI) / 180;
  const iMagFactor = ((tr1State?.loadCurrent ?? 450) / 300) * 0.75;
  const iX = centerX + radius * iMagFactor * Math.cos(currentAngleRad);
  const iY = centerY - radius * iMagFactor * Math.sin(currentAngleRad);

  // ===== Live Symmetrical Components (Fortescue decomposition of PMU phasors) =====
  // Phase magnitudes come from live telemetry; the measured voltage unbalance
  // splits symmetrically across phases B/C, and the intertie angle error from
  // the collapse-condition slider perturbs phase B — the Fortescue engine then
  // resolves the measured set into V1/V2/V0 exactly as a Class-A PMU would.
  const sequenceComponents = (() => {
    const vLL = manualVoltageDrop;
    const vPhaseBase = vLL / Math.sqrt(3);
    const uPct = tr1State?.voltageUnbalance ?? 0.5;
    const kPos = 1 + uPct / 200;
    const kNeg = 1 - uPct / 200;

    const va = { mag: vPhaseBase, angDeg: 0 };
    const vb = { mag: vPhaseBase * kNeg, angDeg: -120 - manualPhaseShift * 0.1 };
    const vc = { mag: vPhaseBase * kPos, angDeg: 120 };

    return { phases: [va, vb, vc] as const, seq: fortescueTransform(va, vb, vc) };
  })();

  const { seq } = sequenceComponents;
  const v2v1Pct = seq.positive.mag > 0 ? (seq.negative.mag / seq.positive.mag) * 100 : 0;
  const v0v1Pct = seq.positive.mag > 0 ? (seq.zero.mag / seq.positive.mag) * 100 : 0;

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Top Header Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-indigo-950/80 border border-indigo-700/80 rounded-xl text-indigo-400 shrink-0">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                {t('pmu_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono font-extrabold">
                {t('pmu_streaming')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {t('pmu_subtitle')}
            </p>
          </div>
        </div>

        {/* Stream & PTP Controls */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
          <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono text-xs">
            <span className="text-zinc-400 font-bold px-1">{t('pmu_rate_label')}</span>
            <button
              onClick={() => setSampleRate(50)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                sampleRate === 50 ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              50 fps
            </button>
            <button
              onClick={() => setSampleRate(60)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                sampleRate === 60 ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              60 fps
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-800"></div>

          <button
            onClick={() => setPtpLock(!ptpLock)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all ${
              ptpLock
                ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                : 'bg-rose-950 border border-rose-700 text-rose-300 animate-pulse'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>PTP IEEE 1588: {ptpLock ? t('pmu_ptp_locked') : t('pmu_ptp_drift')}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Phasor Diagram & Angle Monitor */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Compass className="w-5 h-5 text-indigo-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase">{t('pmu_polar_diagram')}</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
              IEEE C37.118-2011
            </span>
          </div>

          {/* SVG Polar Plot */}
          <div className="flex justify-center items-center py-2">
            <div className="relative bg-zinc-950 rounded-full border border-zinc-800 p-2 shadow-inner">
              <svg width="280" height="280" className="overflow-visible">
                {/* Concentric Circles */}
                <circle cx={centerX} cy={centerY} r="30" fill="none" stroke="#27272a" strokeDasharray="3 3" />
                <circle cx={centerX} cy={centerY} r="60" fill="none" stroke="#27272a" strokeDasharray="3 3" />
                <circle cx={centerX} cy={centerY} r="90" fill="none" stroke="#3f3f46" strokeWidth="1" />

                {/* Axes */}
                <line x1={centerX - 105} y1={centerY} x2={centerX + 105} y2={centerY} stroke="#3f3f46" strokeWidth="1" />
                <line x1={centerX} y1={centerY - 105} x2={centerX} y2={centerY + 105} stroke="#3f3f46" strokeWidth="1" />

                {/* Degrees Labels */}
                <text x={centerX + 112} y={centerY + 4} fill="#a1a1aa" fontSize="10" fontFamily="monospace">0°</text>
                <text x={centerX - 125} y={centerY + 4} fill="#a1a1aa" fontSize="10" fontFamily="monospace">180°</text>
                <text x={centerX - 10} y={centerY - 112} fill="#a1a1aa" fontSize="10" fontFamily="monospace">90°</text>
                <text x={centerX - 12} y={centerY + 122} fill="#a1a1aa" fontSize="10" fontFamily="monospace">270°</text>

                {/* 132kV Busbar Voltage Vector (Cyan) */}
                <line x1={centerX} y1={centerY} x2={v132X} y2={v132Y} stroke="#06b6d4" strokeWidth="3" markerEnd="url(#arrow-cyan)" />
                <circle cx={v132X} cy={v132Y} r="4" fill="#06b6d4" />

                {/* 13.8kV Voltage Vector (Amber) */}
                <line x1={centerX} y1={centerY} x2={v13X} y2={v13Y} stroke="#f59e0b" strokeWidth="3" />
                <circle cx={v13X} cy={v13Y} r="4" fill="#f59e0b" />

                {/* Current Vector (Emerald) */}
                <line x1={centerX} y1={centerY} x2={iX} y2={iY} stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />
                <circle cx={iX} cy={iY} r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          {/* Legend & Readings */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-2 border-t border-zinc-800/80">
            <div className="bg-zinc-900 p-2 rounded-lg border border-cyan-900/40 space-y-0.5">
              <div className="text-[10px] text-cyan-400 font-bold">{t('pmu_132_bus')}</div>
              <div className="text-white font-bold">{(tr1State?.gridVoltage ?? 132.0).toFixed(1)} kV ∠ 0.0°</div>
            </div>
            <div className="bg-zinc-900 p-2 rounded-lg border border-amber-900/40 space-y-0.5">
              <div className="text-[10px] text-amber-400 font-bold">{t('pmu_13_feeder')}</div>
              <div className="text-white font-bold">13.81 kV ∠ -{manualPhaseShift.toFixed(1)}°</div>
            </div>
          </div>
        </div>

        {/* Column 2: Rate of Change of Frequency (ROCOF - df/dt) */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Gauge className="w-5 h-5 text-amber-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase">{t('pmu_rocof_title')}</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              Math.abs(rocof) > 0.5 ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {Math.abs(rocof) > 0.5
                ? (isAr ? 'خطر تذبذب تردد مرتفع' : 'HIGH ROCOF HAZARD')
                : (isAr ? 'ربط شبكي مستقر' : 'STABLE INTERCONNECT')}
            </span>
          </div>

          {/* Large ROCOF Display */}
          <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 text-center space-y-2 relative overflow-hidden">
            <div className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
              {t('pmu_rocof_rate')}
            </div>

            <div className={`text-4xl font-extrabold font-mono tracking-tight transition-colors ${
              Math.abs(rocof) > 0.5 ? 'text-rose-400' : Math.abs(rocof) > 0.2 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {rocof >= 0 ? `+${rocof.toFixed(3)}` : rocof.toFixed(3)} <span className="text-lg text-zinc-400">Hz/s</span>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 flex justify-center items-center gap-2">
              <span>{t('pmu_grid_freq')}: <strong className="text-white">{(gridFrequency ?? 50.0).toFixed(3)} Hz</strong></span>
              <span>•</span>
              <span>ANSI 81R: <strong className="text-amber-300">±0.50 Hz/s</strong></span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800 mt-2">
              <div
                className={`h-full transition-all duration-300 ${
                  Math.abs(rocof) > 0.5 ? 'bg-rose-500' : Math.abs(rocof) > 0.2 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (Math.abs(rocof) / 1.0) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Early Warning Status Cards */}
          <div className="space-y-2 font-mono text-xs">
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-zinc-300 font-bold block">{t('pmu_ufls_trigger')}:</span>
                <span className="text-[10px] text-zinc-500">{t('pmu_ufls_desc')}</span>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                Math.abs(rocof) > 0.5 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {Math.abs(rocof) > 0.5 ? (isAr ? 'متأهب / فصل' : 'ARMED / TRIPPED') : (isAr ? 'في وضع الاستعداد' : 'STANDBY')}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-zinc-300 font-bold block">{t('pmu_line_loss')}:</span>
                <span className="text-[10px] text-zinc-500">{t('pmu_inertia_eval')}</span>
              </div>
              <span className="text-emerald-400 font-bold text-xs">{isAr ? 'طبيعي' : 'NORMAL'}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Voltage Stability Index (VSI / L-Index) */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase">{t('pmu_lindex_title')}</h3>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
              {isAr ? 'مخاطر انهيار الجهد' : 'VOLTAGE COLLAPSE RISK'}
            </span>
          </div>

          {/* L-Index Main Gauge */}
          <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-400">{t('pmu_critical_lindex')}:</span>
              <span className={`text-xl font-mono font-extrabold px-3 py-0.5 rounded ${
                lIndex >= 0.5 ? 'bg-rose-950 text-rose-300 border border-rose-800' : lIndex >= 0.2 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {lIndex.toFixed(3)}
              </span>
            </div>

            {/* Gauge Slider Bar */}
            <div className="space-y-1">
              <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800 flex">
                <div className="bg-emerald-500 h-full" style={{ width: '20%' }} title="Safe < 0.20"></div>
                <div className="bg-amber-500 h-full" style={{ width: '30%' }} title="Warning 0.20-0.50"></div>
                <div className="bg-rose-500 h-full" style={{ width: '50%' }} title="Collapse > 0.50"></div>
              </div>

              {/* Marker Pointer */}
              <div className="relative h-4">
                <div
                  className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                  style={{ left: `${Math.min(100, lIndex * 100)}%` }}
                >
                  <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]"></div>
                </div>
              </div>
            </div>

            <EquationCard
              title={isAr ? 'مؤشر استقرار الجهد L-Index (كيسل-غلافيتش)' : 'Kessel-Glavitsch Voltage Stability L-Index'}
              standard="IEEE C37.118"
              equation={
                <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse text-cyan-300 font-bold">
                  <span>L<sub>j</sub> = | 1 − </span>
                  <div className="inline-flex flex-col items-center px-1">
                    <span className="border-b border-cyan-400/80 pb-0.5">V<sub>ref</sub></span>
                    <span className="pt-0.5">V<sub>j</sub></span>
                  </div>
                  <span>· e<sup>j · Δθ</sup> |</span>
                </div>
              }
              description={
                isAr
                  ? 'مؤشر نسبي كمي لقياس مدى القرب من انهيار الجهد؛ اقتراب L من 1.0 يشير إلى تدهور حاد غير قابل للاسترداد في الجهد'
                  : 'Per-unit indicator quantifying proximity to voltage collapse; L approach to 1.0 indicates runaway voltage decay'
              }
              variables={[
                { symbol: 'L_j', label: isAr ? 'مؤشر استقرار الجهد L' : 'Voltage Stability L-Index', value: lIndex.toFixed(3) },
                { symbol: 'V_ref', label: isAr ? 'قضيب التغذية المرجعي 132kV' : 'Reference Substation Bus', value: '132.0', unit: 'kV' },
                { symbol: 'V_j', label: isAr ? 'جهد عقدة التوزيع' : 'Distribution Node Voltage', value: manualVoltageDrop.toFixed(1), unit: 'kV' },
                { symbol: 'Δθ', label: isAr ? 'فارق زاوية الطور' : 'Phasor Angle Shift', value: manualPhaseShift.toFixed(1), unit: '°' }
              ]}
              result={{
                label: isAr ? 'حالة استقرار الجهد' : 'Voltage Stability Status',
                value: lIndex.toFixed(3),
                unit: 'p.u.',
                status: lIndex >= 0.5 ? (isAr ? 'انهيار حرج' : 'CRITICAL COLLAPSE') : lIndex >= 0.2 ? (isAr ? 'تحذير' : 'WARNING') : (isAr ? 'مستقر' : 'STABLE'),
                statusColor: lIndex >= 0.5 ? 'bg-rose-950 text-rose-300 border-rose-800' : lIndex >= 0.2 ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }}
            />
          </div>

          {/* Interactive Simulation Sliders */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-3 font-mono text-xs">
            <div className="text-zinc-300 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-indigo-400" /> {t('pmu_collapse_conditions')}:</span>
              <button
                onClick={() => { setManualPhaseShift(12.4); setManualVoltageDrop(132.0); }}
                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                {t('pmu_reset_nominal')}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('pmu_phase_shift')}:</span>
                <span className="text-white font-bold">{manualPhaseShift.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="0.5"
                value={manualPhaseShift}
                onChange={(e) => setManualPhaseShift(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('pmu_hv_bus_v')}:</span>
                <span className="text-white font-bold">{manualVoltageDrop.toFixed(1)} kV</span>
              </div>
              <input
                type="range"
                min="90"
                max="142"
                step="1"
                value={manualVoltageDrop}
                onChange={(e) => setManualVoltageDrop(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Symmetrical Components Panel (Fortescue Decomposition of Live PMU Phasors) */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase">
              {isAr ? 'تفكيك المركبات التماثلية (تحويل فورتيسك)' : 'Symmetrical Components (Fortescue Decomposition)'}
            </h3>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            v2v1Pct > 2 ? 'bg-rose-950 text-rose-300 border border-rose-800' : v2v1Pct > 1 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            {v2v1Pct > 2
              ? (isAr ? 'عدم اتزان حرج V2/V1' : 'CRITICAL UNBALANCE')
              : v2v1Pct > 1
                ? (isAr ? 'عدم اتزان مرتفع' : 'ELEVATED UNBALANCE')
                : (isAr ? 'اتزان مقبول' : 'BALANCED')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'V₁', label: isAr ? 'المركبة الموجبة' : 'Positive Sequence', seqPart: seq.positive, color: 'text-emerald-400', border: 'border-emerald-900/40', note: 'V₁ — rotating field' },
            { key: 'V₂', label: isAr ? 'المركبة السالبة' : 'Negative Sequence', seqPart: seq.negative, color: 'text-rose-400', border: 'border-rose-900/40', note: `${v2v1Pct.toFixed(3)}% of V₁` },
            { key: 'V₀', label: isAr ? 'المركبة الصفرية' : 'Zero Sequence', seqPart: seq.zero, color: 'text-purple-400', border: 'border-purple-900/40', note: `${v0v1Pct.toFixed(3)}% of V₁` },
          ].map((item) => (
            <div key={item.key} className={`bg-zinc-950 p-3.5 rounded-xl border ${item.border} font-mono`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold uppercase ${item.color}`}>{item.label}</span>
                <span className={`text-sm font-extrabold ${item.color}`}>{item.key}</span>
              </div>
              <div className="text-white font-bold text-base">
                {item.seqPart.mag.toFixed(2)} kV ∠ {item.seqPart.angDeg >= 0 ? '+' : ''}{item.seqPart.angDeg.toFixed(1)}°
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{item.note}</div>
            </div>
          ))}
        </div>

        {/* Unbalance factor gauge */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-bold">Negative-Sequence Unbalance Factor (IEC)</span>
            <span className={`font-extrabold ${v2v1Pct > 2 ? 'text-rose-400' : v2v1Pct > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
              ε_u = |V₂|/|V₁| = {v2v1Pct.toFixed(3)} %
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-300 ${v2v1Pct > 2 ? 'bg-rose-500' : v2v1Pct > 1 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (v2v1Pct / 3) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>0%</span>
            <span>Limit 1% (HV intertie guidance)</span>
            <span>3%+</span>
          </div>
        </div>

        <EquationCard
          title={isAr ? 'معادلات فورتيسك للمركبات التماثلية' : 'Fortescue Symmetrical Component Equations'}
          standard="IEEE C37.118"
          equation={
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-cyan-300 font-bold flex-wrap">
              <span>V₁ = ⅓(V_a + a·V_b + a²·V_c)</span>
              <span className="text-zinc-600">•</span>
              <span>V₂ = ⅓(V_a + a²·V_b + a·V_c)</span>
              <span className="text-zinc-600">•</span>
              <span>V₀ = ⅓(V_a + V_b + V_c)</span>
            </div>
          }
          description={
            isAr
              ? 'يفصل تحويل فورتيسك مجموعة الفازات الثلاث غير المتزنة إلى ثلاث مجموعات متزنة؛ تُحسب لحظياً من فيزورات PMU الحية مع عامل عدم الاتزان εᵤ وفق تعريف IEC.'
              : 'Decouples any unbalanced three-phase set into three independent balanced sets; computed live from PMU phasors with the IEC negative-sequence unbalance factor.'
          }
          variables={[
            { symbol: 'εᵤ', label: isAr ? 'عامل عدم الاتزان' : 'Unbalance factor', value: v2v1Pct.toFixed(3), unit: '%' },
            { symbol: '|V₁|', label: isAr ? 'جهد الموجبة' : 'Positive-seq magnitude', value: seq.positive.mag.toFixed(2), unit: 'kV' },
            { symbol: '|V₂|', label: isAr ? 'جهد السالبة' : 'Negative-seq magnitude', value: seq.negative.mag.toFixed(3), unit: 'kV' },
            { symbol: '|V₀|', label: isAr ? 'جهد الصفرية' : 'Zero-seq magnitude', value: seq.zero.mag.toFixed(3), unit: 'kV' }
          ]}
          result={{
            label: isAr ? 'حالة اتزان الجهد' : 'Phase Balance Status',
            value: v2v1Pct.toFixed(3),
            unit: '%',
            status: v2v1Pct > 2 ? (isAr ? 'حرج' : 'CRITICAL') : v2v1Pct > 1 ? (isAr ? 'تحذير' : 'WARNING') : (isAr ? 'متوازن' : 'BALANCED'),
            statusColor: v2v1Pct > 2 ? 'bg-rose-950 text-rose-300 border-rose-800' : v2v1Pct > 1 ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
          }}
        />
      </div>
    </div>
  );
};
