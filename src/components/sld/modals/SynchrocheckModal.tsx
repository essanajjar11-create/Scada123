import React, { useState, useEffect } from 'react';
import { X, Activity, Gauge, Zap, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface SynchrocheckModalProps {
  bayName: string;
  sourceAVoltage: number; // in kV
  sourceBVoltage: number; // in kV
  frequency: number; // in Hz
  onClose: () => void;
}

export const SynchrocheckModal: React.FC<SynchrocheckModalProps> = ({
  bayName,
  sourceAVoltage = 132.0,
  sourceBVoltage = 132.0,
  frequency = 50.0,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const vA = typeof sourceAVoltage === 'number' && !isNaN(sourceAVoltage) ? sourceAVoltage : 132.0;
  const vB = typeof sourceBVoltage === 'number' && !isNaN(sourceBVoltage) ? sourceBVoltage : 132.0;
  const freq = typeof frequency === 'number' && !isNaN(frequency) ? frequency : 50.0;

  const [angle, setAngle] = useState(2.4); // degrees
  const [deltaV, setDeltaV] = useState(Math.abs(vA - vB));
  const [slipFreq, setSlipFreq] = useState(0.015); // Hz
  const [synchArmed, setSynchArmed] = useState(true);
  const [closingToleranceDeg, setClosingToleranceDeg] = useState(10); // degrees
  const [voltageTolerancePct, setVoltageTolerancePct] = useState(5); // %

  // Live vector angle oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      setAngle((prev) => {
        const next = prev + (slipFreq * 360 * 0.05);
        return ((next + 180) % 360) - 180;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [slipFreq]);

  const vNominal = vA || 132.0;
  const deltaVPct = ((Math.abs(vA - vB) / (vNominal || 1)) * 100);
  const isAnglePermissive = Math.abs(angle) <= closingToleranceDeg;
  const isVoltagePermissive = deltaVPct <= voltageTolerancePct;
  const isSlipPermissive = Math.abs(slipFreq) <= 0.05;
  const isSynchPermitted = isAnglePermissive && isVoltagePermissive && isSlipPermissive;

  // Coordinate math for synchroscope needle (radius 90)
  const needleRad = ((angle - 90) * Math.PI) / 180;
  const needleX = 120 + 80 * Math.cos(needleRad);
  const needleY = 120 + 80 * Math.sin(needleRad);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xs font-bold px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                  ANSI 25 / IEC 60255-127
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {isAr ? 'فاحص التزامن وجهاز Synchrocheck' : 'Synchrocheck & Synchronism Verifier'}
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? `الخلية المستهدفة: ${bayName} • التحقق من الجهد وزاوية الطور ومعدل الانزلاق`
                  : `Target Bay: ${bayName} • Voltage, Phase Angle & Slip Verification`}
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
          {/* Top Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isSynchPermitted
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                : 'bg-amber-950/60 border-amber-500/60 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {isSynchPermitted ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-bold tracking-wide uppercase">
                  {isSynchPermitted
                    ? (isAr ? 'شروط التزامن مستوفاة: جاهز لإغلاق القاطع' : 'SYNCHRONISM PERMISSIVE: READY FOR BREAKER CLOSE')
                    : (isAr ? 'حظر الإغلاق: خارج نطاق التسامح المسموح' : 'SYNCHROCHECK INHIBIT: OUT OF TOLERANCE')}
                </h4>
                <p className="text-xs opacity-85 font-mono">
                  Δθ: {angle > 0 ? `+${angle.toFixed(1)}` : angle.toFixed(1)}° (Limit ±{closingToleranceDeg}°) • ΔV: {deltaVPct.toFixed(2)}% (Limit ±{voltageTolerancePct}%) • Δf: {slipFreq.toFixed(3)} Hz
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-lg font-mono tracking-wider ${
                isSynchPermitted ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' : 'bg-amber-500 text-black'
              }`}
            >
              {isSynchPermitted ? (isAr ? 'الإذن مفعّل' : 'PERMISSIVE ACTIVE') : (isAr ? 'الإغلاق محظور' : 'CLOSING BLOCKED')}
            </span>
          </div>

          {/* Center Display: Synchroscope Dial + Vector Scope */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Synchroscope Dial (5 cols) */}
            <div className="md:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center relative">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                {isAr ? 'قرص التزامن التناظري (ANSI 25)' : 'Analog Synchroscope Dial (ANSI 25)'}
              </span>
              <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible">
                {/* Outer bezel */}
                <circle cx="120" cy="120" r="100" fill="#090d16" stroke="#27272a" strokeWidth="6" />
                <circle cx="120" cy="120" r="94" fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />

                {/* Permissive Acceptance Arc */}
                <path
                  d={`M ${120 + 94 * Math.cos(((270 - closingToleranceDeg) * Math.PI) / 180)} ${
                    120 + 94 * Math.sin(((270 - closingToleranceDeg) * Math.PI) / 180)
                  } A 94 94 0 0 1 ${120 + 94 * Math.cos(((270 + closingToleranceDeg) * Math.PI) / 180)} ${
                    120 + 94 * Math.sin(((270 + closingToleranceDeg) * Math.PI) / 180)
                  }`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  opacity="0.8"
                />

                {/* Dial Ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const x1 = 120 + 82 * Math.cos(rad);
                  const y1 = 120 + 82 * Math.sin(rad);
                  const x2 = 120 + 92 * Math.cos(rad);
                  const y2 = 120 + 92 * Math.sin(rad);
                  return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#71717a" strokeWidth={deg % 90 === 0 ? '2' : '1'} />;
                })}

                {/* Top 12 o'clock indicator */}
                <polygon points="120,24 114,34 126,34" fill="#10b981" />
                <text x="120" y="48" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">0° SYNC</text>
                <text x="45" y="124" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">-90° SLOW</text>
                <text x="195" y="124" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">+90° FAST</text>
                <text x="120" y="200" fill="#a1a1aa" fontSize="9" textAnchor="middle">180° ANTI-PHASE</text>

                {/* Rotating needle */}
                <line x1="120" y1="120" x2={needleX} y2={needleY} stroke={isAnglePermissive ? '#10b981' : '#f43f5e'} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="120" cy="120" r="8" fill="#18181b" stroke="#71717a" strokeWidth="2" />
                <circle cx="120" cy="120" r="3" fill="#ffffff" />
              </svg>
              <div className="mt-2 text-center">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {isAr ? 'معدل انزلاق الزاوية:' : 'Angle Slip Rate:'}{' '}
                  <span className="text-cyan-400">{slipFreq > 0 ? `+${slipFreq.toFixed(3)}` : slipFreq.toFixed(3)} Hz</span>
                </span>
              </div>
            </div>

            {/* Phasor Vector Diagram & Telemetry (7 cols) */}
            <div className="md:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                {isAr ? 'قياسات طور القضبان الحية' : 'Live Bus Phasor Telemetry'}
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold block">{isAr ? 'المصدر 1 (قضيب A)' : 'SOURCE 1 (BUS-A)'}</span>
                  <div className="text-zinc-100 font-bold text-sm mt-0.5">{vA.toFixed(1)} kV</div>
                  <div className="text-[11px] text-emerald-400">{isAr ? 'الزاوية:' : 'Angle:'} 0.0° • {freq.toFixed(2)} Hz</div>
                </div>

                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold block">{isAr ? 'المصدر 2 (قضيب B)' : 'SOURCE 2 (BUS-B)'}</span>
                  <div className="text-zinc-100 font-bold text-sm mt-0.5">{vB.toFixed(1)} kV</div>
                  <div className="text-[11px] text-cyan-400">{isAr ? 'الزاوية:' : 'Angle:'} {angle > 0 ? `+${angle.toFixed(1)}` : angle.toFixed(1)}° • {(freq + slipFreq).toFixed(2)} Hz</div>
                </div>
              </div>

              {/* Differential Readings */}
              <div className="space-y-1.5 text-xs font-mono pt-1">
                <div className="flex justify-between items-center p-2 bg-zinc-950/60 rounded border border-zinc-800">
                  <span className="text-zinc-400">{isAr ? 'فرق مطال الجهد (ΔV):' : 'Voltage Magnitude Differential (ΔV):'}</span>
                  <span className={`font-bold ${isVoltagePermissive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.abs(vA - vB).toFixed(2)} kV ({deltaVPct.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-950/60 rounded border border-zinc-800">
                  <span className="text-zinc-400">{isAr ? 'فرق زاوية الطور (Δθ):' : 'Phase Angle Difference (Δθ):'}</span>
                  <span className={`font-bold ${isAnglePermissive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {angle > 0 ? `+${angle.toFixed(1)}` : angle.toFixed(1)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-950/60 rounded border border-zinc-800">
                  <span className="text-zinc-400">{isAr ? 'تردد الانزلاق (Δf):' : 'Slip Frequency (Δf):'}</span>
                  <span className={`font-bold ${isSlipPermissive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.abs(slipFreq).toFixed(3)} Hz
                  </span>
                </div>
              </div>

              {/* Setpoint Sliders */}
              <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>{isAr ? 'نافذة الزاوية:' : 'Angle Window:'}</span>
                    <span className="font-mono text-zinc-200">±{closingToleranceDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    value={closingToleranceDeg}
                    onChange={(e) => setClosingToleranceDeg(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>{isAr ? 'نافذة ΔV:' : 'ΔV Window:'}</span>
                    <span className="font-mono text-zinc-200">±{voltageTolerancePct}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={voltageTolerancePct}
                    onChange={(e) => setVoltageTolerancePct(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">
            {isAr
              ? 'مُراقب بواسطة وحدة تحكم الخلية IED (عقدة RSYN وفق IEC 61850-7-4)'
              : 'Supervised by Bay Controller IED (IEC 61850-7-4 RSYN Logical Node)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق نافذة فاحص التزامن' : 'Close Synchrocheck Viewer'}
          </button>
        </div>
      </div>
    </div>
  );
};

