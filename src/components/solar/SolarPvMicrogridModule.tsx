import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Zap,
  BatteryCharging,
  Gauge,
  Sliders,
  Sparkles,
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
  Car
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';

export const SolarPvMicrogridModule: React.FC = () => {
  const { tr1State, bessState, setBessManualPower, lang, t, addAuditLog } = useScada();
  const isAr = lang === 'ar';

  // Solar Environmental Conditions
  const [solarIrradiance, setSolarIrradiance] = useState<number>(850); // W/m² (0 - 1200)
  const [ambientTemp, setAmbientTemp] = useState<number>(34); // °C
  const [cloudCoverPct, setCloudCoverPct] = useState<number>(15); // %
  const [inverterMode, setInverterMode] = useState<'VOLT_VAR' | 'FIXED_PF' | 'MAX_P'>('VOLT_VAR');
  const [targetPf, setTargetPf] = useState<number>(0.95);

  // EV Fast Charging Hub State
  const [activeEvBays, setActiveEvBays] = useState<number>(6); // out of 8
  const [evChargerPowerKw, setEvChargerPowerKw] = useState<number>(250); // kW per active vehicle
  const [enablePeakShaving, setEnablePeakShaving] = useState<boolean>(true);

  // Solar PV Physics Model Calculations (20 MW Nameplate Capacity)
  const nameplateCapacityMw = 20.0;
  const tempCoeff = -0.0038; // -0.38% / °C above 25°C STC
  const effectiveIrradiance = Math.max(0, solarIrradiance * (1 - (cloudCoverPct / 100) * 0.85));
  const cellTemp = ambientTemp + (effectiveIrradiance / 800) * (45 - 20);
  const tempDerating = 1 + (cellTemp - 25) * tempCoeff;
  
  // DC and AC Power
  const rawDcPvPowerMw = (nameplateCapacityMw * (effectiveIrradiance / 1000)) * Math.max(0.7, tempDerating);
  const inverterEfficiency = 0.984; // 98.4% CEC
  const actualPvAcActivePowerMw = Math.max(0, Number((rawDcPvPowerMw * inverterEfficiency).toFixed(2)));

  // Grid Voltage 13.8kV Bus interaction
  const baseBusVoltageKv = 13.8;
  // Volt-VAR Smart Inverter Response (IEEE 1547-2018 Curve)
  // If voltage is high -> Inverter absorbs VARs (capacitive/inductive shift)
  // If voltage is low -> Inverter injects VARs
  let voltVarQMvar = 0;
  if (inverterMode === 'VOLT_VAR') {
    // Dynamic Q injection based on bus voltage deviation
    const vDev = (tr1State?.gridVoltage ?? 13.8) - 13.8;
    voltVarQMvar = -Number((vDev * 8.5).toFixed(2)); // reactive support
    voltVarQMvar = Math.max(-6.0, Math.min(6.0, voltVarQMvar));
  } else if (inverterMode === 'FIXED_PF') {
    const angle = Math.acos(targetPf);
    voltVarQMvar = Number((actualPvAcActivePowerMw * Math.tan(angle)).toFixed(2));
  }

  // EV Hub Calculations
  const totalEvDemandMw = Number(((activeEvBays * evChargerPowerKw) / 1000).toFixed(2));
  const bessSupportMw = enablePeakShaving && totalEvDemandMw > 1.0 ? Math.min(3.5, totalEvDemandMw * 0.6) : 0;
  const netSubstationImpactMw = Number((totalEvDemandMw - actualPvAcActivePowerMw - bessSupportMw).toFixed(2));

  // Auto trigger BESS peak shaving when EV demand surges
  useEffect(() => {
    if (enablePeakShaving && bessSupportMw > 0 && bessState.dispatchMode === 'AUTO') {
      setBessManualPower(bessSupportMw);
    }
  }, [enablePeakShaving, bessSupportMw, bessState.dispatchMode, setBessManualPower]);

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Header Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-amber-950/80 border border-amber-600/80 rounded-xl text-amber-400 shrink-0">
            <Sun className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {isAr ? 'منظومة الطاقة الشمسية الكهروضوئية والشحن السريع (20 MW Solar PV & EV)' : '20 MW Utility Solar PV & Ultra-Fast EV Hub'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-mono font-extrabold">
                IEEE 1547-2018 VOLT-VAR
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isAr
                ? 'محاكاة توليد الطاقة الشمسية، تغير الإشعاع وحركة الغيوم، استجابة العواكس الذكية، ومصفوفة شحن السيارات الكهربائية 350kW'
                : 'Utility-scale PV generation with cloud transients, IEEE 1547 smart inverter Volt-VAR grid support, and 350kW EV charging hub.'}
            </p>
          </div>
        </div>

        {/* Real-time KPI Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right rtl:text-left">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">{isAr ? 'توليد الطاقة الشمسية' : 'Solar PV Active Output'}</div>
            <div className="text-base font-black text-amber-400">{actualPvAcActivePowerMw} MW</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right rtl:text-left">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">{isAr ? 'حمل محطة الشحن' : 'EV Hub Demand'}</div>
            <div className="text-base font-black text-cyan-400">{totalEvDemandMw} MW</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right rtl:text-left">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">{isAr ? 'صافي تأثير المحطة' : 'Net Grid Flow'}</div>
            <div className={`text-base font-black ${netSubstationImpactMw <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netSubstationImpactMw > 0 ? `+${netSubstationImpactMw}` : netSubstationImpactMw} MW
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Solar Controls + EV Hub + Volt-VAR Inverter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Solar Farm Environmental Controls */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CloudSun className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm uppercase">
                {isAr ? 'ظروف الإشعاع الشمسي والطقس' : 'Solar Farm Irradiance & Weather'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800">
              STC: 1000 W/m² @ 25°C
            </span>
          </div>

          {/* Solar Irradiance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'الإشعاع الشمسي (G)' : 'Solar Irradiance (G)'}:</span>
              <span className="font-bold text-amber-400">{solarIrradiance} W/m²</span>
            </div>
            <input
              type="range"
              min={0}
              max={1200}
              step={10}
              value={solarIrradiance}
              onChange={(e) => setSolarIrradiance(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>0 (Night)</span>
              <span>600 (Overcast)</span>
              <span>1000 (Peak Sun)</span>
              <span>1200 (Albedo Peak)</span>
            </div>
          </div>

          {/* Cloud Cover Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'تغطية الغيوم المتقطعة' : 'Cloud Intermittency / Shade'}:</span>
              <span className="font-bold text-cyan-400">{cloudCoverPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={cloudCoverPct}
              onChange={(e) => setCloudCoverPct(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Ambient Temp Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'حرارة المحيط' : 'Ambient Temperature'}:</span>
              <span className="font-bold text-orange-400">{ambientTemp} °C</span>
            </div>
            <input
              type="range"
              min={-10}
              max={55}
              step={1}
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-400 uppercase">{isAr ? 'سيناريوهات الطقس السريعة' : 'Weather Presets'}</span>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono font-bold">
              <button
                onClick={() => { setSolarIrradiance(1050); setCloudCoverPct(5); setAmbientTemp(38); }}
                className="p-2 bg-zinc-900 hover:bg-amber-950/60 border border-zinc-800 hover:border-amber-700 rounded-xl transition text-center cursor-pointer"
              >
                ☀️ {isAr ? 'ظهيرة صيفية' : 'Peak Summer'}
              </button>
              <button
                onClick={() => { setSolarIrradiance(450); setCloudCoverPct(65); setAmbientTemp(22); }}
                className="p-2 bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-700 rounded-xl transition text-center cursor-pointer"
              >
                ⛅ {isAr ? 'غيوم متقطعة' : 'Cloud Pass'}
              </button>
              <button
                onClick={() => { setSolarIrradiance(0); setCloudCoverPct(10); setAmbientTemp(18); }}
                className="p-2 bg-zinc-900 hover:bg-indigo-950/60 border border-zinc-800 hover:border-indigo-700 rounded-xl transition text-center cursor-pointer"
              >
                🌙 {isAr ? 'فترة ليلية' : 'Night-time'}
              </button>
            </div>
          </div>

          {/* Cell & Derating Telemetry */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>{isAr ? 'الإشعاع الفعلي الصافي' : 'Effective Irradiance'}:</span>
              <span className="text-white font-bold">{effectiveIrradiance.toFixed(1)} W/m²</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>{isAr ? 'حرارة خلايا السيليكون' : 'PV Cell Temperature'}:</span>
              <span className="text-amber-400 font-bold">{cellTemp.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>{isAr ? 'معامل التخفيض الحراري' : 'Thermal Derating Factor'}:</span>
              <span className="text-emerald-400 font-bold">{(tempDerating * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Column 2: Volt-VAR Smart Inverter Management */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm uppercase">
                {isAr ? 'عواكس الطاقة والتحكم Volt-VAR' : 'Smart Inverter & Volt-VAR Support'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              {inverterMode}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <button
              onClick={() => setInverterMode('VOLT_VAR')}
              className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                inverterMode === 'VOLT_VAR'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Volt-VAR
            </button>
            <button
              onClick={() => setInverterMode('FIXED_PF')}
              className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                inverterMode === 'FIXED_PF'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Fixed cos φ
            </button>
            <button
              onClick={() => setInverterMode('MAX_P')}
              className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                inverterMode === 'MAX_P'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Max P (MPPT)
            </button>
          </div>

          {/* Inverter Readings */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'القدرة الفعالة (P)' : 'Active Power (P)'}</div>
              <div className="text-lg font-black text-amber-400">{actualPvAcActivePowerMw} MW</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'القدرة غير الفعالة (Q)' : 'Reactive Support (Q)'}</div>
              <div className="text-lg font-black text-indigo-400">{voltVarQMvar > 0 ? `+${voltVarQMvar}` : voltVarQMvar} MVAR</div>
            </div>
          </div>

          {/* Equation Card */}
          <EquationCard
            title={isAr ? 'منحنى التحكم بالقدرة غير الفعالة IEEE 1547' : 'IEEE 1547 Volt-VAR Grid Support'}
            standard="IEEE 1547-2018 / IEC 61727"
            equation={
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-cyan-300 font-bold">
                <span>Q(V) = -k × (V_bus - V_nominal)</span>
              </div>
            }
            description={
              isAr
                ? 'استجابة العواكس الكهروضوئية الذكية لحقن أو امتصاص القدرة غير الفعالة لدعم استقرار جهد قضبان 13.8kV'
                : 'Smart PV inverter reactive power response to stabilize 13.8kV bus voltage during solar fluctuations.'
            }
            variables={[
              { symbol: 'V_bus', label: isAr ? 'جهد القضبان الفعلي' : 'Busbar Voltage', value: (tr1State?.gridVoltage ?? 13.8).toFixed(2), unit: 'kV' },
              { symbol: 'V_nom', label: isAr ? 'الجهد الاسمي' : 'Nominal Voltage', value: '13.80', unit: 'kV' },
              { symbol: 'Q_inv', label: isAr ? 'القدرة غير الفعالة المحقونة' : 'Injected Reactive Power', value: voltVarQMvar.toString(), unit: 'MVAR' }
            ]}
            result={{
              label: isAr ? 'حالة استقرار الجهد' : 'Voltage Support Status',
              value: `${(tr1State?.gridVoltage ?? 13.8).toFixed(2)} kV`,
              status: Math.abs((tr1State?.gridVoltage ?? 13.8) - 13.8) < 0.3 ? (isAr ? 'مستقر وضمن الحدود' : 'STABILIZED') : (isAr ? 'انحراف ملحوظ' : 'VOLTAGE FLUX'),
              statusColor: Math.abs((tr1State?.gridVoltage ?? 13.8) - 13.8) < 0.3 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
            }}
          />
        </div>

        {/* Column 3: 350kW Ultra-Fast EV Charging Hub */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Car className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm uppercase">
                {isAr ? 'مصفوفة الشحن السريع للمركبات 350kW' : '350kW Ultra-Fast EV Charging Hub'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              8 BAYS • CCS-2 / NACS
            </span>
          </div>

          {/* Active Bays Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'عدد المركبات المتصلة بالشحن' : 'Active Charging Bays'}:</span>
              <span className="font-bold text-cyan-400">{activeEvBays} / 8 {isAr ? 'سيارات' : 'EVs'}</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={activeEvBays}
              onChange={(e) => setActiveEvBays(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Charging Power per Bay Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'قدرة الشاحن لكل منفذ' : 'Charger Power per Vehicle'}:</span>
              <span className="font-bold text-amber-400">{evChargerPowerKw} kW</span>
            </div>
            <input
              type="range"
              min={50}
              max={350}
              step={25}
              value={evChargerPowerKw}
              onChange={(e) => setEvChargerPowerKw(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Peak Shaving Coordination Toggle */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
                {isAr ? 'تخفيف الذروة بواسطة BESS' : 'BESS Peak Shaving Buffer'}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {isAr ? 'تفريغ البطارية تلقائياً عند زيادة أحمال الشحن' : 'Auto-discharges BESS to mitigate transformer stress'}
              </p>
            </div>
            <button
              onClick={() => setEnablePeakShaving(!enablePeakShaving)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                enablePeakShaving
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {enablePeakShaving ? (isAr ? 'مفعل' : 'ENABLED') : (isAr ? 'معطل' : 'DISABLED')}
            </button>
          </div>

          {/* Visual 8-Bay Status Matrix */}
          <div className="space-y-1.5 font-mono text-[10px]">
            <span className="text-zinc-400 font-bold">{isAr ? 'حالة منافذ الشحن الميدانية' : 'EV Charging Bay Matrix'}</span>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, idx) => {
                const isActive = idx < activeEvBays;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-center font-bold transition ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
                    }`}
                  >
                    <div>Bay 0{idx + 1}</div>
                    <div className="text-[9px] mt-0.5">{isActive ? `${evChargerPowerKw} kW` : 'IDLE'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
