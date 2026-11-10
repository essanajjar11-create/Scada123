import React, { useState } from 'react';
import {
  Zap,
  Battery,
  BatteryCharging,
  TrendingUp,
  Sliders,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Award,
  Leaf,
  Sun,
  Flame,
  Activity,
  Layers,
  Thermometer,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { useScada } from '../../context/ScadaContext';
import { ForecastPoint } from '../../types/scada';
import { EquationCard } from '../common/EquationCard';

type GridScenario = 'URBAN_STANDARD' | 'HEATWAVE_PEAK' | 'SOLAR_DUCK_CURVE' | 'INDUSTRIAL_DROP';
type BessSubTab = 'PEAK_SHAVING' | 'FCR_FREQUENCY' | 'ENERGY_ARBITRAGE' | 'CELL_THERMAL';

export const BessForecastModule: React.FC = () => {
  const {
    tr1Telemetry,
    tr2Telemetry,
    bessState,
    setBessDispatchMode,
    setBessManualPower,
    gridFrequency,
    addAuditLog,
    t
  } = useScada();

  const [activeSubTab, setActiveSubTab] = useState<BessSubTab>('PEAK_SHAVING');
  const [activeScenario, setActiveScenario] = useState<GridScenario>('URBAN_STANDARD');
  const [manualSliderPower, setManualSliderPower] = useState<number>(bessState.powerMW || 0);

  // FCR Frequency Droop state
  const [simFreq, setSimFreq] = useState<number>(50.0);
  const [droopPercentage, setDroopPercentage] = useState<number>(4.0); // 4% droop

  // FCR Math: Droop Response MW = -(Delta F / (Droop% * F_nom)) * P_max
  const deltaF = simFreq - 50.0;
  const fcrPowerMW = Math.abs(deltaF) > 0.02
    ? Number((-1.0 * (deltaF / ((droopPercentage / 100.0) * 50.0)) * 10.0).toFixed(2))
    : 0.0;
  const clampedFcrMW = Math.max(-10.0, Math.min(10.0, fcrPowerMW));

  const totalMW = ((tr1Telemetry?.activePower ?? 20000) + (tr2Telemetry?.activePower ?? 20000)) / 1000.0;
  const isPeakLoading = totalMW > 42.5; // >85% capacity
  const isOffPeakLoading = totalMW < 20.0; // <40% capacity

  // 24-Hour Day-Ahead Wholesale Prices ($/MWh) & Load Forecast
  const getForecastData = (): (ForecastPoint & { priceMWh: number; arbitrageProfit: number })[] => {
    const basePoints = [
      { hour: '00:00', hourNum: 0, forecastMW: 18.2, actualMW: 17.8, bessContributionMW: -5.0, priceMWh: 32.0, arbitrageProfit: -160 },
      { hour: '02:00', hourNum: 2, forecastMW: 15.4, actualMW: 15.1, bessContributionMW: -5.0, priceMWh: 28.5, arbitrageProfit: -142.5 },
      { hour: '04:00', hourNum: 4, forecastMW: 14.8, actualMW: 14.9, bessContributionMW: -5.0, priceMWh: 26.0, arbitrageProfit: -130 },
      { hour: '06:00', hourNum: 6, forecastMW: 22.1, actualMW: 21.8, bessContributionMW: 0.0, priceMWh: 45.0, arbitrageProfit: 0 },
      { hour: '08:00', hourNum: 8, forecastMW: 38.5, actualMW: 39.2, bessContributionMW: 0.0, priceMWh: 85.0, arbitrageProfit: 0 },
      { hour: '10:00', hourNum: 10, forecastMW: 44.2, actualMW: 45.1, bessContributionMW: 5.0, priceMWh: 110.0, arbitrageProfit: 550 },
      { hour: '12:00', hourNum: 12, forecastMW: 48.6, actualMW: 49.0, bessContributionMW: 8.0, priceMWh: 145.0, arbitrageProfit: 1160 },
      { hour: '14:00', hourNum: 14, forecastMW: 46.8, actualMW: 47.2, bessContributionMW: 6.0, priceMWh: 130.0, arbitrageProfit: 780 },
      { hour: '16:00', hourNum: 16, forecastMW: 42.0, actualMW: 41.5, bessContributionMW: 2.0, priceMWh: 95.0, arbitrageProfit: 190 },
      { hour: '18:00', hourNum: 18, forecastMW: 36.4, actualMW: 36.8, bessContributionMW: 0.0, priceMWh: 120.0, arbitrageProfit: 0 },
      { hour: '20:00', hourNum: 20, forecastMW: 28.5, actualMW: 28.1, bessContributionMW: 0.0, priceMWh: 75.0, arbitrageProfit: 0 },
      { hour: '22:00', hourNum: 22, forecastMW: 21.0, actualMW: 20.6, bessContributionMW: -3.0, priceMWh: 40.0, arbitrageProfit: -120 }
    ];

    if (activeScenario === 'HEATWAVE_PEAK') {
      return basePoints.map((p) => ({
        ...p,
        forecastMW: Number((p.forecastMW * 1.22).toFixed(1)),
        actualMW: Number((p.actualMW! * 1.24).toFixed(1)),
        bessContributionMW: p.actualMW! * 1.24 > 40 ? 10.0 : p.actualMW! * 1.24 < 20 ? -5.0 : 0,
        priceMWh: Number((p.priceMWh * 1.4).toFixed(1)),
        arbitrageProfit: Number((p.arbitrageProfit * 1.4).toFixed(1))
      }));
    }

    if (activeScenario === 'SOLAR_DUCK_CURVE') {
      return basePoints.map((p) => {
        let fMW = p.forecastMW;
        let pr = p.priceMWh;
        if (p.hourNum >= 10 && p.hourNum <= 15) {
          fMW = 14.5;
          pr = 12.0; // Negative / cheap mid-day solar
        }
        if (p.hourNum >= 18 && p.hourNum <= 21) {
          fMW = 52.0;
          pr = 195.0; // Evening duck curve ramp
        }
        const bMW = fMW > 40 ? 8.0 : fMW < 18 ? -5.0 : 0;
        return {
          ...p,
          forecastMW: Number(fMW.toFixed(1)),
          actualMW: Number((fMW * 0.98).toFixed(1)),
          bessContributionMW: bMW,
          priceMWh: pr,
          arbitrageProfit: Number((bMW * pr * 2).toFixed(1))
        };
      });
    }

    if (activeScenario === 'INDUSTRIAL_DROP') {
      return basePoints.map((p) => ({
        ...p,
        forecastMW: Number((p.forecastMW * 0.75).toFixed(1)),
        actualMW: Number((p.actualMW! * 0.73).toFixed(1)),
        bessContributionMW: -4.0,
        priceMWh: Number((p.priceMWh * 0.8).toFixed(1)),
        arbitrageProfit: Number((p.arbitrageProfit * 0.8).toFixed(1))
      }));
    }

    return basePoints;
  };

  const chartData = getForecastData();

  const handleManualSliderChange = (val: number) => {
    setManualSliderPower(val);
    setBessManualPower(val);
  };

  const handleScenarioChange = (scen: GridScenario) => {
    setActiveScenario(scen);
    addAuditLog('SYSTEM', `Selected BESS Load Forecast Grid Scenario: ${scen}`);
  };

  // Stacked Revenue calculations
  const peakShavedMW = Math.max(0, totalMW - 40.0);
  const dailyPeakSavings = peakShavedMW * 1000 * 0.12 * 4; // $
  const dailyFcrRevenue = 10 * 18.5 * 24; // $4,440/day capacity reservation
  const dailyArbitrageNetProfit = chartData.reduce((sum, p) => sum + (p.bessContributionMW > 0 ? p.bessContributionMW * p.priceMWh * 2 : p.bessContributionMW * p.priceMWh * 2), 0);
  const totalStackedDailyRevenue = Math.round(dailyPeakSavings + dailyFcrRevenue + Math.max(0, dailyArbitrageNetProfit));

  return (
    <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <BatteryCharging className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {t('bess_suite_title')}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {t('bess_capacity_badge')}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {t('bess_subtitle')}
            </p>
          </div>
        </div>

        {/* Dispatch Mode Toggle */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setBessDispatchMode('AUTO')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              bessState.dispatchMode === 'AUTO'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t('bess_auto_dispatch')}</span>
          </button>
          <button
            onClick={() => setBessDispatchMode('MANUAL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              bessState.dispatchMode === 'MANUAL'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('bess_manual_dispatch')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => setActiveSubTab('PEAK_SHAVING')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeSubTab === 'PEAK_SHAVING'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          {t('bess_subtab_peak')}
        </button>
        <button
          onClick={() => setActiveSubTab('FCR_FREQUENCY')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeSubTab === 'FCR_FREQUENCY'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          {t('bess_subtab_fcr')}
        </button>
        <button
          onClick={() => setActiveSubTab('ENERGY_ARBITRAGE')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeSubTab === 'ENERGY_ARBITRAGE'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          {t('bess_subtab_tou')}
        </button>
        <button
          onClick={() => setActiveSubTab('CELL_THERMAL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeSubTab === 'CELL_THERMAL'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          {t('bess_subtab_thermal')}
        </button>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        {/* SOC */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('bess_soc')}</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{(bessState?.socPct ?? 82.5).toFixed(1)}%</span>
            <span className="text-[10px] text-zinc-500">40 MWh Cap</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (bessState?.socPct ?? 82.5) < 20 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${bessState?.socPct ?? 82.5}%` }}
            ></div>
          </div>
        </div>

        {/* Active Power */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('bess_power_dispatch')}</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                (bessState?.powerMW ?? 0) > 0
                  ? 'text-emerald-400'
                  : (bessState?.powerMW ?? 0) < 0
                  ? 'text-cyan-400'
                  : 'text-zinc-400'
              }`}
            >
              {(bessState?.powerMW ?? 0) > 0 ? `+${(bessState?.powerMW ?? 0).toFixed(1)} MW` : `${(bessState?.powerMW ?? 0).toFixed(1)} MW`}
            </span>
            <span className="text-[10px] text-zinc-500">Max ±10 MW</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            {bessState.powerMW > 0 ? t('bess_discharging') : bessState.powerMW < 0 ? t('bess_charging') : t('bess_standby')}
          </span>
        </div>

        {/* Total Stacked Revenue */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('bess_stacked_revenue')}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">${totalStackedDailyRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500">/ Day</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            Peak Shaving + FCR + Arbitrage
          </span>
        </div>

        {/* Cell Health */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('bess_soh')}</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">98.2%</span>
            <span className="text-[10px] text-emerald-400 font-bold">EXCELLENT</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            420 EFC Cycles • 31.2°C Cell Temp
          </span>
        </div>
      </div>

      {/* Sub-Tab 1: 24-Hour Load Forecast & Peak Shaving */}
      {activeSubTab === 'PEAK_SHAVING' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Demand Curve Scenario:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => handleScenarioChange('URBAN_STANDARD')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeScenario === 'URBAN_STANDARD'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Urban Baseline Curve
              </button>
              <button
                onClick={() => handleScenarioChange('HEATWAVE_PEAK')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeScenario === 'HEATWAVE_PEAK'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 inline mr-1 text-rose-300" /> Heatwave Peak (+22%)
              </button>
              <button
                onClick={() => handleScenarioChange('SOLAR_DUCK_CURVE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeScenario === 'SOLAR_DUCK_CURVE'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 inline mr-1 text-amber-300" /> Solar Duck Curve
              </button>
              <button
                onClick={() => handleScenarioChange('INDUSTRIAL_DROP')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeScenario === 'INDUSTRIAL_DROP'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Industrial Outage (-25%)
              </button>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wide">
                24-Hour AI Predictive Load Curve vs BESS Peak Shaving
              </h3>
              <span className="text-xs font-mono text-zinc-400">Peak Shave Threshold: 40.0 MW</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#71717a" fontSize={11} fontFamily="monospace" unit=" MW" domain={[0, 70]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Peak Shave Threshold (40MW)', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="forecastMW" name="AI Forecasted Demand (MW)" stroke="#818cf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actualMW" name="Actual Real-Time Demand (MW)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="stepAfter" dataKey="bessContributionMW" name="BESS Dispatch (MW)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Fast Frequency Response (FCR Droop) */}
      {activeSubTab === 'FCR_FREQUENCY' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Fast Frequency Containment Reserve (FCR / FFR Droop Controller)
              </h3>
              <p className="text-xs text-zinc-400">
                Sub-200ms synthetic inertia response to primary grid frequency disturbances.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              ⚡ FCR RESPONSE ACTIVE (&lt;200ms)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            {/* Frequency Deviation Slider */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Grid Frequency (f):</span>
                <span className={`text-base font-extrabold ${simFreq < 49.9 ? 'text-rose-400' : simFreq > 50.1 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                  {simFreq.toFixed(2)} Hz
                </span>
              </div>
              <input
                type="range"
                min="49.70"
                max="50.30"
                step="0.01"
                value={simFreq}
                onChange={(e) => setSimFreq(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>49.70 Hz (Under-Freq)</span>
                <span>50.00 Hz</span>
                <span>50.30 Hz (Over-Freq)</span>
              </div>
              <button
                onClick={() => setSimFreq(50.0)}
                className="w-full py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-sans font-bold cursor-pointer"
              >
                Reset to 50.00 Hz
              </button>
            </div>

            {/* Droop Response MW */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Autonomous Droop Output</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-extrabold ${clampedFcrMW > 0 ? 'text-emerald-400' : clampedFcrMW < 0 ? 'text-cyan-400' : 'text-zinc-400'}`}>
                  {clampedFcrMW > 0 ? `+${clampedFcrMW.toFixed(2)} MW` : `${clampedFcrMW.toFixed(2)} MW`}
                </span>
                <span className="text-[10px] text-zinc-500">Droop: {droopPercentage}%</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-sans block pt-1">
                {clampedFcrMW > 0
                  ? '⚡ Under-Frequency: Injecting power within 180ms'
                  : clampedFcrMW < 0
                  ? '🔌 Over-Frequency: Absorbing excess generation'
                  : 'Deadband zone (±0.02 Hz)'}
              </span>
            </div>

            {/* FCR Market Value */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">FCR Ancillary Service Rate</span>
              <span className="text-2xl font-extrabold text-indigo-400">$18.50 / MW-h</span>
              <span className="text-[10px] text-zinc-400 font-sans block">
                Daily Capacity Payment: $4,440.00 (10 MW reserved)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Time-of-Use Arbitrage */}
      {activeSubTab === 'ENERGY_ARBITRAGE' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Day-Ahead Wholesale Electricity Price Curve & Arbitrage Margin
              </h3>
              <p className="text-xs text-zinc-400">
                Charge at low/negative off-peak prices ($26/MWh) & Discharge during peak hours ($145/MWh).
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Net Arbitrage Margin: ${(Math.max(0, dailyArbitrageNetProfit)).toFixed(0)} / day
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="hour" stroke="#71717a" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#71717a" fontSize={11} fontFamily="monospace" unit=" $/MWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="priceMWh" name="Wholesale Price ($/MWh)" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Cell Thermal & Degradation Health */}
      {activeSubTab === 'CELL_THERMAL' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide font-sans">
                Battery Cell Temperature Distribution & Degradation (Q_loss) Model
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Arrhenius electrochemical aging, SEI layer growth, and HVAC auxiliary power balancing.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              OPTIMAL THERMAL ZONE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[10px] block">Mean Cell Temperature</span>
              <span className="text-xl font-extrabold text-emerald-400">31.2 °C</span>
              <span className="text-[10px] text-zinc-500 block">Target: 25 - 35 °C</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[10px] block">HVAC Inverter Power</span>
              <span className="text-xl font-extrabold text-cyan-400">18.4 kW</span>
              <span className="text-[10px] text-zinc-500 block">Liquid cooling loop active</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[10px] block">SEI Layer Loss (Q_loss)</span>
              <span className="text-xl font-extrabold text-white">1.8%</span>
              <span className="text-[10px] text-zinc-500 block">Projected 15-year life</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[10px] block">Round-Trip Efficiency</span>
              <span className="text-xl font-extrabold text-amber-400">92.4%</span>
              <span className="text-[10px] text-zinc-500 block">Inverter + Cell losses</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
