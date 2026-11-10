import React, { useState, useMemo } from 'react';
import {
  Thermometer,
  Flame,
  Activity,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BatteryCharging,
  Layers,
  Sparkles,
  Zap,
  RotateCcw,
  Fan
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { agingAccelerationFactor, dailyLossOfLifePct as dailyLossOfLifePctFromFaa } from '../../lib/engineering/thermalAging';

type CoolingMode = 'ONAN' | 'ONAF' | 'OFAF';

export const TransformerThermalAgingModule: React.FC = () => {
  const { isArabic: isAr, tr1State, activeTelemetry, addSoeEvent, addToast, triggerAlarm } = useScada();

  // Control sliders
  const [loadRatioK, setLoadRatioK] = useState<number>(1.08); // 1.08 pu (108% load)
  const [ambientTempC, setAmbientTempC] = useState<number>(40); // 40°C ambient
  const [coolingMode, setCoolingMode] = useState<CoolingMode>('ONAF');

  // IEEE C57.91 & IEC 60076-7 constants for 63 MVA 132/13.8kV Transformer
  // R = ratio of load loss at rated load to no-load loss (~5.0)
  const R = 5.2;
  const deltaTopOilRated = coolingMode === 'ONAN' ? 45 : coolingMode === 'ONAF' ? 38 : 32;
  const xExp = coolingMode === 'ONAN' ? 0.8 : coolingMode === 'ONAF' ? 0.9 : 1.0;
  const yExp = coolingMode === 'ONAN' ? 1.6 : coolingMode === 'ONAF' ? 1.6 : 2.0;
  const windingGradientRated = coolingMode === 'ONAN' ? 22 : coolingMode === 'ONAF' ? 18 : 14;
  const hotSpotFactorH = 1.3; // Standard hotspot factor

  // 1. Top Oil Temperature Calculation
  const deltaTopOil = useMemo(() => {
    const lossRatio = (1 + R * Math.pow(loadRatioK, 2)) / (1 + R);
    return deltaTopOilRated * Math.pow(lossRatio, xExp);
  }, [loadRatioK, deltaTopOilRated, xExp, R]);

  const topOilTempC = useMemo(() => {
    return ambientTempC + deltaTopOil;
  }, [ambientTempC, deltaTopOil]);

  // 2. Bottom Oil Temperature
  const bottomOilTempC = useMemo(() => {
    const oilDiff = coolingMode === 'ONAN' ? 18 : coolingMode === 'ONAF' ? 14 : 10;
    return Math.max(ambientTempC + 5, topOilTempC - oilDiff);
  }, [topOilTempC, ambientTempC, coolingMode]);

  // 3. Hot-Spot Temperature (IEEE C57.91)
  // Theta_HS = Theta_TO + H * g_r * K^y
  const hotSpotTempC = useMemo(() => {
    const deltaWindingHs = hotSpotFactorH * windingGradientRated * Math.pow(loadRatioK, yExp);
    return topOilTempC + deltaWindingHs;
  }, [topOilTempC, hotSpotFactorH, windingGradientRated, loadRatioK, yExp]);

  // 4. Aging Acceleration Factor (Arrhenius law relative to 110°C ref)
  // F_AA = exp( 15000/383.15 - 15000/(Theta_HS + 273.15) )
  const agingFactorFaa = useMemo(() => agingAccelerationFactor(hotSpotTempC), [hotSpotTempC]);

  // 5. Daily Loss of Life (LOL) % (Normal insulation design life = 180,000 hours ~ 20.55 years)
  const dailyLossOfLifePct = useMemo(() => dailyLossOfLifePctFromFaa(agingFactorFaa), [agingFactorFaa]);

  // 6. Paper Insulation Degree of Polymerization (DP) estimation
  // Fresh = 1200, Normal = 600-800, Critical End of Life = 200
  const estimatedDpValue = useMemo(() => {
    const baseDp = 780; // current operating baseline
    const dpWear = (agingFactorFaa - 1.0) * 45;
    return Math.max(200, Math.min(1200, Math.round(baseDp - dpWear)));
  }, [agingFactorFaa]);

  const isHotSpotCritical = hotSpotTempC >= 120.0;
  const isHotSpotWarning = hotSpotTempC >= 105.0 && hotSpotTempC < 120.0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-950/40 via-zinc-900 to-rose-950/40 border border-orange-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'النموذج الحراري الهيدروليكي المتقدم وشيخوخة المحول' : 'Transformer Thermal Hydraulic Model & Insulation Aging'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold">
                    IEEE C57.91 / IEC 60076-7
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'تدرج حرارة الزيت والنقاط الساخنة (Hot-Spot) • حساب معامل تسارع الشيخوخة (F_AA) وتآكل ورق كرافت العازل (DP)'
                    : 'Winding Hot-Spot Evolution • Arrhenius Aging Factor (F_AA) • Kraft Paper Degree of Polymerization (DP)'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 ${
                isHotSpotCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : isHotSpotWarning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isHotSpotCritical ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>CRITICAL OVERHEAT</span>
                </>
              ) : isHotSpotWarning ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>ELEVATED HOT-SPOT</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>THERMAL NORMAL</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              {isAr ? 'حرارة النقطة الساخنة (θ_HS)' : 'Winding Hot-Spot Temp'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Ref: 110°C
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${isHotSpotCritical ? 'text-rose-400' : isHotSpotWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
            {hotSpotTempC.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">°C</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Top Oil (θ_TO):</span>
            <span className="text-zinc-200 font-bold">{topOilTempC.toFixed(1)}°C</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orange-400" />
              {isAr ? 'معامل تسارع الشيخوخة (F_AA)' : 'Aging Acceleration (F_AA)'}
            </span>
            <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded">
              Arrhenius
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {agingFactorFaa.toFixed(2)}x
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Relative to 110°C:</span>
            <span className="text-zinc-200 font-bold">{agingFactorFaa > 1 ? `+${((agingFactorFaa - 1) * 100).toFixed(0)}% faster` : 'Normal rate'}</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              {isAr ? 'درجة بلمرة الورق (DP)' : 'Kraft Paper DP Level'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
              End-of-Life: 200
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {estimatedDpValue}{' '}
            <span className="text-xs text-zinc-500 font-normal">/ 1200 DP</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Remaining Life Est:</span>
            <span className="text-zinc-200 font-bold">{Math.max(1, Math.round(20.5 / Math.max(0.5, agingFactorFaa)))} years</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {isAr ? 'معدل استهلاك العمر اليومي' : 'Daily Loss of Life (LOL)'}
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">
              24h Exposure
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {dailyLossOfLifePct.toFixed(4)}%
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Design Life Baseline:</span>
            <span className="text-zinc-200 font-bold">180,000 Hours</span>
          </div>
        </div>
      </div>

      {/* Main Hydraulic Cross Section & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Visual Transformer Tank Gradient (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-400" />
              {isAr ? 'التدرج الحراري الداخلي للمحول (Tank Thermal Gradient)' : 'Transformer Tank Hydraulic & Thermal Gradient'}
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Cooling Mode: <strong className="text-cyan-400">{coolingMode}</strong>
            </span>
          </div>

          {/* Interactive Transformer Cross Section Visual */}
          <div className="p-5 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-4 font-mono">
            {/* Top Oil Zone */}
            <div className="p-3 bg-gradient-to-r from-orange-950/60 via-zinc-900 to-orange-950/60 border border-orange-500/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-orange-400 font-bold block">1. TOP OIL ZONE (θ_TO)</span>
                <span className="text-[11px] text-zinc-400">Oil Radiator Header Outlet</span>
              </div>
              <div className="text-lg font-bold text-orange-300">{topOilTempC.toFixed(1)}°C</div>
            </div>

            {/* Winding Hot Spot Zone (Hottest Point) */}
            <div className="p-4 bg-gradient-to-r from-rose-950/70 via-zinc-900 to-rose-950/70 border-2 border-rose-500/60 rounded-xl flex items-center justify-between shadow-lg shadow-rose-950/30">
              <div>
                <span className="text-xs text-rose-400 font-bold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                  2. WINDING HOT-SPOT (θ_HS = θ_TO + H·g_r·K^y)
                </span>
                <span className="text-[11px] text-zinc-400">Upper LV/HV Winding Duct Peak (Max Aging Zone)</span>
              </div>
              <div className="text-xl font-bold text-rose-300">{hotSpotTempC.toFixed(1)}°C</div>
            </div>

            {/* Bottom Oil Zone */}
            <div className="p-3 bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-cyan-950/60 border border-cyan-500/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-cyan-400 font-bold block">3. BOTTOM OIL ZONE (θ_BO)</span>
                <span className="text-[11px] text-zinc-400">Radiator Cooler Return Infeed</span>
              </div>
              <div className="text-lg font-bold text-cyan-300">{bottomOilTempC.toFixed(1)}°C</div>
            </div>
          </div>

          {/* Mathematical Card */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-2 font-mono text-xs text-zinc-300">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'معادلات معيار IEEE C57.91' : 'IEEE C57.91 Standard Equations'}
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1">
              <div>Top Oil: <strong className="text-zinc-200">Δθ_TO = Δθ_TO,rated × [(1 + R·K²) / (1 + R)]^x</strong></div>
              <div>Hot Spot: <strong className="text-rose-300">θ_HS = θ_TO + H · g_rated · K^y</strong></div>
              <div>Arrhenius Aging: <strong className="text-orange-300">F_AA = exp[ 15000/383.15 - 15000/(θ_HS + 273.15) ]</strong></div>
            </div>
          </div>
        </div>

        {/* Right Controls Panel (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            {isAr ? 'معلمات الحمل والتبريد والحرارة' : 'Operating Conditions & Cooling Mode'}
          </h3>

          {/* Cooling Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 block flex items-center gap-1.5">
              <Fan className="w-3.5 h-3.5 text-cyan-400" />
              {isAr ? 'نمط التبريد الميداني (Cooling Stage):' : 'Active Cooling Stage Mode:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ONAN', label: 'ONAN (Natural)' },
                { id: 'ONAF', label: 'ONAF (Forced Air)' },
                { id: 'OFAF', label: 'OFAF (Forced Oil)' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCoolingMode(m.id as CoolingMode)}
                  className={`py-2 px-1 text-[11px] font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                    coolingMode === m.id
                      ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/25'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Load Ratio Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'نسبة الحمل على المحول (K):' : 'Transformer Load Factor (K):'}</span>
              <span className="text-orange-400 font-bold">{loadRatioK.toFixed(2)} pu ({(loadRatioK * 63).toFixed(1)} MVA)</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.8"
              step="0.02"
              value={loadRatioK}
              onChange={(e) => setLoadRatioK(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0.3 pu (Light)</span>
              <span>1.0 pu (Rated 63MVA)</span>
              <span>1.8 pu (Severe Overload)</span>
            </div>
          </div>

          {/* Ambient Temp Slider */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{isAr ? 'درجة الحرارة المحيطة:' : 'Ambient Air Temperature:'}</span>
              <span className="text-amber-400 font-bold">{ambientTempC}°C</span>
            </div>
            <input
              type="range"
              min="0"
              max="55"
              step="1"
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0°C</span>
              <span>30°C</span>
              <span>55°C (Desert Peak)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
