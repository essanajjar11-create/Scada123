import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Activity,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Gauge,
  Radio,
  Power
} from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';
import { HvdcControlMode } from '../../../types/scada';
import { soundEngine } from '../../../lib/soundEngine';

interface HvdcPqCapabilityModalProps {
  onClose: () => void;
}

export const HvdcPqCapabilityModal: React.FC<HvdcPqCapabilityModalProps> = ({ onClose }) => {
  const { hvdcState, setHvdcSetpoints, setHvdcControlMode, t, lang } = useScada();
  const isAr = lang === 'ar';

  const [pVal, setPVal] = useState<number>(hvdcState.pRefMW || 120);
  const [qVal, setQVal] = useState<number>(hvdcState.qRefMVAR || 25);
  const [selectedMode, setSelectedMode] = useState<HvdcControlMode>(hvdcState.controlMode || 'CONST_P');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG coordinate dimensions
  const SVG_SIZE = 340;
  const CENTER = SVG_SIZE / 2;
  const SCALE = 0.65; // scale from MW/MVAR to pixels

  const S_MAX = 220; // 220 MVA converter rating
  const P_LIMIT = 200; // ±200 MW thermal limit
  const Q_LIMIT = 100; // ±100 MVAR reactive capability limit

  // Current apparent power
  const apparentMva = Math.sqrt(pVal * pVal + qVal * qVal);
  const powerFactor = apparentMva > 0 ? Math.abs(pVal) / apparentMva : 1.0;
  const isOverCapability = apparentMva > S_MAX;

  // Convert P, Q coordinates to SVG X, Y
  const toSvgX = (q: number) => CENTER + q * SCALE;
  const toSvgY = (p: number) => CENTER - p * SCALE;

  // Convert SVG X, Y to P, Q
  const fromSvgCoords = useCallback((svgX: number, svgY: number) => {
    const qRaw = (svgX - CENTER) / SCALE;
    const pRaw = (CENTER - svgY) / SCALE;

    const clampedP = Math.max(-P_LIMIT, Math.min(P_LIMIT, Math.round(pRaw)));
    const clampedQ = Math.max(-Q_LIMIT, Math.min(Q_LIMIT, Math.round(qRaw)));

    return { p: clampedP, q: clampedQ };
  }, [CENTER, SCALE]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging && e.type !== 'pointerdown') return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { p, q } = fromSvgCoords(x, y);
    setPVal(p);
    setQVal(q);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleApplyDispatch = () => {
    setHvdcSetpoints(pVal, qVal, selectedMode);
    if (soundEngine) soundEngine.playSwitchClick();
    onClose();
  };

  const setPreset = (p: number, q: number, mode: HvdcControlMode) => {
    setPVal(p);
    setQVal(q);
    setSelectedMode(mode);
    if (soundEngine) soundEngine.playSwitchClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-cyan-500/40 rounded-2xl w-full max-w-4xl shadow-2xl shadow-cyan-950/40 overflow-hidden font-sans flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {isAr ? 'منحنى قدرة P-Q ومحددات تشغيل المحول (IEC 62501 / CIGRE B4)' : 'VSC-HVDC P-Q Capability Curve & Dispatch Controller'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-md">
                  ±320kV MMC • S_nom: 220MVA
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {isAr
                  ? 'التحكم المستقل بالقدرة الفعالة والردية • محاكاة الإحداثيات المتزامنة d-q في الوقت الحقيقي'
                  : 'Decoupled Active / Reactive Power Flow • 4-Quadrant Operational Envelope'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / SVG P-Q Diagram (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between w-full mb-3 text-xs">
              <span className="text-zinc-400 font-bold uppercase flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                {isAr ? 'مخطط الدائرة المغلقة P-Q (انقر واسحب للتعيين)' : 'P-Q Operational Locus (Interactive Drag)'}
              </span>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${isOverCapability ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                {apparentMva.toFixed(1)} MVA / {S_MAX} MVA
              </span>
            </div>

            {/* Interactive SVG Diagram */}
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-2 cursor-crosshair select-none touch-none">
              <svg
                ref={svgRef}
                width={SVG_SIZE}
                height={SVG_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="overflow-visible"
              >
                {/* Background Grid */}
                <defs>
                  <radialGradient id="pqGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
                    <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 220 MVA S_max Circle Envelope */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={S_MAX * SCALE}
                  fill="url(#pqGlow)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  className="transition-all"
                />

                {/* Cable Thermal Active Power Limit Lines (P = ±200 MW) */}
                <line
                  x1={CENTER - Q_LIMIT * SCALE}
                  y1={toSvgY(P_LIMIT)}
                  x2={CENTER + Q_LIMIT * SCALE}
                  y2={toSvgY(P_LIMIT)}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <line
                  x1={CENTER - Q_LIMIT * SCALE}
                  y1={toSvgY(-P_LIMIT)}
                  x2={CENTER + Q_LIMIT * SCALE}
                  y2={toSvgY(-P_LIMIT)}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Reactive Limits (Q = ±100 MVAR) */}
                <line
                  x1={toSvgX(Q_LIMIT)}
                  y1={toSvgY(P_LIMIT)}
                  x2={toSvgX(Q_LIMIT)}
                  y2={toSvgY(-P_LIMIT)}
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <line
                  x1={toSvgX(-Q_LIMIT)}
                  y1={toSvgY(P_LIMIT)}
                  x2={toSvgX(-Q_LIMIT)}
                  y2={toSvgY(-P_LIMIT)}
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Main Axis (P = 0, Q = 0) */}
                <line x1={0} y1={CENTER} x2={SVG_SIZE} y2={CENTER} stroke="#3f3f46" strokeWidth="1.5" />
                <line x1={CENTER} y1={0} x2={CENTER} y2={SVG_SIZE} stroke="#3f3f46" strokeWidth="1.5" />

                {/* Quadrant Labels */}
                <text x={CENTER + 25} y={30} fill="#71717a" fontSize="9" fontFamily="monospace" fontWeight="bold">Q1: EXPORT / INDUCTIVE</text>
                <text x={10} y={30} fill="#71717a" fontSize="9" fontFamily="monospace" fontWeight="bold">Q2: IMPORT / INDUCTIVE</text>
                <text x={10} y={SVG_SIZE - 20} fill="#71717a" fontSize="9" fontFamily="monospace" fontWeight="bold">Q3: IMPORT / CAPACITIVE</text>
                <text x={CENTER + 20} y={SVG_SIZE - 20} fill="#71717a" fontSize="9" fontFamily="monospace" fontWeight="bold">Q4: EXPORT / CAPACITIVE</text>

                {/* Axis Labels */}
                <text x={SVG_SIZE - 25} y={CENTER - 8} fill="#06b6d4" fontSize="10" fontFamily="monospace" fontWeight="bold">+Q (MVAR)</text>
                <text x={8} y={CENTER - 8} fill="#a855f7" fontSize="10" fontFamily="monospace" fontWeight="bold">-Q (MVAR)</text>
                <text x={CENTER + 8} y={15} fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">+P EXPORT (MW)</text>
                <text x={CENTER + 8} y={SVG_SIZE - 6} fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">-P IMPORT (MW)</text>

                {/* Apparent Power Vector Line */}
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={toSvgX(qVal)}
                  y2={toSvgY(pVal)}
                  stroke={isOverCapability ? '#f43f5e' : '#38bdf8'}
                  strokeWidth="2.5"
                />

                {/* Target Operating Point Marker */}
                <circle
                  cx={toSvgX(qVal)}
                  cy={toSvgY(pVal)}
                  r="8"
                  fill={isOverCapability ? '#e11d48' : '#06b6d4'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <circle
                  cx={toSvgX(qVal)}
                  cy={toSvgY(pVal)}
                  r="16"
                  fill={isOverCapability ? '#e11d48' : '#06b6d4'}
                  opacity="0.25"
                />
              </svg>
            </div>

            {/* Coordinate readout */}
            <div className="flex items-center justify-between w-full mt-3 px-2 py-1.5 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-mono">
              <span className="text-emerald-400 font-bold">P: {pVal > 0 ? `+${pVal}` : pVal} MW</span>
              <span className="text-cyan-400 font-bold">Q: {qVal > 0 ? `+${qVal}` : qVal} MVAR</span>
              <span className="text-purple-400 font-bold">PF: {powerFactor.toFixed(3)}</span>
            </div>
          </div>

          {/* Right / Dispatch Controls & Presets (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Mode Selector */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2 font-mono">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                {isAr ? 'نمط التحكم والتشغيل (IEC 61850-7-410)' : 'HVDC Operational Control Mode'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: 'CONST_P' as HvdcControlMode, label: 'Constant P (Active Dispatch)', desc: 'Standard power flow injection' },
                  { mode: 'CONST_VDC' as HvdcControlMode, label: 'Constant Vdc (Slack Bus)', desc: 'Maintains ±320kV bus stability' },
                  { mode: 'STATCOM' as HvdcControlMode, label: 'STATCOM (Reactive Only)', desc: 'P=0, dynamic voltage support' },
                  { mode: 'GRID_FORMING_VF' as HvdcControlMode, label: 'Grid-Forming (Black Start)', desc: 'Voltage & Frequency source' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => {
                      setSelectedMode(item.mode);
                      if (item.mode === 'STATCOM') setPVal(0);
                    }}
                    className={`p-2 rounded-xl text-left rtl:text-right border transition-all text-xs cursor-pointer ${
                      selectedMode === item.mode
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-500/10'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Precise Tuning */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">Active Power P Reference (MW):</span>
                  <span className="text-emerald-400 font-bold">{pVal} MW</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="5"
                  disabled={selectedMode === 'STATCOM'}
                  value={pVal}
                  onChange={(e) => setPVal(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>-200 MW (Import)</span>
                  <span>0 MW</span>
                  <span>+200 MW (Export)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">Reactive Power Q Reference (MVAR):</span>
                  <span className="text-cyan-400 font-bold">{qVal} MVAR</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={qVal}
                  onChange={(e) => setQVal(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>-100 MVAR (Absorb)</span>
                  <span>0 MVAR</span>
                  <span>+100 MVAR (Inject)</span>
                </div>
              </div>
            </div>

            {/* Dispatch Fast Presets */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
              <span className="text-[11px] text-zinc-400 font-bold uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'الإعدادات المسبقة السريعة' : 'Operational Dispatch Presets'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPreset(180, 40, 'CONST_P')}
                  className="px-2 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  <span className="text-emerald-400 block font-bold">+180MW</span>
                  <span className="text-[9px] text-zinc-500">Peak Export</span>
                </button>
                <button
                  onClick={() => setPreset(120, 25, 'CONST_P')}
                  className="px-2 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  <span className="text-cyan-400 block font-bold">+120MW</span>
                  <span className="text-[9px] text-zinc-500">Base Nominal</span>
                </button>
                <button
                  onClick={() => setPreset(0, 80, 'STATCOM')}
                  className="px-2 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  <span className="text-purple-400 block font-bold">+80MVAR</span>
                  <span className="text-[9px] text-zinc-500">STATCOM Grid</span>
                </button>
                <button
                  onClick={() => setPreset(-150, -20, 'CONST_P')}
                  className="px-2 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  <span className="text-amber-400 block font-bold">-150MW</span>
                  <span className="text-[9px] text-zinc-500">Power Import</span>
                </button>
                <button
                  onClick={() => setPreset(45, 12, 'GRID_FORMING_VF')}
                  className="px-2 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  <span className="text-indigo-400 block font-bold">45MW / V-f</span>
                  <span className="text-[9px] text-zinc-500">Black Start</span>
                </button>
                <button
                  onClick={() => setPreset(0, 0, 'CONST_P')}
                  className="px-2 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  <span className="text-zinc-400 block font-bold">0 MW</span>
                  <span className="text-[9px] text-zinc-500">Standby Idle</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono">
            {isOverCapability ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {isAr ? 'تحذير: القدرة المطلوبة تتجاوز تصنيف المحول (220 MVA)!' : 'Warning: Dispatch setpoint exceeds 220 MVA converter capability!'}
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? 'نقطة التشغيل تقع ضمن المحدودات الآمنة للمحول' : 'Setpoint within safe continuous operational limits'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleApplyDispatch}
              disabled={isOverCapability}
              className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                isOverCapability
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25 font-extrabold'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isAr ? 'إرسال وتطبيق أوامر التوليد (Dispatch)' : 'Apply & Dispatch Setpoints'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
