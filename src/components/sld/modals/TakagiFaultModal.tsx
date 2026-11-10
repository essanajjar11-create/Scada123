import React from 'react';
import { Compass, MapPin, X, ShieldAlert, Cpu } from 'lucide-react';
import { EquationCard } from '../../common/EquationCard';
import { useScada } from '../../../context/ScadaContext';

interface TakagiFaultModalProps {
  feederName: string;
  distanceKm: number;
  towerNo: string;
  onClose: () => void;
}

export const TakagiFaultModal: React.FC<TakagiFaultModalProps> = ({
  feederName,
  distanceKm,
  towerNo,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const lineLengthKm = 25.0;
  const reactancePerKm = 0.38; // ohms/km

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 rtl:space-x-reverse border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-rose-950 border border-rose-700/60 rounded-lg text-rose-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              {isAr ? 'تقرير تحديد موقع العطل بطريقة تاكاجي (Takagi)' : 'Takagi Impedance Fault Location Report'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'خوارزمية حساب المسافة الدقيقة للأعطال على خطوط النقل وفق معيار IEEE C37.114'
                : 'IEEE C37.114 High-Speed Transmission Line Fault Distance Algorithm'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400">{isAr ? 'الخط / المغذي المستهدف:' : 'Target Line / Feeder:'}</span>
            <span className="font-bold text-rose-300 font-mono">{feederName}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">
                {isAr ? 'مسافة العطل المحسوبة' : 'Calculated Fault Distance'}
              </span>
              <div className="flex items-baseline space-x-1 rtl:space-x-reverse">
                <span className="text-xl font-bold text-rose-400 font-mono">{distanceKm.toFixed(2)}</span>
                <span className="text-slate-500 text-xs">{isAr ? 'كم' : 'km'}</span>
              </div>
              <p className="text-[10px] text-slate-500">{isAr ? 'من قضبان المحطة' : 'From Substation Busbar'}</p>
            </div>

            <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">
                {isAr ? 'أقرب برج كهربائي' : 'Nearest Tower / Pylon'}
              </span>
              <div className="text-xl font-bold text-amber-300 font-mono">{towerNo}</div>
              <p className="text-[10px] text-slate-500">{isAr ? 'إحداثيات نظم المعلومات GIS' : 'GIS Coordinate Pinpoint'}</p>
            </div>
          </div>

          {/* Equation Card */}
          <EquationCard
            title={isAr ? 'معادلة تاكاجي لتحديد موقع العطل بالمعاوقة' : 'Takagi Impedance Fault Location Equation'}
            standard="IEEE C37.114"
            equation={
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-cyan-300 font-bold">
                <span>d =</span>
                <div className="inline-flex flex-col items-center px-2">
                  <span className="border-b border-cyan-400/80 pb-0.5 px-1">
                    Im(V<sub>s</sub> · I<sub>f</sub><sup>*</sup>)
                  </span>
                  <span className="pt-0.5 px-1">
                    Im(Z<sub>L</sub> · I<sub>s</sub> · I<sub>f</sub><sup>*</sup>)
                  </span>
                </div>
              </div>
            }
            description={
              isAr
                ? 'طريقة التراكب الفوقي باستخدام تيارات ما قبل العطل وتيارات العطل لإلغاء أخطاء مقاومة العطل القوسي'
                : 'Superposition method using pre-fault and fault currents to eliminate fault resistance errors'
            }
            variables={[
              { symbol: 'd', label: isAr ? 'المسافة النسبية للعطل' : 'Per-unit distance to fault', value: (distanceKm / lineLengthKm).toFixed(3) },
              { symbol: 'V_s', label: isAr ? 'طور جهد قضيب المحطة' : 'Substation bus voltage phasor', value: '132.0', unit: 'kV' },
              { symbol: 'I_f*', label: isAr ? 'مرافق طور تيار العطل' : 'Conjugate fault current phasor', value: '12.4', unit: 'kA' },
              { symbol: 'Z_L', label: isAr ? 'المعاوقة الكلية للخط' : 'Total line impedance', value: '0.12 + j0.38', unit: 'Ω/km' }
            ]}
            result={{
              label: isAr ? 'المسافة المحسوبة (d × L)' : 'Calculated Distance (d × L)',
              value: distanceKm.toFixed(2),
              unit: isAr ? 'كم' : 'km',
              status: isAr ? 'تم التحقق' : 'VERIFIED',
              statusColor: 'bg-rose-950 text-rose-300 border-rose-800'
            }}
          />

          {/* Visual Line Slider */}
          <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{isAr ? 'قضيب المحطة (0 كم)' : 'Substation Bus (0 km)'}</span>
              <span className="text-rose-400 font-bold">
                📍 {isAr ? `نقطة العطل @ ${distanceKm.toFixed(1)} كم` : `Fault Pin @ ${distanceKm.toFixed(1)} km`}
              </span>
              <span>{isAr ? `نهاية الخط (${lineLengthKm} كم)` : `Line End (${lineLengthKm} km)`}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full relative overflow-hidden border border-slate-800">
              <div
                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(distanceKm / lineLengthKm) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-2 bg-amber-300 animate-ping"
                style={{ left: `${(distanceKm / lineLengthKm) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إقرار وإغلاق التقرير' : 'Acknowledge Fault Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
