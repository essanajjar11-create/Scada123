import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';

export const DifferentialProtectionModule: React.FC = () => {
  const { addAuditLog, t, lang } = useScada();
  const isAr = lang === 'ar';

  // ANSI 87T Relay Characteristic Settings (in p.u.)
  const [is1Pickup, setIs1Pickup] = useState<number>(0.30); // Is1 (0.2 - 0.5 p.u.)
  const [slope1Pct, setSlope1Pct] = useState<number>(25); // Slope 1 (15 - 40%)
  const [is2Break, setIs2Break] = useState<number>(2.0); // Is2 breakpoint (1.0 - 3.0 p.u.)
  const [slope2Pct, setSlope2Pct] = useState<number>(60); // Slope 2 (50 - 90%)
  const [iInstPickup, setIInstPickup] = useState<number>(8.0); // Instantaneous Unrestrained (p.u.)

  // Harmonic Restraint Thresholds
  const [harm2ThresholdPct, setHarm2ThresholdPct] = useState<number>(15); // 2nd Harmonic Inrush (15%)
  const [harm5ThresholdPct, setHarm5ThresholdPct] = useState<number>(30); // 5th Harmonic Overexcitation (30%)

  // Test Currents & Harmonics Injection
  const [i1Mag, setI1Mag] = useState<number>(1.0); // HV Side Current (p.u.)
  const [i1AngleDeg, setI1AngleDeg] = useState<number>(0);
  const [i2Mag, setI2Mag] = useState<number>(1.0); // LV Side Current (p.u.)
  const [i2AngleDeg, setI2AngleDeg] = useState<number>(180); // 180 deg under normal through-load
  const [harm2Pct, setHarm2Pct] = useState<number>(2.0); // 2nd harmonic %
  const [harm5Pct, setHarm5Pct] = useState<number>(1.0); // 5th harmonic %

  // Vector Current Calculations
  const i1Rad = (i1AngleDeg * Math.PI) / 180;
  const i2Rad = (i2AngleDeg * Math.PI) / 180;

  const i1Re = i1Mag * Math.cos(i1Rad);
  const i1Im = i1Mag * Math.sin(i1Rad);

  const i2Re = i2Mag * Math.cos(i2Rad);
  const i2Im = i2Mag * Math.sin(i2Rad);

  // Vector Sum for Differential Current: Idiff = |I1 + I2|
  const iDiffRe = i1Re + i2Re;
  const iDiffIm = i1Im + i2Im;
  const iDiff = Math.sqrt(iDiffRe * iDiffRe + iDiffIm * iDiffIm);

  // Restraint / Bias Current: Ibias = (|I1| + |I2|) / 2
  const iBias = (i1Mag + i2Mag) / 2;

  // Differential Threshold Evaluation at current Ibias:
  // Idiff_thresh(Ibias) =
  //   if Ibias <= Is1 -> Is1
  //   if Is1 < Ibias <= Is2 -> Is1 + (Slope1/100) * (Ibias - Is1)
  //   if Ibias > Is2 -> Is1 + (Slope1/100) * (Is2 - Is1) + (Slope2/100) * (Ibias - Is2)
  const calcIdiffThreshold = (ib: number): number => {
    if (ib <= is1Pickup) {
      return is1Pickup;
    } else if (ib <= is2Break) {
      return is1Pickup + (slope1Pct / 100) * (ib - is1Pickup);
    } else {
      const atBreak = is1Pickup + (slope1Pct / 100) * (is2Break - is1Pickup);
      return atBreak + (slope2Pct / 100) * (ib - is2Break);
    }
  };

  const idiffThreshCurrent = calcIdiffThreshold(iBias);

  // Harmonic Restraint Flags
  const is2ndHarmonicBlocked = harm2Pct >= harm2ThresholdPct;
  const is5thHarmonicBlocked = harm5Pct >= harm5ThresholdPct;
  const isHarmonicBlocked = is2ndHarmonicBlocked || is5thHarmonicBlocked;

  // Instantaneous Unrestrained Trip
  const isInstantaneousTrip = iDiff >= iInstPickup;

  // Tripping Decision
  let relayState: 'TRIP' | 'INST_TRIP' | 'BLOCKED_INRUSH' | 'BLOCKED_OVERFLUX' | 'RESTRAINED';

  if (isInstantaneousTrip) {
    relayState = 'INST_TRIP';
  } else if (iDiff > idiffThreshCurrent) {
    if (is2ndHarmonicBlocked) {
      relayState = 'BLOCKED_INRUSH';
    } else if (is5thHarmonicBlocked) {
      relayState = 'BLOCKED_OVERFLUX';
    } else {
      relayState = 'TRIP';
    }
  } else {
    relayState = 'RESTRAINED';
  }

  // Preset Test Scenarios
  const applyPreset = (scenario: 'normal' | 'external_fault' | 'ct_saturation' | 'internal_fault' | 'inrush' | 'overflux') => {
    if (scenario === 'normal') {
      setI1Mag(1.0);
      setI1AngleDeg(0);
      setI2Mag(1.0);
      setI2AngleDeg(180);
      setHarm2Pct(2);
      setHarm5Pct(1);
    } else if (scenario === 'external_fault') {
      setI1Mag(5.0);
      setI1AngleDeg(0);
      setI2Mag(4.9);
      setI2AngleDeg(180);
      setHarm2Pct(1);
      setHarm5Pct(1);
    } else if (scenario === 'ct_saturation') {
      setI1Mag(6.5);
      setI1AngleDeg(0);
      setI2Mag(4.8);
      setI2AngleDeg(170);
      setHarm2Pct(3);
      setHarm5Pct(2);
    } else if (scenario === 'internal_fault') {
      setI1Mag(3.8);
      setI1AngleDeg(0);
      setI2Mag(2.2);
      setI2AngleDeg(15);
      setHarm2Pct(4);
      setHarm5Pct(1);
    } else if (scenario === 'inrush') {
      setI1Mag(4.5);
      setI1AngleDeg(0);
      setI2Mag(0.0);
      setI2AngleDeg(180);
      setHarm2Pct(24); // 24% 2nd Harmonic Inrush
      setHarm5Pct(2);
    } else if (scenario === 'overflux') {
      setI1Mag(2.0);
      setI1AngleDeg(0);
      setI2Mag(0.5);
      setI2AngleDeg(160);
      setHarm2Pct(3);
      setHarm5Pct(36); // 36% 5th Harmonic
    }
  };

  // SVG Coordinates Transformation (Width 520, Height 380)
  // Ibias range: 0 -> 10 p.u. (X: 50 -> 480 px, scaleX = 43 px/pu)
  // Idiff range: 0 -> 10 p.u. (Y: 340 -> 30 px, scaleY = 31 px/pu)
  const toSvgX = (ib: number) => 50 + ib * 43;
  const toSvgY = (id: number) => 340 - id * 31;

  // Build Dual Slope Curve Path points
  const p0 = `${toSvgX(0)},${toSvgY(is1Pickup)}`;
  const p1 = `${toSvgX(is1Pickup)},${toSvgY(is1Pickup)}`;
  const pBreak = `${toSvgX(is2Break)},${toSvgY(calcIdiffThreshold(is2Break))}`;
  const pMax = `${toSvgX(10)},${toSvgY(calcIdiffThreshold(10))}`;
  const pInst = `${toSvgX(10)},${toSvgY(iInstPickup)}`;
  const pInstLeft = `${toSvgX(0)},${toSvgY(iInstPickup)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/60 border border-cyan-800/60 rounded-xl text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {isAr ? 'منحنى الحماية التفاضلية للمحول ANSI 87T (Dual-Slope)' : 'Transformer Differential Protection ANSI 87T (Dual Slope & Harmonic Restraint)'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                50 MVA TRANSFORMER
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'مخطط النسبة المئوية للتيار التفاضلي Idiff مقابل تيار الكبح Ibias مع حجب تيار الاندفاع التوافقي الثاني والخامس'
                : 'Interactive Dual-Slope percentage differential curve (Is1, K1, Is2, K2) with 2nd/5th harmonic inrush cross-blocking'}
            </p>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl font-mono text-[11px]">
          <button
            onClick={() => applyPreset('normal')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
          >
            Normal Load
          </button>
          <button
            onClick={() => applyPreset('external_fault')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
          >
            Ext Fault
          </button>
          <button
            onClick={() => applyPreset('ct_saturation')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
          >
            CT Saturation
          </button>
          <button
            onClick={() => applyPreset('internal_fault')}
            className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition-all cursor-pointer font-bold"
          >
            Internal Fault
          </button>
          <button
            onClick={() => applyPreset('inrush')}
            className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-all cursor-pointer"
          >
            Inrush (2nd)
          </button>
          <button
            onClick={() => applyPreset('overflux')}
            className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 transition-all cursor-pointer"
          >
            Overflux (5th)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Dual-Slope Plane Canvas */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {isAr ? 'مستوى التيار التفاضلي Idiff مقابل تيار الكبح Ibias' : 'Idiff vs Ibias Characteristic Plane'}
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-red-400">■ Trip Operating Region</span>
              <span className="text-emerald-400">■ Restrain Region</span>
            </div>
          </div>

          {/* SVG Diagram */}
          <div className="flex justify-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 relative overflow-hidden">
            <svg width="510" height="380" viewBox="0 0 510 380" className="select-none font-mono">
              {/* Grid Lines */}
              {[0, 2, 4, 6, 8, 10].map((val) => (
                <g key={`grid-x-${val}`}>
                  <line
                    x1={toSvgX(val)}
                    y1="30"
                    x2={toSvgX(val)}
                    y2="340"
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <text x={toSvgX(val) - 4} y="358" fill="#71717a" fontSize="10">{val}</text>
                </g>
              ))}
              {[0, 2, 4, 6, 8, 10].map((val) => (
                <g key={`grid-y-${val}`}>
                  <line
                    x1="50"
                    y1={toSvgY(val)}
                    x2="480"
                    y2={toSvgY(val)}
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <text x="30" y={toSvgY(val) + 4} fill="#71717a" fontSize="10">{val}</text>
                </g>
              ))}

              {/* Axis */}
              <line x1="50" y1="340" x2="480" y2="340" stroke="#71717a" strokeWidth="2" />
              <line x1="50" y1="30" x2="50" y2="340" stroke="#71717a" strokeWidth="2" />

              <text x="440" y="330" fill="#a1a1aa" fontSize="11" fontWeight="bold">Ibias (p.u.)</text>
              <text x="60" y="45" fill="#a1a1aa" fontSize="11" fontWeight="bold">Idiff (p.u.)</text>

              {/* Trip Region Polygon Fill */}
              <polygon
                points={`
                  ${p0}
                  ${p1}
                  ${pBreak}
                  ${pMax}
                  ${toSvgX(10)},${toSvgY(10)}
                  ${toSvgX(0)},${toSvgY(10)}
                `}
                fill="rgba(239, 68, 68, 0.12)"
              />

              {/* Restrain Region Polygon Fill */}
              <polygon
                points={`
                  ${p0}
                  ${p1}
                  ${pBreak}
                  ${pMax}
                  ${toSvgX(10)},${toSvgY(0)}
                  ${toSvgX(0)},${toSvgY(0)}
                `}
                fill="rgba(16, 185, 129, 0.10)"
              />

              {/* Dual Slope Boundary Characteristic Line */}
              <polyline
                points={`${p0} ${p1} ${pBreak} ${pMax}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
              />

              {/* Instantaneous Unrestrained Differential Line */}
              <line
                x1={toSvgX(0)}
                y1={toSvgY(iInstPickup)}
                x2={toSvgX(10)}
                y2={toSvgY(iInstPickup)}
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text x={toSvgX(6.2)} y={toSvgY(iInstPickup) - 6} fill="#f43f5e" fontSize="10" fontWeight="bold">
                Unrestrained Inst Idiff ≥ {iInstPickup} p.u.
              </text>

              {/* Breakpoint annotation */}
              <circle cx={toSvgX(is2Break)} cy={toSvgY(calcIdiffThreshold(is2Break))} r="4" fill="#06b6d4" />
              <text x={toSvgX(is2Break) + 6} y={toSvgY(calcIdiffThreshold(is2Break)) + 14} fill="#06b6d4" fontSize="10">
                Break Is2 ({is2Break} p.u.)
              </text>

              {/* Slope Annotations */}
              <text x={toSvgX(1.1)} y={toSvgY(is1Pickup + 0.35)} fill="#38bdf8" fontSize="10">
                Slope 1: {slope1Pct}%
              </text>
              <text x={toSvgX(5.5)} y={toSvgY(calcIdiffThreshold(5.5) + 0.4)} fill="#38bdf8" fontSize="10">
                Slope 2: {slope2Pct}%
              </text>

              {/* Current Operating Point Point (Ibias, Idiff) */}
              <circle
                cx={toSvgX(Math.min(10, iBias))}
                cy={toSvgY(Math.min(10, iDiff))}
                r="7"
                fill={relayState.startsWith('TRIP') || relayState === 'INST_TRIP' ? '#ef4444' : relayState.startsWith('BLOCKED') ? '#f59e0b' : '#10b981'}
                className="animate-ping"
                opacity="0.75"
              />
              <circle
                cx={toSvgX(Math.min(10, iBias))}
                cy={toSvgY(Math.min(10, iDiff))}
                r="5"
                fill={relayState.startsWith('TRIP') || relayState === 'INST_TRIP' ? '#ef4444' : relayState.startsWith('BLOCKED') ? '#f59e0b' : '#10b981'}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={toSvgX(Math.min(10, iBias)) + 8}
                y={toSvgY(Math.min(10, iDiff)) - 4}
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                Op Point ({iBias.toFixed(2)}, {iDiff.toFixed(2)} p.u.)
              </text>
            </svg>
          </div>

          {/* Tripping Verdict Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
            relayState === 'INST_TRIP'
              ? 'bg-red-950/60 border-red-600 text-red-300'
              : relayState === 'TRIP'
              ? 'bg-rose-950/40 border-rose-600 text-rose-300'
              : relayState === 'BLOCKED_INRUSH'
              ? 'bg-amber-950/40 border-amber-600 text-amber-300'
              : relayState === 'BLOCKED_OVERFLUX'
              ? 'bg-purple-950/40 border-purple-600 text-purple-300'
              : 'bg-emerald-950/30 border-emerald-700 text-emerald-300'
          }`}>
            <div className="flex items-center gap-3">
              {relayState === 'INST_TRIP' || relayState === 'TRIP' ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : relayState.startsWith('BLOCKED') ? (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
              <div>
                <div className="font-bold text-sm text-white">
                  {relayState === 'INST_TRIP' && 'ANSI 87T INSTANTANEOUS UNRESTRAINED TRIP'}
                  {relayState === 'TRIP' && 'ANSI 87T DIFFERENTIAL TRIP (OPERATING REGION)'}
                  {relayState === 'BLOCKED_INRUSH' && 'TRIP BLOCKED: 2ND HARMONIC MAGNETIZING INRUSH'}
                  {relayState === 'BLOCKED_OVERFLUX' && 'TRIP BLOCKED: 5TH HARMONIC OVER-EXCITATION'}
                  {relayState === 'RESTRAINED' && 'ANSI 87T NORMAL RESTRAIN (STABLE)'}
                </div>
                <div className="text-[11px] text-zinc-300">
                  {relayState.startsWith('BLOCKED')
                    ? `Harmonics active: 2nd = ${harm2Pct}% (Limit ${harm2ThresholdPct}%) | 5th = ${harm5Pct}% (Limit ${harm5ThresholdPct}%)`
                    : `Idiff = ${iDiff.toFixed(3)} p.u. vs Threshold = ${idiffThreshCurrent.toFixed(3)} p.u.`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-500 uppercase">Restraint Margin</div>
              <div className="text-sm font-black text-white">
                {(idiffThreshCurrent - iDiff).toFixed(2)} p.u.
              </div>
            </div>
          </div>
        </div>

        {/* Currents Injection & Setting Sliders */}
        <div className="lg:col-span-5 space-y-6">
          {/* Primary & Secondary Current Injection */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              {isAr ? 'حقن تيارات الملف الابتدائي والثانوي' : 'HV / LV Terminal Current Injection'}
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>|I₁| Primary:</span>
                    <span className="font-bold text-white">{i1Mag.toFixed(2)} p.u.</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={i1Mag}
                    onChange={(e) => setI1Mag(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>∠I₁ Angle:</span>
                    <span className="font-bold text-white">{i1AngleDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={i1AngleDeg}
                    onChange={(e) => setI1AngleDeg(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>|I₂| Secondary:</span>
                    <span className="font-bold text-white">{i2Mag.toFixed(2)} p.u.</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={i2Mag}
                    onChange={(e) => setI2Mag(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>∠I₂ Angle:</span>
                    <span className="font-bold text-white">{i2AngleDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={i2AngleDeg}
                    onChange={(e) => setI2AngleDeg(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Harmonics Injection */}
              <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>2nd Harm (Inrush):</span>
                    <span className={`font-bold ${harm2Pct >= harm2ThresholdPct ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {harm2Pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={harm2Pct}
                    onChange={(e) => setHarm2Pct(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>5th Harm (Overflux):</span>
                    <span className={`font-bold ${harm5Pct >= harm5ThresholdPct ? 'text-purple-400' : 'text-zinc-300'}`}>
                      {harm5Pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={harm5Pct}
                    onChange={(e) => setHarm5Pct(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Characteristic Settings Sliders */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {isAr ? 'معايير المنحنى المزدوج 87T' : '87T Dual-Slope Characteristic Settings'}
            </span>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-zinc-400">Pickup Is1: <strong>{is1Pickup.toFixed(2)} p.u.</strong></span>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={is1Pickup}
                  onChange={(e) => setIs1Pickup(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div>
                <span className="text-zinc-400">Slope 1: <strong>{slope1Pct}%</strong></span>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={slope1Pct}
                  onChange={(e) => setSlope1Pct(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div>
                <span className="text-zinc-400">Break Is2: <strong>{is2Break.toFixed(1)} p.u.</strong></span>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.5"
                  value={is2Break}
                  onChange={(e) => setIs2Break(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div>
                <span className="text-zinc-400">Slope 2: <strong>{slope2Pct}%</strong></span>
                <input
                  type="range"
                  min="40"
                  max="90"
                  value={slope2Pct}
                  onChange={(e) => setSlope2Pct(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Equation Card */}
          <EquationCard
            title={isAr ? '?????? ??????? ????????? ????????' : 'Transformer Dual-Slope Differential Equation'}
            equation="I_diff = |I₁′ + I₂′| ,  I_bias = ( |I₁′| + |I₂′| ) / 2"
            description={
              isAr
                ? 'يضمن الميل المزدوج عدم الفصل الخاطئ أثناء الأعطال الخارجية الشديدة مع تشبع محولات التيار CT ومغير الجهد OLTC'
                : 'Slope 1 covers OLTC voltage tap variations and basic CT error. Slope 2 stabilizes the relay against heavy external through-faults with severe CT saturation.'
            }
          />
        </div>
      </div>
    </div>
  );
};
