import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sun,
  Droplets,
  Flame,
  Gauge,
  Leaf,
  Layers,
  ArrowRight,
  TrendingUp,
  Battery,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const GreenHydrogenMicrogridModule: React.FC = () => {
  const { isArabic: isAr, activeTelemetry, addSoeEvent, addToast } = useScada();

  // Control parameters
  const [solarAllocationPct, setSolarAllocationPct] = useState<number>(65); // 65% to electrolyzer, 35% to grid
  const [targetPressureBar, setTargetPressureBar] = useState<350 | 700>(350);
  const [fuelCellMode, setFuelCellMode] = useState<'OFF' | 'PEAK_SHAVING' | 'BLACK_START'>('PEAK_SHAVING');
  const [fuelCellLoadDemandMw, setFuelCellLoadDemandMw] = useState<number>(2.5); // MW dispatch
  const [storedH2Kg, setStoredH2Kg] = useState<number>(1420); // Initial 1,420 kg H2 in tanks (max 2500 kg)

  // System capacities & constants
  const PEM_CAPACITY_MW = 5.0;
  const PEM_EFFICIENCY = 0.74; // 74% LHV efficiency
  const FC_CAPACITY_MW = 5.0;
  const FC_EFFICIENCY = 0.56; // 56% electrical efficiency
  const WATER_PER_KG_H2_LITERS = 9.0; // 9L demineralized H2O / kg H2
  const MAX_STORAGE_CAPACITY_KG = 2500; // 2.5 metric tons

  // Available Solar generation (from telemetry or baseline 6.5 MW)
  const availableSolarMw = Math.max(1.0, activeTelemetry.solarActivePowerMw || 6.2);

  // Dynamic calculations
  const pemInputPowerMw = useMemo(() => {
    return Math.min(PEM_CAPACITY_MW, availableSolarMw * (solarAllocationPct / 100));
  }, [availableSolarMw, solarAllocationPct]);

  const gridExportSolarMw = useMemo(() => {
    return Math.max(0, availableSolarMw - pemInputPowerMw);
  }, [availableSolarMw, pemInputPowerMw]);

  // Hydrogen production rate in Nm3/h: V_H2 = (P_elec_kW * eta_PEM) / 4.5 kWh/Nm3
  // 1 Nm3 H2 ~ 0.08988 kg H2
  const h2ProductionNm3h = useMemo(() => {
    const powerKw = pemInputPowerMw * 1000;
    return (powerKw * PEM_EFFICIENCY) / 4.5;
  }, [pemInputPowerMw]);

  const h2ProductionKgH = useMemo(() => {
    return h2ProductionNm3h * 0.08988;
  }, [h2ProductionNm3h]);

  const waterConsumptionLitersPerHour = useMemo(() => {
    return h2ProductionKgH * WATER_PER_KG_H2_LITERS;
  }, [h2ProductionKgH]);

  // Fuel cell electrical generation & H2 consumption
  // LHV of H2 = 33.33 kWh/kg. Electrical energy produced = kg_H2 * 33.33 * FC_EFFICIENCY
  // Consumption rate (kg/h) = (P_fc_kW) / (33.33 * FC_EFFICIENCY)
  const actualFcOutputMw = useMemo(() => {
    if (fuelCellMode === 'OFF' || storedH2Kg < 50) return 0;
    if (fuelCellMode === 'BLACK_START') return 4.8; // emergency full support
    return Math.min(FC_CAPACITY_MW, fuelCellLoadDemandMw);
  }, [fuelCellMode, storedH2Kg, fuelCellLoadDemandMw]);

  const h2ConsumptionKgH = useMemo(() => {
    if (actualFcOutputMw === 0) return 0;
    const powerKw = actualFcOutputMw * 1000;
    return powerKw / (33.33 * FC_EFFICIENCY);
  }, [actualFcOutputMw]);

  // Waste Heat recovery (Thermal CHP output)
  const fcThermalPowerMw = useMemo(() => {
    if (actualFcOutputMw === 0) return 0;
    return actualFcOutputMw * (0.32 / FC_EFFICIENCY); // ~32% recovered as district/substation heat
  }, [actualFcOutputMw]);

  // Net Round-Trip Efficiency (Electrolyzer * Fuel Cell)
  const roundTripEfficiencyPct = useMemo(() => {
    return (PEM_EFFICIENCY * FC_EFFICIENCY * 100).toFixed(1);
  }, []);

  // Avoided Carbon Emissions (tons CO2 saved per year projection based on current green generation)
  const annualCo2AvoidedTons = useMemo(() => {
    const totalGreenMwhDay = (gridExportSolarMw + actualFcOutputMw) * 12; // 12h average
    return ((totalGreenMwhDay * 365 * 0.72) / 1).toFixed(1); // 0.72 t CO2/MWh grid factor
  }, [gridExportSolarMw, actualFcOutputMw]);

  const storageSocPct = useMemo(() => {
    return Math.min(100, Math.max(0, (storedH2Kg / MAX_STORAGE_CAPACITY_KG) * 100));
  }, [storedH2Kg]);

  const handleSimulateOneHour = () => {
    const netH2Delta = h2ProductionKgH - h2ConsumptionKgH;
    setStoredH2Kg((prev) => {
      const next = Math.max(0, Math.min(MAX_STORAGE_CAPACITY_KG, prev + netH2Delta));
      return Number(next.toFixed(1));
    });
    addSoeEvent(
      `H2 Buffer Step: +${h2ProductionKgH.toFixed(1)}kg produced, -${h2ConsumptionKgH.toFixed(1)}kg consumed`,
      'H2_MICROGRID',
      'PEM Buffer Controller',
      'INFO'
    );
    addToast(
      isAr
        ? `تم تحديث رصيد الهيدروجين: ${storedH2Kg.toFixed(0)} كجم (${storageSocPct.toFixed(1)}%)`
        : `Hydrogen Buffer Updated: ${storedH2Kg.toFixed(0)} kg (${storageSocPct.toFixed(1)}%)`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-cyan-950/40 border border-emerald-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'منظومة الهيدروجين الأخضر وخلايا الوقود الذكية' : 'Green Hydrogen & Fuel-Cell Microgrid Subsystem'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                    Zero-Emission 5MW
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'محاكاة محلل PEM الكهربائي • تخزين الهيدروجين عالي الضغط (350/700 bar) • خلايا وقود PEMFC لدعم استقرار الشبكة'
                    : 'PEM Electrolyzer Stoechiometry • High-Pressure Storage • Fuel Cell Peak-Shaving & Black-Start Backup'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateOneHour}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isAr ? 'محاكاة تدفق 1 ساعة' : 'Simulate 1-Hour Step'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Sun className="w-4 h-4 text-amber-400" />
              {isAr ? 'إنتاج الهيدروجين اللحظي' : 'H₂ Production Rate'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              PEM Active
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {h2ProductionNm3h.toFixed(1)}{' '}
            <span className="text-xs text-zinc-500 font-normal">Nm³/h</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Mass Flow:</span>
            <span className="text-zinc-200 font-bold">{h2ProductionKgH.toFixed(2)} kg/h</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Gauge className="w-4 h-4 text-cyan-400" />
              {isAr ? 'مخزون الهيدروجين المضغوط' : 'H₂ Storage Bank (SOC)'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
              {targetPressureBar} bar
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {storedH2Kg.toFixed(0)}{' '}
            <span className="text-xs text-zinc-500 font-normal">/ {MAX_STORAGE_CAPACITY_KG} kg</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-500"
              style={{ width: `${storageSocPct}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Flame className="w-4 h-4 text-amber-500" />
              {isAr ? 'توليد خلايا الوقود (PEMFC)' : 'Fuel Cell Generation'}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${actualFcOutputMw > 0 ? 'bg-amber-950 text-amber-300' : 'bg-zinc-800 text-zinc-500'}`}>
              {fuelCellMode}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {actualFcOutputMw.toFixed(2)}{' '}
            <span className="text-xs text-zinc-500 font-normal">MW</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Thermal Recovery:</span>
            <span className="text-zinc-200 font-bold">{fcThermalPowerMw.toFixed(2)} MW_th</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {isAr ? 'الوفر الكربوني السنوي' : 'Avoided CO₂ Emissions'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              GHG Scope 1/2
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {annualCo2AvoidedTons}{' '}
            <span className="text-xs text-zinc-500 font-normal">tCO₂e/yr</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Round-Trip Eff:</span>
            <span className="text-indigo-300 font-bold">{roundTripEfficiencyPct}%</span>
          </div>
        </div>
      </div>

      {/* Main Microgrid Flow & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Flow Diagram (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              {isAr ? 'مخطط تدفق الطاقة والهيدروجين التفاعلي' : 'Microgrid Power & Hydrogen Process Diagram'}
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Solar PV Infeed: <strong className="text-amber-400">{availableSolarMw.toFixed(2)} MW</strong>
            </span>
          </div>

          {/* Process Flow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: Solar Split */}
            <div className="p-4 bg-zinc-950/80 border border-amber-500/20 rounded-xl space-y-2 relative">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4" />
                {isAr ? 'المصفوفة الشمسية' : 'Solar PV Field'}
              </div>
              <div className="text-lg font-mono font-bold text-white">{availableSolarMw.toFixed(2)} MW</div>
              <div className="text-[11px] text-zinc-400 font-mono space-y-1">
                <div>➔ PEM: <strong className="text-emerald-400">{pemInputPowerMw.toFixed(2)} MW</strong></div>
                <div>➔ Grid: <strong className="text-indigo-400">{gridExportSolarMw.toFixed(2)} MW</strong></div>
              </div>
            </div>

            {/* Step 2: PEM Electrolyzer */}
            <div className="p-4 bg-zinc-950/80 border border-emerald-500/20 rounded-xl space-y-2 relative">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                {isAr ? 'محلل PEM 5MW' : 'PEM Electrolyzer'}
              </div>
              <div className="text-lg font-mono font-bold text-emerald-300">
                {h2ProductionKgH.toFixed(1)} <span className="text-xs font-normal">kg/h</span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono space-y-1">
                <div>Efficiency: <strong className="text-zinc-200">74% LHV</strong></div>
                <div>H₂O: <strong className="text-cyan-400">{waterConsumptionLitersPerHour.toFixed(0)} L/h</strong></div>
              </div>
            </div>

            {/* Step 3: High Pressure Storage */}
            <div className="p-4 bg-zinc-950/80 border border-cyan-500/20 rounded-xl space-y-2 relative">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                {isAr ? 'خزانات الضغط' : 'Buffer Tanks'}
              </div>
              <div className="text-lg font-mono font-bold text-cyan-300">
                {targetPressureBar} <span className="text-xs font-normal">bar</span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono space-y-1">
                <div>Capacity: <strong className="text-zinc-200">{storageSocPct.toFixed(1)}%</strong></div>
                <div>Net In/Out: <strong className={h2ProductionKgH >= h2ConsumptionKgH ? 'text-emerald-400' : 'text-rose-400'}>
                  {(h2ProductionKgH - h2ConsumptionKgH).toFixed(1)} kg/h
                </strong></div>
              </div>
            </div>
          </div>

          {/* Mathematical Equations Card */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-2 font-mono text-xs text-zinc-300">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'النموذج الرياضي الكهروكيميائي' : 'Electrochemical Mathematical Formulations'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
                <span className="text-zinc-500 block">Hydrogen Volume Production Rate:</span>
                <span className="text-emerald-300 font-bold">V_H2 (Nm³/h) = (P_elec × η_PEM) / 4.5</span>
              </div>
              <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
                <span className="text-zinc-500 block">Fuel Cell Mass Consumption Rate:</span>
                <span className="text-amber-300 font-bold">ṁ_H2 (kg/h) = P_FC / (33.33 × η_FC)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls Panel (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            {isAr ? 'عناصر التحكم والتوزيع الذكي' : 'Microgrid Dispatch Controls'}
          </h3>

          {/* Slider: Solar Distribution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'توزيع الطاقة الشمسية (محلل/شبكة):' : 'Solar Allocation to PEM:'}</span>
              <span className="text-emerald-400 font-bold">{solarAllocationPct}% PEM ({pemInputPowerMw.toFixed(2)} MW)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={solarAllocationPct}
              onChange={(e) => setSolarAllocationPct(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0% (Full Grid Export)</span>
              <span>100% (Full H₂ Production)</span>
            </div>
          </div>

          {/* Storage Pressure Selector */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <label className="text-xs font-mono text-zinc-400 block">
              {isAr ? 'ضغط أسطوانات التخزين المستهدف:' : 'Target Storage Bank Pressure:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTargetPressureBar(350)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  targetPressureBar === 350
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/25'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                350 bar (Standard Industrial)
              </button>
              <button
                onClick={() => setTargetPressureBar(700)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  targetPressureBar === 700
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/25'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                700 bar (High-Density Bank)
              </button>
            </div>
          </div>

          {/* Fuel Cell Dispatch Mode */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <label className="text-xs font-mono text-zinc-400 block">
              {isAr ? 'نمط تشغيل خلايا الوقود (PEMFC):' : 'Fuel Cell Operating Mode:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['OFF', 'PEAK_SHAVING', 'BLACK_START'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFuelCellMode(mode)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    fuelCellMode === mode
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mode === 'OFF' ? 'Standby' : mode === 'PEAK_SHAVING' ? 'Peak Shave' : 'Black Start'}
                </button>
              ))}
            </div>
          </div>

          {/* FC MW Setpoint when in Peak Shaving */}
          {fuelCellMode === 'PEAK_SHAVING' && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">{isAr ? 'القدرة المطلوبة للحقن:' : 'Target FC Dispatch:'}</span>
                <span className="text-amber-400 font-bold">{fuelCellLoadDemandMw.toFixed(1)} MW</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={fuelCellLoadDemandMw}
                onChange={(e) => setFuelCellLoadDemandMw(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
