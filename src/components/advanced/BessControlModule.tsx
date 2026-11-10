import React, { useState } from 'react';
import { BatteryCharging, Zap, ShieldCheck, Activity, RefreshCw, Sun } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const BessControlModule: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';
  const [socPct, setSocPct] = useState<number>(84.2);
  const [sohPct] = useState<number>(98.6);
  const [dodPct] = useState<number>(15.8);
  const [cellDeltaV] = useState<number>(0.012); // Volts cell balance delta
  const [bessPowerMW, setBessPowerMW] = useState<number>(2.4); // Active injection MW
  const [ffrArmed, setFfrArmed] = useState<boolean>(true);

  // Toggle FFR Trigger Simulation
  const triggerFfrInjection = () => {
    setBessPowerMW(9.8); // Inject full 10MW within 200ms
    setTimeout(() => {
      setBessPowerMW(2.4);
    }, 3000);
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-400">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'خلية منظومة تخزين الطاقة بالبطاريات (10 MW / 40 MWh LiFePO₄ BESS)'
                : '10 MW / 40 MWh LiFePO₄ Battery Energy Storage System (BESS) Bay'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'الاستجابة فائقة السرعة لتذبذب التردد (FFR < 200ms) وتنعيم تدفق الطاقة الشمسية والرياح'
                : 'Sub-second Fast Frequency Response (FFR) & Solar/Wind Renewable Power Flow Smoothing Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={triggerFfrInjection}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-lg flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>{isAr ? 'اختبار حقن التردد السريع FFR (10MW)' : 'Test Sub-Second FFR Surge (10MW)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Core BESS State KPIs */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center space-x-2 rtl:space-x-reverse">
              <BatteryCharging className="w-4 h-4" />
              <span>{isAr ? 'قياسات حزم خلايا البطارية وموازنة الجهد' : 'BESS Cell Pack Telemetry & Balancing'}</span>
            </h4>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              LiFePO4 Chemistry
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'حالة الشحن (% SOC)' : 'State of Charge (% SOC)'}
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{socPct.toFixed(1)}%</span>
              <p className="text-[9px] text-slate-500">{isAr ? 'النطاق المستهدف: 20% - 90%' : 'Target Band: 20% - 90%'}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'صحة البطارية (% SOH)' : 'State of Health (% SOH)'}
              </span>
              <span className="text-2xl font-black text-cyan-400 font-mono">{sohPct.toFixed(1)}%</span>
              <p className="text-[9px] text-slate-500">{isAr ? '1,240 دورة شحن كلية' : '1,240 Total Cycles'}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'عمق التفريغ (DOD)' : 'Depth of Discharge'}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">{dodPct.toFixed(1)}%</span>
              <p className="text-[9px] text-slate-500">{isAr ? 'الاحتياطي 40 MWh' : 'Reserve 40 MWh Base'}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'فارق توازن الخلايا ΔV' : 'Cell Balance ΔV'}
              </span>
              <span className="text-2xl font-black text-purple-300 font-mono">{cellDeltaV} V</span>
              <p className="text-[9px] text-slate-500">{isAr ? 'نظام BMS نشط وطبيعي' : 'BMS Auto-Balancing OK'}</p>
            </div>
          </div>

          {/* Graphical SOC Bar */}
          <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">
                {isAr
                  ? 'سعة التخزين الحالية المتاحة (33.68 MWh / 40.0 MWh):'
                  : 'Total Available Storage Capacity (33.68 MWh / 40.0 MWh):'}
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {socPct.toFixed(1)}% {isAr ? 'مشحون' : 'Full'}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${socPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* FFR & Solar Smoothing Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-purple-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Zap className="w-4 h-4" />
              <span>{isAr ? 'خدمة استقرار التردد السريع للشبكة (FFR)' : 'Fast Frequency Response (FFR) Grid Service'}</span>
            </h4>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block mb-1">
                {isAr ? 'حقن / امتصاص القدرة الفعالة:' : 'Active Power Injection / Absorption:'}
              </span>
              <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
                <span className="text-3xl font-black text-purple-300 font-mono">{bessPowerMW.toFixed(1)} MW</span>
                <span className="text-xs text-emerald-400 font-bold">
                  {isAr ? '(محقونة في الشبكة)' : '(Injected to Grid)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setFfrArmed(!ffrArmed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                ffrArmed
                  ? 'bg-purple-950 text-purple-300 border-purple-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {ffrArmed
                ? isAr ? 'FFR في حالة تأهب' : 'FFR ARMED'
                : isAr ? 'FFR غير مفعل' : 'FFR DISARMED'}
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'زمن الاستجابة للحدث:' : 'Response Trigger Delay:'}</span>
              <strong className="text-emerald-400 font-mono">&lt; 180 ms (&lt; 50.0 Hz drop)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'تنعيم تذبذب الطاقة المتجددة:' : 'Renewable Ramp Rate Smoothing:'}</span>
              <strong className="text-cyan-300 font-mono">{isAr ? 'نشط (بحد أقصى 1 MW/دقيقة)' : 'ACTIVE (Max 1 MW/min)'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
