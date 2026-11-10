import React, { useState } from 'react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import {
  Coins,
  TrendingDown,
  Sparkles,
  Zap,
  Sliders,
  DollarSign,
  Leaf,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LossEconomicsModule: React.FC = () => {
  const { tr1State, tr2State, t } = useScada();

  const [tariffUsdPerKwh, setTariffUsdPerKwh] = useState<number>(0.14); // $/kWh
  const [co2FactorKgPerKwh, setCo2FactorKgPerKwh] = useState<number>(0.52); // kg CO2e/kWh
  const [enableAutoParallelOptimization, setEnableAutoParallelOptimization] = useState<boolean>(true);

  // Losses Calculation Model
  // Transformer Nominal: Core Losses $P_0 = 42\text{ kW}$ (Fixed Hysteresis + Eddy), Load Losses $P_k = 180\text{ kW}$ at 50 MVA rated load
  const loadTR1 = (tr1State?.loadCurrent ?? 450.0) / 210.0; // load ratio K1
  const loadTR2 = (tr2State?.loadCurrent ?? 380.0) / 210.0; // load ratio K2

  // TR1 Losses
  const coreLossTR1 = 42.0; // kW
  const copperLossTR1 = 180.0 * Math.pow(loadTR1, 2); // kW
  const totalLossTR1 = coreLossTR1 + copperLossTR1; // kW

  // TR2 Losses
  const coreLossTR2 = 42.0; // kW
  const copperLossTR2 = 180.0 * Math.pow(loadTR2, 2); // kW
  const totalLossTR2 = coreLossTR2 + copperLossTR2; // kW

  const combinedLossKW = totalLossTR1 + totalLossTR2;
  const combinedCostPerHour = combinedLossKW * tariffUsdPerKwh;
  const combinedCo2PerHour = combinedLossKW * co2FactorKgPerKwh;

  // Single Transformer Parallel Optimization Calculation
  // Total Current
  const totalLoadCurrent = (tr1State?.loadCurrent ?? 450.0) + (tr2State?.loadCurrent ?? 380.0);
  const totalRatioK = totalLoadCurrent / 210.0;

  // Single TR Loss if all load on TR1 (and TR2 isolated)
  const singleTrCoreLoss = 42.0;
  const singleTrCopperLoss = 180.0 * Math.pow(totalRatioK, 2);
  const singleTrTotalLossKW = singleTrCoreLoss + singleTrCopperLoss;
  const singleTrCostPerHour = singleTrTotalLossKW * tariffUsdPerKwh;

  const kwSavingsIfSingle = combinedLossKW - singleTrTotalLossKW;
  const costSavingsPerHour = combinedCostPerHour - singleTrCostPerHour;
  const isSingleTrMoreEfficient = totalRatioK < 0.65 && kwSavingsIfSingle > 5.0;

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Title Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-400 shrink-0">
            <Coins className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                {t('econ_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono font-extrabold">
                {t('econ_optimizer')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {t('econ_subtitle')}
            </p>
          </div>
        </div>

        {/* Currency & Tariff Badge */}
        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-3 font-mono text-xs">
          <span className="text-zinc-400">{t('econ_tariff')}: <strong className="text-emerald-400">${tariffUsdPerKwh.toFixed(2)} / kWh</strong></span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">{t('econ_co2')}: <strong className="text-emerald-400">{co2FactorKgPerKwh.toFixed(2)} kg CO₂e/kWh</strong></span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Loss Breakdown & Parallel Optimizer (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* TR1 & TR2 Loss Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            {/* TR1 Loss Card */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white uppercase">{t('econ_tr1_losses')}</span>
                <span className="text-[10px] text-zinc-500 font-bold">50 MVA</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                  <span className="text-zinc-400">{t('econ_core_loss')}:</span>
                  <span className="text-amber-400 font-bold">{coreLossTR1.toFixed(1)} kW</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                  <span className="text-zinc-400">{t('econ_copper_loss')}:</span>
                  <span className="text-cyan-400 font-bold">{copperLossTR1.toFixed(1)} kW</span>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-700 flex justify-between font-bold text-sm">
                  <span className="text-white">{t('econ_total_tr1')}:</span>
                  <span className="text-emerald-400">{totalLossTR1.toFixed(1)} kW</span>
                </div>
              </div>
            </div>

            {/* TR2 Loss Card */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white uppercase">{t('econ_tr2_losses')}</span>
                <span className="text-[10px] text-zinc-500 font-bold">50 MVA</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                  <span className="text-zinc-400">{t('econ_core_loss')}:</span>
                  <span className="text-amber-400 font-bold">{coreLossTR2.toFixed(1)} kW</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                  <span className="text-zinc-400">{t('econ_copper_loss')}:</span>
                  <span className="text-cyan-400 font-bold">{copperLossTR2.toFixed(1)} kW</span>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-700 flex justify-between font-bold text-sm">
                  <span className="text-white">{t('econ_total_tr2')}:</span>
                  <span className="text-emerald-400">{totalLossTR2.toFixed(1)} kW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optimal Parallel Operation Advisor Banner */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">{t('econ_parallel_advisor')}</h3>
                  <p className="text-xs text-zinc-400">{t('econ_parallel_desc')}</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isSingleTrMoreEfficient
                  ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {isSingleTrMoreEfficient ? t('econ_single_suggested') : t('econ_dual_optimal')}
              </span>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">{t('econ_total_substation_loss')}</span>
                <div className="text-2xl font-bold text-white">{combinedLossKW.toFixed(1)} kW</div>
                <span className="text-[10px] text-zinc-400">${combinedCostPerHour.toFixed(2)} / hour</span>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">{t('econ_single_mode_loss')}</span>
                <div className="text-2xl font-bold text-emerald-400">{singleTrTotalLossKW.toFixed(1)} kW</div>
                <span className="text-[10px] text-zinc-400">${singleTrCostPerHour.toFixed(2)} / hour</span>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">{t('econ_potential_savings')}</span>
                <div className={`text-2xl font-bold ${kwSavingsIfSingle > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {kwSavingsIfSingle > 0 ? `+${kwSavingsIfSingle.toFixed(1)} kW` : '0.0 kW'}
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {kwSavingsIfSingle > 0 ? `Save $${(costSavingsPerHour * 24 * 365).toFixed(0)} / year` : 'Optimal Baseline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Economic Parameters & Carbon Footprint Sidebar (1 Col) */}
        <div className="space-y-4 font-mono text-xs">
          {/* Carbon Footprint Card */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase">{t('econ_carbon_title')}</h3>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('econ_hourly_emissions')}:</span>
                <span className="text-emerald-400 font-bold">{combinedCo2PerHour.toFixed(1)} kg CO₂e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('econ_annual_co2')}:</span>
                <span className="text-white font-bold">{((combinedCo2PerHour * 8760) / 1000).toFixed(1)} Metric Tons</span>
              </div>
            </div>
          </div>

          {/* Transformer Loss & Efficiency Equation Box */}
          <EquationCard
            title="Transformer Total Losses Equation"
            standard="IEC 60076-1 / IEEE C57.12"
            equation={
              <div className="flex items-center justify-center space-x-1.5 text-cyan-300 font-bold">
                <span>P<sub>total</sub> = P<sub>0</sub> + P<sub>k</sub> ×</span>
                <span className="text-xl">(</span>
                <div className="inline-flex flex-col items-center px-1">
                  <span className="border-b border-cyan-400/80 pb-0.5">I<sub>load</sub></span>
                  <span className="pt-0.5">I<sub>rated</sub></span>
                </div>
                <span className="text-xl">)</span>
                <sup>2</sup>
              </div>
            }
            description="Sum of fixed core hysteresis losses (P0) and load-dependent copper losses (Pk · K²)"
            variables={[
              { symbol: 'P_0', label: 'Core Hysteresis + Eddy Loss', value: '42.0', unit: 'kW' },
              { symbol: 'P_k', label: 'Full Load Copper Loss', value: '180.0', unit: 'kW' },
              { symbol: 'K1', label: 'TR-1 Load Ratio', value: loadTR1.toFixed(3) },
              { symbol: 'K2', label: 'TR-2 Load Ratio', value: loadTR2.toFixed(3) }
            ]}
            result={{
              label: 'Combined Substation Loss',
              value: combinedLossKW.toFixed(1),
              unit: 'kW',
              status: `$${combinedCostPerHour.toFixed(2)}/hr`,
              statusColor: 'bg-amber-950 text-amber-300 border-amber-800'
            }}
          />

          {/* Economic Settings Sliders */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase">{t('econ_tuning_title')}</h3>
            </div>

            {/* Tariff Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('econ_tariff')}:</span>
                <span className="text-emerald-400 font-bold">${tariffUsdPerKwh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={tariffUsdPerKwh}
                onChange={(e) => setTariffUsdPerKwh(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* CO2 Factor Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('econ_co2')}:</span>
                <span className="text-emerald-400 font-bold">{co2FactorKgPerKwh.toFixed(2)} kg/kWh</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.20"
                step="0.02"
                value={co2FactorKgPerKwh}
                onChange={(e) => setCo2FactorKgPerKwh(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
