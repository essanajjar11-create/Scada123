import React, { useState } from 'react';
import { X, Activity, Zap, CheckCircle2, AlertTriangle, Cpu, Radio, Gauge } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface InstrumentTransformerModalProps {
  txType: 'CT' | 'PT';
  tag: string;
  name: string;
  bay: string;
  primaryRating: string;
  secondaryRating: string;
  accuracyClass: string;
  burdenVA: number;
  measuredSecondaryCurrent?: number;
  measuredSecondaryVoltage?: number;
  onClose: () => void;
}

export const InstrumentTransformerModal: React.FC<InstrumentTransformerModalProps> = ({
  txType,
  tag,
  name,
  bay,
  primaryRating,
  secondaryRating,
  accuracyClass,
  burdenVA,
  measuredSecondaryCurrent = 3.84,
  measuredSecondaryVoltage = 110.2,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';
  const [burdenResistance, setBurdenResistance] = useState(0.45); // Ohms
  const [injectedRatioTest, setInjectedRatioTest] = useState(100); // % of rated

  // CT Saturation & Knee-point Calculation (IEEE C57.13 / IEC 61869-2)
  const isCT = txType === 'CT';
  const ratedSecondary = isCT ? 5.0 : 110.0;
  const currentSec = isCT ? (measuredSecondaryCurrent * (injectedRatioTest / 100)) : (measuredSecondaryVoltage * (injectedRatioTest / 100));
  
  // Total burden calculation
  const totalBurdenVA = isCT
    ? Math.pow(currentSec, 2) * burdenResistance
    : (Math.pow(currentSec, 2) / 1200);

  const ratedBurden = burdenVA || (isCT ? 30 : 50);
  const burdenUtilizationPct = Math.min(150, (totalBurdenVA / ratedBurden) * 100);
  const isBurdenSafe = burdenUtilizationPct < 85;

  // Knee-point voltage Vk (approx for ANSI C800 / 10P20)
  const kneePointVk = isCT ? 480 : 150;
  const operatingVoltageV = currentSec * (burdenResistance + 0.15); // including internal winding R
  const saturationFactor = (operatingVoltageV / kneePointVk) * 100;
  const isSaturated = saturationFactor > 80;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xs font-bold px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                  {isCT ? 'IEEE C57.13 / IEC 61869-2 CT' : 'IEC 61869-3 VT/PT'}
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {tag}: {name}
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                {isAr ? 'الموقع:' : 'Location:'}{' '}
                <span className="text-zinc-200 font-medium">{bay}</span> • {isAr ? 'نسبة التحويل:' : 'Ratio:'}{' '}
                <span className="font-mono">{primaryRating} : {secondaryRating}</span>
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
          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-sans">
                {isAr ? 'إشارة الدائرة الثانوية المقاسة' : 'Secondary Measured Signal'}
              </span>
              <div className="text-xl font-extrabold text-cyan-300 font-mono">
                {currentSec.toFixed(2)} {isCT ? 'A' : 'V'}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center space-x-1 rtl:space-x-reverse">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? `فئة الدقة ${accuracyClass} خطي للمحاسبة` : `Class ${accuracyClass} Revenue Linear`}</span>
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-sans">
                {isAr ? 'حمل الدائرة الثانوية (Burden)' : 'Secondary Circuit Burden'}
              </span>
              <div className="text-xl font-extrabold text-zinc-100 font-mono">
                {totalBurdenVA.toFixed(1)} <span className="text-xs text-zinc-400">/ {ratedBurden} VA</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isBurdenSafe ? 'bg-emerald-400' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, burdenUtilizationPct)}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block">
                {isAr ? 'هامش سعة الحمل:' : 'Burden Margin:'} {(100 - burdenUtilizationPct).toFixed(0)}% {isAr ? 'متبقي' : 'Headroom'}
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-sans">
                {isAr ? 'تشبع القلب / نقطة الركبة' : 'Core Saturation / Knee-Point'}
              </span>
              <div className={`text-xl font-extrabold font-mono ${isSaturated ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isSaturated ? (isAr ? 'مشبع (خطر خطأ قياس)' : 'SATURATING') : (isAr ? 'غير مشبع (ضمن النطاق)' : 'UNSATURATED')}
              </div>
              <span className="text-[11px] text-zinc-400 font-mono block">
                Vk: {kneePointVk}V • {isAr ? 'الإجهاد:' : 'Stress:'} {saturationFactor.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* CT Excitation / Magnetization Curve SVG Display */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                {isAr ? 'منحنى الخصائص المغناطيسية للقلب (B-H / V-I)' : 'Core Magnetization (B-H / V-I) Characteristic Curve'}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">ANSI C800 Class Standard</span>
            </div>

            <div className="relative h-48 bg-zinc-950 rounded-lg p-2 flex items-center justify-center border border-zinc-800/80">
              <svg viewBox="0 0 400 160" className="w-full h-full font-mono text-[9px]">
                {/* Grid */}
                <line x1="40" y1="20" x2="40" y2="130" stroke="#3f3f46" strokeWidth="1" />
                <line x1="40" y1="130" x2="380" y2="130" stroke="#3f3f46" strokeWidth="1" />

                {/* Grid guidelines */}
                <line x1="40" y1="80" x2="380" y2="80" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="40" x2="380" y2="40" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="200" y1="20" x2="200" y2="130" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />

                {/* Labels */}
                <text x="35" y="25" fill="#71717a" textAnchor="end">600V</text>
                <text x="35" y="80" fill="#71717a" textAnchor="end">300V</text>
                <text x="35" y="130" fill="#71717a" textAnchor="end">0V</text>
                <text x="40" y="145" fill="#71717a">0.01A</text>
                <text x="200" y="145" fill="#71717a">0.5A</text>
                <text x="360" y="145" fill="#71717a">5.0A</text>

                {/* Knee-point curve */}
                <path
                  d="M 45 125 Q 70 60, 200 45 T 370 30"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Knee-point Marker */}
                <circle cx="200" cy="45" r="4" fill="#f59e0b" />
                <text x="210" y="42" fill="#f59e0b" fontWeight="bold">
                  {isAr ? 'نقطة الركبة Knee Point (Vk = 480V, Ie = 0.5A)' : 'Knee Point (Vk = 480V, Ie = 0.5A)'}
                </text>

                {/* Current Operating Point */}
                <circle cx="75" cy="115" r="5" fill="#10b981" className="animate-ping" />
                <circle cx="75" cy="115" r="3.5" fill="#10b981" />
                <text x="85" y="118" fill="#10b981" fontWeight="bold">
                  {isAr ? 'نقطة التشغيل (النطاق الخطي)' : 'Operating Point (Linear Zone)'}
                </text>
              </svg>
            </div>
          </div>

          {/* Interactive Burden & Injected Signal Sliders */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>{isAr ? 'مقاومة الدائرة الثانوية (الأسلاك + المرحلات):' : 'Secondary Loop Resistance (Wiring + Relays):'}</span>
                <span className="font-mono text-zinc-200 font-bold">{burdenResistance.toFixed(2)} Ω</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={burdenResistance}
                onChange={(e) => setBurdenResistance(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                {isAr
                  ? 'ارتفاع مقاومة الدائرة يؤدي للتشبع المبكر لقلب المحول أثناء أعطال القصر الشديدة.'
                  : 'High loop resistance can cause premature core saturation during through-faults.'}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>{isAr ? 'نسبة تحميل التيار الابتدائي المحاكى:' : 'Simulated Primary Loading Ratio:'}</span>
                <span className="font-mono text-zinc-200 font-bold">{injectedRatioTest}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={injectedRatioTest}
                onChange={(e) => setInjectedRatioTest(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                {isAr
                  ? 'محاكاة تيار الحمل الزائد وأعطال القصر حتى 200% من السعة المقننة.'
                  : 'Simulate overload / through-fault currents up to 200% rating.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex justify-between items-center text-xs flex-wrap gap-2">
          <span className="text-zinc-400 text-[11px]">
            {isAr
              ? 'مراقبة مستمرة عبر أخذ العينات الرقمية بالألياف الضوئية لوحدة الدمج (Merging Unit)'
              : 'Continuous Monitoring via Merging Unit Digital Fiber Sampling'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق نافذة المحول' : 'Close Transducer View'}
          </button>
        </div>
      </div>
    </div>
  );
};
