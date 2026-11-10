import React, { useState } from 'react';
import { Activity, Clock, Flame, ShieldAlert, Sliders, TrendingUp } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import {
  agingAccelerationFactor as faa,
  dailyLossOfLifePct,
  remainingInsulationHours,
  BASE_INSULATION_LIFE_HOURS
} from '../../lib/engineering/thermalAging';

export const InsulationAgingModule: React.FC = () => {
  const { activeTelemetry, lang } = useScada();
  const isAr = lang === 'ar';

  const [simLoadMult, setSimLoadMult] = useState<number>(100); // 100%
  const [simAmbient, setSimAmbient] = useState<number>(35); // 35°C

  // Compute Hot-spot temperature based on simulation inputs
  const baseHotspot = activeTelemetry?.windingTemp ?? 71.8;
  const simulatedHotspot = Math.max(20, baseHotspot * (simLoadMult / 100) + (simAmbient - (activeTelemetry?.ambientTemp ?? 35)));

  // IEEE C57.91 Aging Acceleration Factor (FAA)
  // FAA = exp(15000/383.15 - 15000 / (Hotspot + 273.15))
  const faaReal = faa(baseHotspot);
  const faaSim = faa(simulatedHotspot);

  // Daily Loss of Life (% LOL) = (FAA * 24 / 180,000) * 100
  const dailyLolPctReal = dailyLossOfLifePct(faaReal);
  const dailyLolPctSim = dailyLossOfLifePct(faaSim);

  // Estimated Remaining Useful Hours
  // Assuming current baseline used 22,000 hours so far
  const consumedHours = 22450;
  const remainingUsefulHours = remainingInsulationHours(consumedHours, faaSim);
  const remainingYears = remainingUsefulHours / 8760;

  // Generate FAA vs Hotspot curve points for visualization
  const hotspotRange = [60, 75, 90, 105, 110, 120, 130, 140];
  const curvePoints = hotspotRange.map((temp) => ({ temp, faa: faa(temp) }));

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'تقادم العزل الكهربائي ونسبة فقدان العمر التراكمي (% LOL) - معيار IEEE C57.91'
                : 'IEEE C57.91 Insulation Aging & Cumulative Loss of Life (LOL)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'نموذج التدهور الحراري للزيت المعدني والورق العازل المحسن حرارياً'
                : 'Thermal Degradation Model for Mineral Oil & Thermally Upgraded Paper Insulation'}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full font-mono">
          {isAr ? 'معيار العمر الأساسي 180,000 ساعة' : '180,000 Hour Base Life Standard'}
        </span>
      </div>

      {/* Main Grid: Realtime Metrics + Interactive Forecast Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* KPI Cards Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1.5">
              <span className="text-[11px] text-slate-400 uppercase font-bold block flex items-center justify-between">
                <span>{isAr ? 'معامل تسارع التقادم (FAA)' : 'Aging Acceleration (FAA)'}</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="flex items-baseline space-x-2 rtl:space-x-reverse font-mono">
                <span className={`text-2xl font-black ${faaSim > 2 ? 'text-rose-400' : faaSim > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {faaSim.toFixed(3)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {isAr ? 'المعيار الطبيعي عند 110°C = 1.000' : 'Nominal @ 110°C Hotspot = 1.000'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1.5">
              <span className="text-[11px] text-slate-400 uppercase font-bold block flex items-center justify-between">
                <span>{isAr ? 'فقدان العمر اليومي (% LOL)' : 'Daily Loss of Life (% LOL)'}</span>
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <div className="flex items-baseline space-x-1 rtl:space-x-reverse font-mono">
                <span className="text-2xl font-black text-rose-400">{dailyLolPctSim.toFixed(4)}%</span>
              </div>
              <p className="text-[10px] text-slate-500">
                {isAr ? 'المعدل الطبيعي (24 ساعة) = 0.0133%' : 'Normal 24h Base = 0.0133%'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-1.5">
              <span className="text-[11px] text-slate-400 uppercase font-bold block flex items-center justify-between">
                <span>{isAr ? 'العمر المتبقي المقدر' : 'Est. Remaining Useful Life'}</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div className="flex items-baseline space-x-1 rtl:space-x-reverse font-mono">
                <span className="text-2xl font-black text-emerald-400">{remainingYears.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-sans">{isAr ? 'سنة' : 'Years'}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                ({remainingUsefulHours.toFixed(0)} {isAr ? 'ساعة متبقية' : 'Hours Remaining'})
              </p>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase text-cyan-400 flex items-center space-x-2 rtl:space-x-reverse">
                <Sliders className="w-4 h-4" />
                <span>{isAr ? 'محاكي توقعات الحمل والحرارة المحيطة' : 'Load & Ambient Forecast Simulator'}</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                {isAr ? 'الإجهاد الحراري التنبؤي' : 'Predictive Thermal Stress'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Load Factor Slider */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{isAr ? 'مضاعف الحمل:' : 'Load Multiplier:'}</span>
                  <span className="font-bold text-amber-400 font-mono">{simLoadMult}% MVA</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  step={5}
                  value={simLoadMult}
                  onChange={(e) => setSimLoadMult(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>50% ({isAr ? 'خفيف' : 'Light'})</span>
                  <span>100% ({isAr ? 'اسمي' : 'Rated'})</span>
                  <span>150% ({isAr ? 'ذروة' : 'Peak'})</span>
                </div>
              </div>

              {/* Ambient Temp Slider */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{isAr ? 'درجة الحرارة المحيطة:' : 'Ambient Temperature:'}</span>
                  <span className="font-bold text-cyan-400 font-mono">{simAmbient}°C</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={55}
                  step={1}
                  value={simAmbient}
                  onChange={(e) => setSimAmbient(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>15°C ({isAr ? 'شتاء' : 'Winter'})</span>
                  <span>35°C ({isAr ? 'متوسط' : 'Avg'})</span>
                  <span>55°C ({isAr ? 'صيف شديد' : 'Extreme Desert'})</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                {isAr ? 'حرارة البقعة الأكثر سخونة المتوقعة بالملفات:' : 'Projected Winding Hot-spot Temperature:'}
              </span>
              <span className={`font-black text-sm font-mono ${simulatedHotspot > 110 ? 'text-rose-400' : 'text-amber-400'}`}>
                {simulatedHotspot.toFixed(1)} °C
              </span>
            </div>
          </div>
        </div>

        {/* IEEE C57.91 Curve Chart / Table */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-slate-200">
              {isAr ? 'حرارة البقعة الساخنة مقابل تسارع التقادم (FAA)' : 'Hot-Spot Temp vs. Aging Acceleration (FAA)'}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">IEEE Std C57.91-2011</span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1.5">{isAr ? 'البقعة الساخنة (°C)' : 'Hotspot (°C)'}</th>
                  <th className="pb-1.5">{isAr ? 'معامل FAA' : 'FAA Factor'}</th>
                  <th className="pb-1.5">{isAr ? 'ساعات التشغيل المكافئة' : 'Equivalent Operating Hours'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {curvePoints.map((pt, idx) => {
                  const isCurrentZone = Math.abs(simulatedHotspot - pt.temp) < 8;
                  return (
                    <tr key={idx} className={isCurrentZone ? 'bg-amber-950/50 font-bold text-amber-300' : 'text-slate-300'}>
                      <td className="py-1.5">{pt.temp}°C</td>
                      <td className="py-1.5">{pt.faa.toFixed(3)}</td>
                      <td className="py-1.5">{(pt.faa * 24).toFixed(1)} {isAr ? 'ساعة/يوم' : 'h / day'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>{isAr ? 'ساعات التشغيل التراكمية الفعلية:' : 'Cumulative Hours Operating:'}</span>
              <span className="text-slate-200 font-bold font-mono">
                {consumedHours.toLocaleString()} {isAr ? 'ساعة' : 'Hours'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'نسبة فقدان العمر التراكمية:' : 'Cumulative % Loss of Life:'}</span>
              <span className="text-amber-400 font-bold font-mono">
                {((consumedHours / BASE_INSULATION_LIFE_HOURS) * 100).toFixed(2)} %
              </span>
            </div>
          </div>

          {/* IEEE C57.91 Mathematical Equation Box */}
          <EquationCard
            title={isAr ? 'صيغة معامل تسارع التقادم (F_AA)' : 'Aging Acceleration Factor (F_AA) Formula'}
            standard="IEEE C57.91-2011"
            equation={
              <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse text-cyan-300 font-bold">
                <span>F<sub>AA</sub> = exp</span>
                <span className="text-xl">⟦</span>
                <div className="inline-flex flex-col items-center px-1">
                  <span className="border-b border-cyan-400/80 pb-0.5">15,000</span>
                  <span className="pt-0.5">383.15</span>
                </div>
                <span>−</span>
                <div className="inline-flex flex-col items-center px-1">
                  <span className="border-b border-cyan-400/80 pb-0.5">15,000</span>
                  <span className="pt-0.5">θ<sub>HST</sub> + 273.15</span>
                </div>
                <span className="text-xl">⟧</span>
              </div>
            }
            description={
              isAr
                ? 'معادلة أرهينيوس لمعدل التفاعل الحراري للتدهور الكيميائي للزيت والورق العازل'
                : 'Arrhenius thermal reaction rate equation for mineral oil & paper thermal degradation'
            }
            variables={[
              {
                symbol: 'F_AA',
                label: isAr ? 'معامل تسارع التقادم' : 'Aging Acceleration Factor',
                value: faaSim.toFixed(3),
              },
              {
                symbol: 'θ_HST',
                label: isAr ? 'حرارة البقعة الساخنة المحاكاة' : 'Simulated Hotspot Temp',
                value: simulatedHotspot.toFixed(1),
                unit: '°C',
              },
              {
                symbol: '15,000',
                label: isAr ? 'ثابت طاقة التنشيط (K)' : 'Activation energy constant (K)',
                value: '15,000',
                unit: 'K',
              },
              {
                symbol: '383.15',
                label: isAr ? 'حرارة البقعة المرجعية (110°C بالكلفن)' : 'Reference hotspot (110°C in K)',
                value: '383.15',
                unit: 'K',
              },
            ]}
            result={{
              label: isAr ? 'فقدان العمر اليومي (% LOL)' : 'Daily Loss of Life (% LOL)',
              value: dailyLolPctSim.toFixed(4),
              unit: isAr ? '% / 24 ساعة' : '% / 24h',
              status: faaSim > 1.5 ? (isAr ? 'متسارع' : 'ACCELERATED') : isAr ? 'طبيعي' : 'NORMAL',
              statusColor:
                faaSim > 1.5
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800',
            }}
          />
        </div>
      </div>
    </div>
  );
};
