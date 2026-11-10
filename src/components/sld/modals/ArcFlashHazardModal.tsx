import React, { useState } from 'react';
import { X, Flame, ShieldAlert, AlertOctagon, CheckCircle2, Shield, Info } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface ArcFlashHazardModalProps {
  locationId: string;
  bayName: string;
  voltageRating: string;
  boltedFaultCurrentKa: number;
  clearingTimeMs: number;
  workingDistanceInches: number;
  onClose: () => void;
}

export const ArcFlashHazardModal: React.FC<ArcFlashHazardModalProps> = ({
  locationId,
  bayName,
  voltageRating,
  boltedFaultCurrentKa,
  clearingTimeMs,
  workingDistanceInches,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const [clearingTime, setClearingTime] = useState(clearingTimeMs);
  const [workingDist, setWorkingDist] = useState(workingDistanceInches);

  // IEEE 1584-2018 Simplified Incident Energy Model
  const isHV = voltageRating.includes('132');
  const nominalVoltageNum = isHV ? 132 : 13.8;
  const currentArcKa = boltedFaultCurrentKa * (isHV ? 0.92 : 0.85);

  // Incident energy in cal/cm2
  const incidentEnergy = (
    (4.184 * (isHV ? 1.4 : 1.1) * Math.pow(currentArcKa, 0.95) * (clearingTime / 1000) * (36 / Math.max(12, workingDist))) / 2.5
  );

  // Arc flash boundary distance (where E = 1.2 cal/cm2) in meters / feet
  const arcFlashBoundaryM = Math.sqrt((incidentEnergy / 1.2)) * (workingDist * 0.0254);
  const arcFlashBoundaryFt = arcFlashBoundaryM * 3.28084;

  // NFPA 70E PPE Category determination
  let ppeCategory = isAr ? 'الفئة 1 (Category 1)' : 'Category 1';
  let ppeCalRating = '4 cal/cm²';
  let ppeColor = 'bg-blue-500';

  if (incidentEnergy > 40) {
    ppeCategory = isAr ? 'خطير للغاية (> 40 cal/cm²)' : 'DANGEROUS (> 40 cal/cm²)';
    ppeCalRating = isAr ? 'العمل على الخط الحي محظور تماماً' : 'NO ENERGIZED WORK PERMITTED';
    ppeColor = 'bg-rose-600';
  } else if (incidentEnergy > 25) {
    ppeCategory = isAr ? 'الفئة 4 (Category 4)' : 'Category 4';
    ppeCalRating = isAr ? 'بدلة قوس كهربائي 40 cal/cm²' : '40 cal/cm² Arc Flash Suit';
    ppeColor = 'bg-purple-600';
  } else if (incidentEnergy > 8) {
    ppeCategory = isAr ? 'الفئة 3 (Category 3)' : 'Category 3';
    ppeCalRating = isAr ? 'بدلة قوس كهربائي 25 cal/cm²' : '25 cal/cm² Arc Flash Suit';
    ppeColor = 'bg-amber-600';
  } else if (incidentEnergy > 4) {
    ppeCategory = isAr ? 'الفئة 2 (Category 2)' : 'Category 2';
    ppeCalRating = isAr ? 'قناع واقٍ وغطاء للرأس 8 cal/cm²' : '8 cal/cm² Face Shield & Balaclava';
    ppeColor = 'bg-emerald-600';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xs font-bold px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-mono">
                  IEEE 1584-2018 / NFPA 70E
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {isAr ? 'تحليل مخاطر القوس الكهربائي والحدود الآمنة' : 'Arc Flash Hazard & Boundary Analysis'}
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? `الموقع: ${bayName} [${locationId}] • الجهد المقنن: ${voltageRating}`
                  : `Location: ${bayName} [${locationId}] • Voltage: ${voltageRating}`}
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

        {/* Modal Content */}
        <div className="p-5 space-y-5">
          {/* NFPA 70E Safety Warning Label Simulation */}
          <div className="border-4 border-amber-500 bg-amber-500/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Warning Header */}
            <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between font-extrabold uppercase tracking-wider text-sm">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <AlertOctagon className="w-5 h-5 fill-black text-amber-500 shrink-0" />
                <span>{isAr ? 'تحذير: خطر القوس الكهربائي والصدمة' : 'WARNING: ARC FLASH & SHOCK HAZARD'}</span>
              </div>
              <span className="text-xs font-mono bg-black text-amber-400 px-2 py-0.5 rounded">
                {isAr ? 'معدات الوقاية PPE إلزامية' : 'APPROPRIATE PPE REQUIRED'}
              </span>
            </div>

            {/* Label Content Grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-200">
              {/* Left Column: Energy & Boundaries */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-black/60 rounded-lg border border-amber-500/30">
                  <span className="text-[10px] text-zinc-400 uppercase font-sans font-bold block">
                    {isAr ? 'طاقة الصدمة المحسوبة (Incident Energy E)' : 'Calculated Incident Energy (E)'}
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">
                    {incidentEnergy.toFixed(2)} <span className="text-sm text-zinc-300 font-normal">cal/cm²</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-sans block mt-1">
                    {isAr ? 'عند مسافة العمل:' : 'At Working Distance:'}{' '}
                    <strong className="text-zinc-200">
                      {workingDist} in ({Math.round(workingDist * 2.54)} cm)
                    </strong>
                  </span>
                </div>

                <div className="p-3 bg-black/60 rounded-lg border border-amber-500/30 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isAr ? 'حد القوس الكهربائي:' : 'Arc Flash Boundary:'}</span>
                    <span className="font-bold text-rose-400 font-mono">
                      {arcFlashBoundaryFt.toFixed(1)} ft ({arcFlashBoundaryM.toFixed(2)} m)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isAr ? 'حد الاقتراب المقيد:' : 'Limited Approach:'}</span>
                    <span className="font-bold text-zinc-200 font-mono">
                      {isHV ? (isAr ? '5.0 قدم (1.5 م)' : '5.0 ft (1.5 m)') : (isAr ? '3.5 قدم (1.0 م)' : '3.5 ft (1.0 m)')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{isAr ? 'حد الاقتراب المحظور:' : 'Restricted Approach:'}</span>
                    <span className="font-bold text-zinc-200 font-mono">
                      {isHV ? (isAr ? '2.2 قدم (0.7 م)' : '2.2 ft (0.7 m)') : (isAr ? '1.0 قدم (0.3 م)' : '1.0 ft (0.3 m)')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: PPE Required Checklist */}
              <div className="space-y-3">
                <div className="p-3 bg-black/60 rounded-lg border border-amber-500/30">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block font-sans">
                    {isAr ? 'تصنيف معدات الحماية وفق NFPA 70E' : 'NFPA 70E PPE Level Classification'}
                  </span>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                    <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-md uppercase ${ppeColor}`}>
                      {ppeCategory}
                    </span>
                    <span className="text-xs font-bold text-zinc-300">
                      {isAr ? 'الحد الأدنى:' : 'Minimum:'} {ppeCalRating}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-black/60 rounded-lg border border-amber-500/30 space-y-1.5 text-xs">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block font-sans">
                    {isAr ? 'معدات الحماية الشخصية الإلزامية:' : 'Mandatory Personal Protective Equipment:'}
                  </span>
                  <div className="space-y-1 text-zinc-300 text-[11px]">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? `قميص وسروال مقاوم للقوس بأكمام طويلة (≥ ${ppeCalRating})`
                          : `Arc-rated long-sleeve shirt & pants (≥ ${ppeCalRating})`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? 'قناع واقٍ للوجه مع غطاء رأس كامل ضد القوس الكهربائي'
                          : 'Arc flash hood / face shield with wrap-around balaclava'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? `قفازات عازلة فئة ${isHV ? '4 (36kV)' : '2 (17kV)'} مع واقيات جلدية`
                          : `Class ${isHV ? '4 (36kV)' : '2 (17kV)'} dielectric rubber gloves + leather protectors`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? 'نظارات أمان مع دروع جانبية وأحذية عازلة مصنفة EH'
                          : 'Safety glasses with side shields & EH rated leather footwear'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Sensitivity Controls */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 uppercase tracking-wide flex items-center space-x-1.5 rtl:space-x-reverse">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {isAr
                    ? 'نموذج حساسية وقت فصل الحماية ومسافة العمل'
                    : 'Protection Clearing Time & Distance Sensitivity Model'}
                </span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {isAr ? 'تيار العطل الثلاثي:' : 'Bolted Fault Current:'} {boltedFaultCurrentKa} kA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>{isAr ? 'إجمالي زمن فصل الحماية (المرحل + القاطع):' : 'Relay + Breaker Total Clearing Time:'}</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {clearingTime} ms ({(clearingTime / 1000).toFixed(3)}s)
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="400"
                  step="10"
                  value={clearingTime}
                  onChange={(e) => setClearingTime(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  {isAr
                    ? 'الفصل الأسرع للحماية يقلل بشكل هائل من الطاقة الحرارية للوميض القوسي.'
                    : 'Faster primary protection clearing significantly reduces incident energy.'}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>{isAr ? 'مسافة عمل المشغل:' : 'Operator Working Distance:'}</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {workingDist} inches ({Math.round(workingDist * 2.54)} cm)
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="60"
                  step="2"
                  value={workingDist}
                  onChange={(e) => setWorkingDist(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  {isAr
                    ? 'تخمد شدة الطاقة عكسياً مع مربع المسافة (قانون التربيع العكسي).'
                    : 'Distance follows inverse power-law attenuation (1/D^x).'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">
            {isAr
              ? 'النموذج الهندسي: IEEE Std 1584™-2018 لحسابات القوس الكهربائي في أنظمة التيار المتردد'
              : 'Engineering Model: IEEE Std 1584™-2018 (Arc-Fault Model for AC Systems)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إقرار وإغلاق النافذة' : 'Acknowledge & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
