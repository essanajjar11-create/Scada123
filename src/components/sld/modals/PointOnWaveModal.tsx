import React, { useState } from 'react';
import { X, Activity, Zap, CheckCircle2, SlidersHorizontal, ArrowRight, ShieldCheck, Gauge } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface PointOnWaveModalProps {
  breakerId: string;
  breakerName: string;
  bayName: string;
  loadType: 'Transformer (50MVA Core)' | 'Capacitor Bank (10MVAR)' | 'Transmission Line (132kV)';
  onClose: () => void;
}

export const PointOnWaveModal: React.FC<PointOnWaveModalProps> = ({
  breakerId,
  breakerName,
  bayName,
  loadType,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const [targetAngleDeg, setTargetAngleDeg] = useState(90); // 90 deg for transformer inrush elimination (voltage peak)
  const [mechanicalOperatingTimeMs, setMechanicalOperatingTimeMs] = useState(38.4); // ms
  const [adaptiveDriftCompensation, setAdaptiveDriftCompensation] = useState(true);
  const [simulatedInrushPeakPu, setSimulatedInrushPeakPu] = useState(1.08); // pu

  // Inrush calculation based on closing angle vs optimal 90 deg
  const angularError = Math.abs(targetAngleDeg - 90);
  const calculatedInrushPu = 1.0 + 5.5 * Math.sin((angularError * Math.PI) / 180);
  const inrushMitigationPct = Math.max(0, 100 - ((calculatedInrushPu - 1.0) / 5.5) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-purple-950/80 border border-purple-500/40 rounded-xl text-purple-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xs font-bold px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-mono">
                  IEEE C37.0115 / CIGRE WG A3.07
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {isAr
                    ? 'وحدة التحكم في التبديل المتزامن على زاوية الموجة (PoW)'
                    : 'Point-on-Wave (PoW) Controlled Switching Controller'}
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                {isAr ? 'القاطع:' : 'Breaker:'}{' '}
                <span className="text-zinc-200 font-medium">
                  {breakerName} [{breakerId}]
                </span>{' '}
                • {isAr ? 'المعدة المستهدفة:' : 'Target Asset:'} {loadType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* PoW Health & Inrush Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">
                {isAr ? 'زاوية طور الجهد المستهدفة' : 'Target Voltage Phase Angle'}
              </span>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {targetAngleDeg}°{' '}
                <span className="text-xs text-zinc-400 font-normal">
                  {targetAngleDeg === 90 ? (isAr ? '(ذروة الجهد - الحالة المثلى)' : '(Voltage Peak - Optimum)') : ''}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center space-x-1 rtl:space-x-reverse">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? 'انعدام تشبع الفيض المغناطيسي بالقلب' : 'Zero Core Saturation Flux'}</span>
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">
                {isAr ? 'تيار الاندفاع المخمد (Inrush)' : 'Mitigated Inrush Current'}
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {calculatedInrushPu.toFixed(2)} pu
              </div>
              <div className="text-[11px] text-zinc-400">
                {isAr ? 'بدون تحكم PoW:' : 'Without PoW:'}{' '}
                <span className="text-rose-400 font-bold font-mono">6.50 pu</span>{' '}
                ({isAr ? `تخفيض ${inrushMitigationPct.toFixed(0)}%` : `${inrushMitigationPct.toFixed(0)}% reduction`})
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">
                {isAr ? 'زمن التوصيل الميكانيكي' : 'Mechanical Closing Time'}
              </span>
              <div className="text-2xl font-black text-zinc-100 font-mono">
                {mechanicalOperatingTimeMs.toFixed(1)} ms
              </div>
              <span className="text-[11px] text-purple-300 font-mono">
                {isAr ? 'التعويض التكيفي: ±0.28 مللي ثانية' : 'Adaptive Jitter: ±0.28 ms'}
              </span>
            </div>
          </div>

          {/* Waveform Diagram: Voltage vs Inrush Current */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                {isAr
                  ? 'المخطط الموجي للجهد المتزامن ولحظة تلامس نقاط التوصيل'
                  : 'Synchronous Voltage Waveform & Instant of Contact Touch'}
              </span>
              <div className="flex items-center space-x-3 rtl:space-x-reverse text-[11px] font-mono">
                <span className="text-amber-400">── {isAr ? 'الجهد 132kV' : 'Voltage 132kV'}</span>
                <span className="text-purple-400">── {isAr ? 'الفيض المغناطيسي' : 'Magnetizing Flux'}</span>
                <span className="text-emerald-400 font-bold">● {isAr ? 'تلامس القاطع' : 'Contact Closure'}</span>
              </div>
            </div>

            <div className="relative h-44 bg-zinc-950 rounded-lg p-2 flex items-center justify-center border border-zinc-800/80">
              <svg viewBox="0 0 450 140" className="w-full h-full font-mono text-[9px]">
                {/* Zero line */}
                <line x1="30" y1="70" x2="420" y2="70" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="20" x2="30" y2="120" stroke="#3f3f46" strokeWidth="1" />

                {/* Voltage Sine Wave */}
                <path
                  d="M 40 70 Q 77.5 15, 115 70 T 190 70 T 265 70 T 340 70 T 415 70"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Flux Wave (lagging 90 deg) */}
                <path
                  d="M 40 120 Q 77.5 70, 115 120 T 190 70 T 265 20 T 340 70 T 415 120"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />

                {/* Angle Markers */}
                <text x="40" y="85" fill="#71717a" textAnchor="middle">0°</text>
                <text x="115" y="85" fill="#71717a" textAnchor="middle">90°</text>
                <text x="190" y="85" fill="#71717a" textAnchor="middle">180°</text>
                <text x="265" y="85" fill="#71717a" textAnchor="middle">270°</text>
                <text x="340" y="85" fill="#71717a" textAnchor="middle">360°</text>

                {/* Contact Touch Point Marker based on targetAngleDeg */}
                {(() => {
                  const xTouch = 40 + (targetAngleDeg / 360) * 300;
                  const yTouch = 70 - 55 * Math.sin((targetAngleDeg * Math.PI) / 180);
                  return (
                    <g>
                      <line x1={xTouch} y1="15" x2={xTouch} y2="125" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                      <circle cx={xTouch} cy={yTouch} r="6" fill="#10b981" className="animate-ping" />
                      <circle cx={xTouch} cy={yTouch} r="4" fill="#10b981" />
                      <rect x={xTouch - 45} y="15" width="90" height="16" fill="#020617" stroke="#10b981" strokeWidth="1" rx="4" />
                      <text x={xTouch} y="26" fill="#10b981" fontWeight="bold" textAnchor="middle">
                        CLOSE @ {targetAngleDeg}°
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Interactive Setpoint Slider */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-200">
                {isAr ? 'ضبط زاوية التزامن على الموجة (PoW):' : 'Point-on-Wave Synchronous Angle Tuning:'}
              </span>
              <span className="font-mono text-purple-300 font-bold">{targetAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              value={targetAngleDeg}
              onChange={(e) => setTargetAngleDeg(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>{isAr ? '0° (المرور بالصفر - الأسوأ للمحولات ~6.5pu)' : '0° (Voltage Zero - Worst Case ~6.5pu)'}</span>
              <span className="text-emerald-400 font-bold">
                {isAr ? '90° (قمة الجهد - إخماد تيار البدء ~1.08pu)' : '90° (Voltage Crest - Optimum ~1.08pu)'}
              </span>
              <span>{isAr ? '180° (المرور بالصفر)' : '180° (Zero Crossing)'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">
            {isAr
              ? 'مُراقب بواسطة وحدة التبديل المتزامن لخلية المفاتيح (ANSI 25 / PoW)'
              : 'Supervised by Bay Synchronous Switching Controller (ANSI 25 / PoW)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق نافذة التحكم' : 'Close Controller View'}
          </button>
        </div>
      </div>
    </div>
  );
};
