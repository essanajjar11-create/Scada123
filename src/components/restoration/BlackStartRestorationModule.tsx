import React, { useState } from 'react';
import {
  Zap,
  Power,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Activity,
  Flame,
  BatteryCharging,
  Hospital,
  Building,
  Factory,
  Radio
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';

export const BlackStartRestorationModule: React.FC = () => {
  const { lang, t, addAuditLog, gridFrequency } = useScada();
  const isAr = lang === 'ar';

  // Black Start Restoration Sequential Wizard Step (0: Not started/Blackout, 1: Auxiliary Power, 2: 132kV Line Energization, 3: Transformer Energization, 4: Priority Feeders)
  const [restorationStep, setRestorationStep] = useState<number>(0);
  const [isBlackoutActive, setIsBlackoutActive] = useState<boolean>(false);
  const [edgRunning, setEdgRunning] = useState<boolean>(false);
  const [bessGridForming, setBessGridForming] = useState<boolean>(false);
  const [line132kvEnergized, setLine132kvEnergized] = useState<boolean>(false);
  const [transformerEnergized, setTransformerEnergized] = useState<boolean>(false);
  const [hospitalFeederOnline, setHospitalFeederOnline] = useState<boolean>(false);
  const [waterPumpingOnline, setWaterPumpingOnline] = useState<boolean>(false);
  const [cityFeederOnline, setCityFeederOnline] = useState<boolean>(false);

  // UFLS 5-Stage Settings & Status (IEC 50Hz Grid Standard)
  const [testFrequencyHz, setTestFrequencyHz] = useState<number>(49.6);
  const [uflsStages, setUflsStages] = useState([
    { stage: 1, name: isAr ? 'المرحلة 1: الإنارة التجارية والأحمال غير الحيوية' : 'Stage 1: Commercial Lighting & Non-Critical', thresholdHz: 49.5, delaySec: 0.15, loadShedPct: 10, tripped: false },
    { stage: 2, name: isAr ? 'المرحلة 2: المصانع الخفيفة والمجمعات السكنية' : 'Stage 2: Light Industrial & Residential Block A', thresholdHz: 49.2, delaySec: 0.20, loadShedPct: 15, tripped: false },
    { stage: 3, name: isAr ? 'المرحلة 3: المنطقة الحضرية المركزية' : 'Stage 3: Central Urban Commercial Feeder', thresholdHz: 48.8, delaySec: 0.25, loadShedPct: 20, tripped: false },
    { stage: 4, name: isAr ? 'المرحلة 4: محطات الضخ المساعدة' : 'Stage 4: Secondary Auxiliary Pumping Stations', thresholdHz: 48.4, delaySec: 0.30, loadShedPct: 25, tripped: false },
    { stage: 5, name: isAr ? 'المرحلة 5: العزل الطارئ النهائي للحفاظ على الجزيرة' : 'Stage 5: Emergency Islanding Defense', thresholdHz: 48.0, delaySec: 0.10, loadShedPct: 30, tripped: false },
  ]);

  // Handle Triggering Blackout Simulation
  const handleInitiateBlackout = () => {
    setIsBlackoutActive(true);
    setRestorationStep(1);
    setEdgRunning(false);
    setBessGridForming(false);
    setLine132kvEnergized(false);
    setTransformerEnergized(false);
    setHospitalFeederOnline(false);
    setWaterPumpingOnline(false);
    setCityFeederOnline(false);
    addAuditLog('SECURITY', isAr ? 'بدء محاكاة انقطاع شامل (Blackout) وتفعيل مناورة Black Start' : 'Initiated Blackout scenario & Black Start restoration engine');
  };

  // Step Progress Handlers
  const handleStep1Complete = () => {
    setEdgRunning(true);
    setBessGridForming(true);
    setRestorationStep(2);
    addAuditLog('CONTROL', isAr ? 'تشغيل مولد الديزل الطارئ EDG وتفعيل نمط Grid-Forming لبطاريات BESS' : 'EDG started & BESS switched to Grid-Forming V/f mode');
  };

  const handleStep2Complete = () => {
    setLine132kvEnergized(true);
    setRestorationStep(3);
    addAuditLog('CONTROL', isAr ? 'شحن خط النقل 132kV تدريجياً مع قمع جهد فيرانتي' : '132kV transmission line charged with Ferranti suppression');
  };

  const handleStep3Complete = () => {
    setTransformerEnergized(true);
    setRestorationStep(4);
    addAuditLog('CONTROL', isAr ? 'توصيل محول القدرة TR-1 عند نقطة تقاطع الجهد مع الصفر' : 'TR-1 energized with controlled zero-crossing switching');
  };

  const handleStep4Complete = () => {
    setHospitalFeederOnline(true);
    setWaterPumpingOnline(true);
    setCityFeederOnline(true);
    setRestorationStep(5);
    setIsBlackoutActive(false);
    addAuditLog('CONTROL', isAr ? 'اكتمال استعادة التغذية لجميع الأحمال والمستشفيات بنجاح' : 'Black Start restoration successfully completed. All feeders online.');
  };

  // Reset Engine
  const handleReset = () => {
    setIsBlackoutActive(false);
    setRestorationStep(0);
    setEdgRunning(false);
    setBessGridForming(false);
    setLine132kvEnergized(false);
    setTransformerEnergized(false);
    setHospitalFeederOnline(false);
    setWaterPumpingOnline(false);
    setCityFeederOnline(false);
  };

  // Calculate UFLS Tripped Status based on test frequency
  const updatedUfls = uflsStages.map((st) => ({
    ...st,
    tripped: testFrequencyHz <= st.thresholdHz
  }));
  const totalLoadShedPct = updatedUfls.filter(s => s.tripped).reduce((acc, curr) => acc + curr.loadShedPct, 0);

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Header Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-400 shrink-0">
            <RotateCcw className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {isAr ? 'محاكي استعادة الشبكة والإظلام التام (Black Start & UFLS)' : 'Black Start & Grid Restoration Engine'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-[10px] font-mono font-extrabold">
                IEEE 1547 / NERC EOP-005
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isAr
                ? 'مناورات إعادة البناء التدريجي للشبكة بعد الانقطاع التام، قمع تيارات الاندفاع المغناطيسي، ونظام تفريغ الأحمال 5 مراحل UFLS'
                : 'Sequential restoration wizard from blackout, inrush current mitigation, and 5-stage under-frequency load shedding.'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {!isBlackoutActive && restorationStep === 0 ? (
            <button
              onClick={handleInitiateBlackout}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <Power className="w-4 h-4" />
              {isAr ? 'محاكاة إظلام تام (Blackout)' : 'Simulate Blackout Outage'}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {isAr ? 'إعادة ضبط المحاكي' : 'Reset Simulator'}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sequential Wizard (Left 2 Columns) + UFLS 5-Stage Scheme (Right Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wizard Left Side (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm uppercase">
                  {isAr ? 'مسار خطوات استعادة الشبكة (Black Start Sequence)' : 'Sequential Restoration Progress'}
                </h3>
              </div>
              <span className="font-mono text-xs text-zinc-400">
                {isAr ? `المرحلة الحالية: ${restorationStep} / 4` : `Current Stage: ${restorationStep} / 4`}
              </span>
            </div>

            {/* Stepper Timeline */}
            <div className="grid grid-cols-4 gap-3 font-mono text-xs">
              {[
                { step: 1, title: isAr ? '1. المصادر المساعدة' : '1. Aux Sources', desc: 'EDG & BESS V/f' },
                { step: 2, title: isAr ? '2. خط 132kV' : '2. 132kV Line', desc: 'Ferranti Suppress' },
                { step: 3, title: isAr ? '3. المحول TR-1' : '3. TR-1 Transf.', desc: 'Zero-Crossing' },
                { step: 4, title: isAr ? '4. الأحمال الحيوية' : '4. Priority Loads', desc: 'Hospital & City' },
              ].map((s) => {
                const isPassed = restorationStep > s.step;
                const isCurrent = restorationStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-xl border transition ${
                      isPassed
                        ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-950/60 border-amber-600 text-amber-300 ring-2 ring-amber-500/50 animate-pulse'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'
                    }`}
                  >
                    <div className="font-bold">{s.title}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{s.desc}</div>
                    <div className="mt-2 text-[10px] font-extrabold uppercase">
                      {isPassed ? (isAr ? '✓ مكتمل' : '✓ Completed') : isCurrent ? (isAr ? '⏳ جاري التنفيذ' : '⏳ In Progress') : (isAr ? 'قيد الانتظار' : 'Pending')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Action Cards */}
            <div className="space-y-4">
              {/* Step 1 Card */}
              <div className={`p-4 rounded-xl border transition ${restorationStep === 1 ? 'bg-zinc-900/90 border-amber-500' : 'bg-zinc-950/50 border-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BatteryCharging className={`w-5 h-5 ${edgRunning ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? 'المرحلة 1: تشغيل المولد المساعد EDG وبنك البطاريات BESS بنمط V/f' : 'Stage 1: Auxiliary Diesel (EDG 2.5 MVA) & BESS Grid-Forming Mode'}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {isAr
                          ? 'توفير التردد والجهد المرجعي لتغذية محولات الخدمات المساعدة وشواحن القواطع'
                          : 'Establishes local voltage and frequency reference for substation auxiliary boards.'}
                      </p>
                    </div>
                  </div>
                  {restorationStep === 1 && (
                    <button
                      onClick={handleStep1Complete}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      {isAr ? 'تشغيل المصادر المساعدة' : 'Start Aux Sources'}
                    </button>
                  )}
                  {edgRunning && (
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {isAr ? 'المصادر جاهزة' : 'ONLINE (50.0 Hz)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2 Card */}
              <div className={`p-4 rounded-xl border transition ${restorationStep === 2 ? 'bg-zinc-900/90 border-amber-500' : 'bg-zinc-950/50 border-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${line132kvEnergized ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? 'المرحلة 2: شحن مسار وخط النقل 132kV وتجنب ظاهرة فيرانتي' : 'Stage 2: 132kV Line Energization with Ferranti Overvoltage Control'}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {isAr
                          ? 'تفعيل مفاعلات التوازي (Shunt Reactors) لقمع الارتفاع السعوي للجهد في نهاية الخط'
                          : 'Engages shunt reactors to suppress capacitive line rise and voltage surges.'}
                      </p>
                    </div>
                  </div>
                  {restorationStep === 2 && (
                    <button
                      onClick={handleStep2Complete}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      {isAr ? 'شحن خط 132kV' : 'Energize 132kV Bus'}
                    </button>
                  )}
                  {line132kvEnergized && (
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {isAr ? 'الخط مشحون 132kV' : 'CHARGED (132 kV)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3 Card */}
              <div className={`p-4 rounded-xl border transition ${restorationStep === 3 ? 'bg-zinc-900/90 border-amber-500' : 'bg-zinc-950/50 border-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${transformerEnergized ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? 'المرحلة 3: توصيل محول القدرة TR-1 بنظام Point-on-Wave' : 'Stage 3: Controlled Transformer Energization (Zero-Crossing Point-on-Wave)'}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {isAr
                          ? 'إغلاق قاطع 52-1 عند ذروة التدفق المغناطيسي لتلافي تيار الاندفاع العالي وتفادي الفصل الكاذب للمرحل 87T'
                          : 'Eliminates 2nd harmonic inrush currents to prevent differential relay 87T misoperation.'}
                      </p>
                    </div>
                  </div>
                  {restorationStep === 3 && (
                    <button
                      onClick={handleStep3Complete}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      {isAr ? 'توصيل المحول TR-1' : 'Energize TR-1'}
                    </button>
                  )}
                  {transformerEnergized && (
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {isAr ? 'المحول متصل 13.8kV' : 'TR-1 ONLINE'}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 4 Card */}
              <div className={`p-4 rounded-xl border transition ${restorationStep === 4 ? 'bg-zinc-900/90 border-amber-500' : 'bg-zinc-950/50 border-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Hospital className={`w-5 h-5 ${hospitalFeederOnline ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? 'المرحلة 4: إعادة تغذية الأحمال الحيوية والمستشفيات بالتتابع' : 'Stage 4: Priority Feeders Dispatch (Hospital & City Grid)'}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {isAr
                          ? 'إغلاق قواطع المغذيات 13.8kV بالتدريج لتجنب انهيار التردد الحرج'
                          : 'Stepwise feeder breaker closure to prevent dynamic frequency collapse.'}
                      </p>
                    </div>
                  </div>
                  {restorationStep === 4 && (
                    <button
                      onClick={handleStep4Complete}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      {isAr ? 'إعادة تشغيل المغذيات' : 'Restore All Feeders'}
                    </button>
                  )}
                  {hospitalFeederOnline && (
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {isAr ? 'جميع الأحمال موصلة' : 'RESTORED'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Equation Card */}
            <EquationCard
              title={isAr ? 'معادلة تيار الاندفاع المغناطيسي للمحول' : 'Transformer Magnetizing Inrush Current Equation'}
              standard="IEEE C57.91 / IEC 60076"
              equation={
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-rose-300 font-bold">
                  <span>I_peak = 2 × √2 × I_rated × (1 - B_rem / B_sat)</span>
                </div>
              }
              description={
                isAr
                  ? 'حساب أقصى تيار اندفاع كهرومغناطيسي لحظي عند إغلاق القاطع لتحديد زاوية التبديل المتزامنة المناسبة'
                  : 'Calculates peak transient magnetizing inrush current during transformer black start energization.'
              }
              variables={[
                { symbol: 'I_rated', label: isAr ? 'التيار الاسمي للمحول' : 'Transformer Rated Current', value: '209.2', unit: 'A' },
                { symbol: 'B_rem', label: isAr ? 'المغناطيسية المتبقية في القلب' : 'Residual Remanence Flux', value: '0.45', unit: 'Tesla' },
                { symbol: 'B_sat', label: isAr ? 'تدفق تشبع قلب الحديد' : 'Saturation Flux Density', value: '1.95', unit: 'Tesla' }
              ]}
              result={{
                label: isAr ? 'ذروة تيار الاندفاع المتوقع' : 'Expected Peak Inrush Current',
                value: '1,385 A (6.6x In)',
                status: transformerEnergized ? (isAr ? 'تم القمع بنجاح' : 'MITIGATED') : (isAr ? 'خطر تيار عالي' : 'ARMED'),
                statusColor: transformerEnergized ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
              }}
            />
          </div>
        </div>

        {/* Right Column: 5-Stage UFLS Scheme */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm uppercase">
                {isAr ? 'نظام تفريغ الأحمال التلقائي (UFLS)' : 'Under-Frequency Load Shedding (UFLS)'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              5 STAGES
            </span>
          </div>

          {/* Test Frequency Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'تردد الشبكة التجريبي' : 'Simulated Grid Frequency'}:</span>
              <span className={`font-bold text-sm ${testFrequencyHz < 49.0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {testFrequencyHz.toFixed(2)} Hz
              </span>
            </div>
            <input
              type="range"
              min={47.5}
              max={50.5}
              step={0.05}
              value={testFrequencyHz}
              onChange={(e) => setTestFrequencyHz(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>47.5 Hz (Collapse)</span>
              <span>49.0 Hz (Warning)</span>
              <span>50.0 Hz (Nominal)</span>
            </div>
          </div>

          {/* Total Shedding KPI */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-400">{isAr ? 'إجمالي نسبة الأحمال المفصولة' : 'Total Shed Load'}:</span>
            <span className={`font-black text-sm ${totalLoadShedPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalLoadShedPct}%
            </span>
          </div>

          {/* 5-Stage Status List */}
          <div className="space-y-2 font-mono text-xs">
            {updatedUfls.map((st) => (
              <div
                key={st.stage}
                className={`p-3 rounded-xl border transition flex items-center justify-between ${
                  st.tripped
                    ? 'bg-rose-950/40 border-rose-700 text-rose-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
                }`}
              >
                <div>
                  <div className="font-bold text-white text-[11px]">{st.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {isAr ? `العتبة: ${st.thresholdHz} Hz • التأخير: ${st.delaySec}s • النسبة: ${st.loadShedPct}%` : `Threshold: ${st.thresholdHz} Hz • Delay: ${st.delaySec}s • Shed: ${st.loadShedPct}%`}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  st.tripped ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {st.tripped ? (isAr ? 'مفصول TRIPPED' : 'TRIPPED') : (isAr ? 'مسلح ARMED' : 'ARMED')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
