import React, { useState } from 'react';
import { Activity, Flame, Radio, X, Zap } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface UhfThermalModalProps {
  trId: 'TR-1' | 'TR-2';
  location: 'Bushing HV-A' | 'Bushing HV-B' | 'Bushing HV-C' | 'OLTC Compartment' | 'Main Tank';
  pdAmplitude: number; // e.g. 0.14 nC
  bushingTemp: number; // e.g. 54.4 °C
  onClose: () => void;
}

export const UhfThermalModal: React.FC<UhfThermalModalProps> = ({
  trId,
  location,
  pdAmplitude = 0.14,
  bushingTemp = 54.4,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const pd = typeof pdAmplitude === 'number' && !isNaN(pdAmplitude) ? pdAmplitude : 0.14;
  const temp = typeof bushingTemp === 'number' && !isNaN(bushingTemp) ? bushingTemp : 54.4;
  const [viewTab, setViewTab] = useState<'uhf' | 'thermal'>('uhf');

  const locationTranslations: Record<string, string> = {
    'Bushing HV-A': isAr ? 'عازل الجهد العالي - الطور A' : 'Bushing HV-A',
    'Bushing HV-B': isAr ? 'عازل الجهد العالي - الطور B' : 'Bushing HV-B',
    'Bushing HV-C': isAr ? 'عازل الجهد العالي - الطور C' : 'Bushing HV-C',
    'OLTC Compartment': isAr ? 'حجرة مغير الجهد تحت الحمل OLTC' : 'OLTC Compartment',
    'Main Tank': isAr ? 'الخزان الرئيسي للمحول' : 'Main Tank',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4 font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 rtl:space-x-reverse border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-purple-950 border border-purple-700/60 rounded-lg text-purple-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              {isAr
                ? `تشخيص التفريغ الجزئي UHF والحرارة بالأشعة تحت الحمراء IR (${trId})`
                : `${trId} UHF Acoustic PD & IR Thermal Diagnostics`}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'نقطة الاستشعار:' : 'Sensor Spot:'}{' '}
              <span className="text-purple-300 font-bold">{locationTranslations[location] || location}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse border-b border-slate-800 pb-2">
          <button
            onClick={() => setViewTab('uhf')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 rtl:space-x-reverse transition-all ${
              viewTab === 'uhf'
                ? 'bg-purple-900 text-purple-200 border border-purple-600'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{isAr ? 'طيف التفريغ الجزئي UHF (300MHz - 1.5GHz)' : '300MHz - 1.5GHz UHF PRPD Spectrum'}</span>
          </button>
          <button
            onClick={() => setViewTab('thermal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 rtl:space-x-reverse transition-all ${
              viewTab === 'thermal'
                ? 'bg-amber-900 text-amber-200 border border-amber-600'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{isAr ? 'مصفوفة النقاط الساخنة الحرارية IR' : 'IR Thermal Hotspot Array'}</span>
          </button>
        </div>

        {viewTab === 'uhf' ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{isAr ? 'شحنة النبضة المكتشفة:' : 'Detected Pulse Charge:'}</span>
              <span className="font-bold text-purple-300 text-sm">{pd.toFixed(2)} nC ({Math.round(pd * 1000)} pC)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{isAr ? 'نمط التفريغ الجزئي PRPD:' : 'PRPD Pattern Type:'}</span>
              <span className="font-bold text-amber-300">
                {isAr ? 'تفريغ داخلي في فجوة عازلة / أجزاء معدنية عائمة' : 'Internal Cavity / Floating Metal Discharge'}
              </span>
            </div>

            {/* PRPD Scatter Plot Canvas/SVG */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {isAr ? 'التفريغ الجزئي المنسوب للطور PRPD (من 0° إلى 360°)' : 'Phase Resolved Partial Discharge (0° to 360°)'}
              </span>
              <svg viewBox="0 0 500 120" className="w-full h-28 bg-slate-950 rounded border border-slate-800">
                <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" />
                {/* Reference AC Sine Wave */}
                <path d="M 0 60 Q 125 10 250 60 T 500 60" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                {/* PRPD Scatter Points */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const phase = (i / 60) * 500;
                  const amp = 60 + Math.sin(i * 0.3) * 35 + (Math.random() - 0.5) * 20;
                  return (
                    <circle
                      key={i}
                      cx={phase}
                      cy={amp}
                      r="2.5"
                      fill="#c084fc"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{isAr ? 'حرارة سطح العازل:' : 'Bushing Surface Temperature:'}</span>
              <span className="font-bold text-amber-300 text-sm">{temp.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{isAr ? 'فارق الحرارة عن المحيط (ΔT):' : 'Ambient Delta (ΔT):'}</span>
              <span className="font-bold text-emerald-400">
                +{(temp - 30.0).toFixed(1)} °C ({isAr ? 'نطاق تشغيل آمن' : 'SAFE OPERATING RANGE'})
              </span>
            </div>

            {/* IR Heatmap Mock Graphic */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {isAr ? 'صورة الكاميرا الحرارية بالأشعة تحت الحمراء IR' : 'IR Thermal Imager Field View'}
              </span>
              <div className="w-full h-28 bg-gradient-to-r from-blue-950 via-purple-900 via-amber-700 to-yellow-400 rounded border border-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/60 animate-pulse flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-black/60 px-1 rounded">{temp.toFixed(1)}°C</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق نافذة التشخيص' : 'Close Diagnostics'}
          </button>
        </div>
      </div>
    </div>
  );
};
