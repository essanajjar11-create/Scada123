import React, { useState, useEffect } from 'react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import {
  Thermometer,
  Wind,
  Sun,
  Gauge,
  Clock,
  AlertTriangle,
  Zap,
  Sliders,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export const DynamicRatingModule: React.FC = () => {
  const { tr1State, activeTelemetry, t } = useScada();
  const nameplateMVA = activeTelemetry?.ratingMVA ?? 40.0;

  // Weather parameters state
  const [ambientTempC, setAmbientTempC] = useState<number>(32); // °C
  const [windSpeedMS, setWindSpeedMS] = useState<number>(3.5); // m/s
  const [solarIrradiance, setSolarIrradiance] = useState<number>(650); // W/m^2
  const [appliedLoadMVA, setAppliedLoadMVA] = useState<number>(35.0); // MVA load

  // IEEE 738 / IEC 60076-7 Dynamic Rating Engine
  // Nominal Base: 40 MVA at Tamb=30°C, Wind=1.0m/s, Solar=800W/m^2
  const tempCorrection = (30 - ambientTempC) * 0.35; // MVA adjustment per °C
  const windCorrection = (windSpeedMS - 1.0) * 0.70; // MVA gain from forced convection
  const solarCorrection = ((800 - solarIrradiance) / 800) * 1.5; // MVA adjustment

  const dynamicRatingMVA = Math.min(60.0, Math.max(25.0, nameplateMVA + tempCorrection + windCorrection + solarCorrection));
  const loadPercentageDynamic = (appliedLoadMVA / dynamicRatingMVA) * 100;
  const loadPercentageNameplate = (appliedLoadMVA / nameplateMVA) * 100;

  // Hotspot Temperature Estimation $\Theta_H$
  // $\Theta_H = T_{amb} + \Delta \Theta_O + \Delta \Theta_{H,R} \cdot (K)^1.6$
  const loadRatioK = appliedLoadMVA / nameplateMVA;
  const estimatedHotspotC = ambientTempC + 45.0 * Math.pow(loadRatioK, 1.6) - (windSpeedMS * 1.2);

  // Safe Overload Countdown Calculation
  // Time until $\Theta_H = 140^\circ\text{C}$
  const deltaTempRemaining = Math.max(0, 140.0 - estimatedHotspotC);
  // Thermal time constant $\tau \approx 90$ mins
  const safeTimeMinutes = Math.max(0, Math.round(deltaTempRemaining * 3.2));

  // Live Timer Countdown state
  const [countdownSeconds, setCountdownSeconds] = useState<number>(safeTimeMinutes * 60);

  useEffect(() => {
    setCountdownSeconds(safeTimeMinutes * 60);
  }, [safeTimeMinutes]);

  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Title Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-950/80 border border-amber-700/80 rounded-xl text-amber-400 shrink-0">
            <Thermometer className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                {t('dtr_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-mono font-extrabold">
                {t('dtr_engine')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {t('dtr_subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">{t('dtr_nameplate')} <strong className="text-white">{nameplateMVA.toFixed(1)} MVA</strong></span>
          <span className="text-zinc-600">|</span>
          <span className="text-xs font-mono text-amber-400">{t('dtr_dynamic_cap')} <strong className="text-amber-300 text-sm">{dynamicRatingMVA.toFixed(1)} MVA</strong></span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Dynamic Capacity & Overload Countdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Comparison Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gauge 1: Dynamic Capacity */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-400">DYNAMIC AVAILABLE CAPACITY</span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono rounded font-bold">
                  IEEE 738
                </span>
              </div>

              <div className="text-3xl font-mono font-extrabold text-amber-400">
                {dynamicRatingMVA.toFixed(1)} <span className="text-base text-zinc-400">MVA</span>
              </div>

              <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dynamicRatingMVA / 60.0) * 100)}%` }}
                ></div>
              </div>

              <div className="text-[11px] font-mono text-zinc-400 flex justify-between">
                <span>Min: 25 MVA</span>
                <span>Nameplate: {nameplateMVA} MVA</span>
                <span>Max: 60 MVA</span>
              </div>
            </div>

            {/* Gauge 2: Applied Overload */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-400">APPLIED SUBSTATION LOAD</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  appliedLoadMVA > dynamicRatingMVA ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}>
                  {appliedLoadMVA > dynamicRatingMVA ? 'DYNAMIC OVERLOAD HAZARD' : 'SAFE DYNAMIC RANGE'}
                </span>
              </div>

              <div className="text-3xl font-mono font-extrabold text-white">
                {appliedLoadMVA.toFixed(1)} <span className="text-base text-zinc-400">MVA</span>
              </div>

              <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    appliedLoadMVA > dynamicRatingMVA ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (appliedLoadMVA / 60.0) * 100)}%` }}
                ></div>
              </div>

              <div className="text-[11px] font-mono text-zinc-400 flex justify-between">
                <span>Nameplate Load: <strong className="text-white">{loadPercentageNameplate.toFixed(0)}%</strong></span>
                <span>Dynamic Load: <strong className="text-amber-300">{loadPercentageDynamic.toFixed(0)}%</strong></span>
              </div>
            </div>
          </div>

          {/* Safe Overload Countdown Timer Banner */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-rose-400 animate-pulse" />
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase">Safe Overload Duration Countdown</h3>
                  <p className="text-xs text-zinc-400">Estimated time before Hotspot Temperature reaches critical 140°C limit</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                countdownSeconds < 600 ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse' : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                HOTSPOT: {estimatedHotspotC.toFixed(1)} °C
              </span>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-mono text-zinc-500 font-bold uppercase">Time Remaining:</span>
                <div className="text-5xl font-mono font-extrabold text-rose-400 tracking-tight">
                  {formatCountdown(countdownSeconds)}
                </div>
                <span className="text-[11px] font-mono text-zinc-400">Minutes : Seconds</span>
              </div>

              <div className="space-y-2 text-xs font-mono text-zinc-300 max-w-xs">
                <div className="flex justify-between border-b border-zinc-800 pb-1">
                  <span className="text-zinc-400">Max Hotspot Limit:</span>
                  <span className="text-rose-400 font-bold">140.0 °C</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1">
                  <span className="text-zinc-400">Top-Oil Thermal Rise:</span>
                  <span className="text-amber-300 font-bold">{(estimatedHotspotC - ambientTempC - 20).toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Insulation Loss Rate:</span>
                  <span className="text-purple-300 font-bold">{Math.pow(2, (estimatedHotspotC - 110) / 6).toFixed(1)}x Normal</span>
                </div>
              </div>
            </div>

            {/* DTR Thermal Equation Card */}
            <EquationCard
              title="IEEE 738 / IEC 60076-7 Winding Hotspot Thermal Equation"
              standard="IEEE C57.91-2011"
              equation={
                <div className="flex items-center justify-center space-x-1.5 text-cyan-300 font-bold">
                  <span>θ<sub>HST</sub> = T<sub>amb</sub> + Δθ<sub>TO</sub> + Δθ<sub>H,R</sub> ×</span>
                  <span className="text-xl">(</span>
                  <div className="inline-flex flex-col items-center px-1">
                    <span className="border-b border-cyan-400/80 pb-0.5">I<sub>load</sub></span>
                    <span className="pt-0.5">I<sub>rated</sub></span>
                  </div>
                  <span className="text-xl">)</span>
                  <sup>1.6</sup>
                  <span>− 1.2 × V<sub>wind</sub></span>
                </div>
              }
              description="Convection and forced air wind cooling model calculating hot-spot conductor thermal rise"
              variables={[
                { symbol: 'T_amb', label: 'Ambient Temperature', value: ambientTempC, unit: '°C' },
                { symbol: 'V_wind', label: 'Wind Velocity', value: windSpeedMS.toFixed(1), unit: 'm/s' },
                { symbol: 'S', label: 'Solar Irradiance', value: solarIrradiance, unit: 'W/m²' },
                { symbol: 'K', label: 'Load Overload Ratio', value: loadRatioK.toFixed(2) }
              ]}
              result={{
                label: 'Projected Hotspot Temperature (θ_HST)',
                value: estimatedHotspotC.toFixed(1),
                unit: '°C',
                status: estimatedHotspotC > 110 ? 'OVER-TEMP' : 'SAFE',
                statusColor: estimatedHotspotC > 110 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }}
            />
          </div>
        </div>

        {/* Column 3: Real-Time Weather Controls Sidebar */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl font-mono">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase">{t('dtr_weather_controls')}</h3>
          </div>

          {/* Ambient Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300"><Thermometer className="w-4 h-4 text-rose-400" /> {t('dtr_amb_temp')}:</span>
              <span className="text-rose-400 font-bold text-sm">{ambientTempC} °C</span>
            </div>
            <input
              type="range"
              min="10"
              max="55"
              step="1"
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Wind Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300"><Wind className="w-4 h-4 text-cyan-400" /> {t('dtr_wind_speed')}:</span>
              <span className="text-cyan-400 font-bold text-sm">{windSpeedMS.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="15.0"
              step="0.5"
              value={windSpeedMS}
              onChange={(e) => setWindSpeedMS(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Solar Irradiance Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300"><Sun className="w-4 h-4 text-amber-400" /> {t('dtr_solar_rad')}:</span>
              <span className="text-amber-400 font-bold text-sm">{solarIrradiance} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="1200"
              step="50"
              value={solarIrradiance}
              onChange={(e) => setSolarIrradiance(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Applied Load Slider */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300"><Zap className="w-4 h-4 text-purple-400" /> {t('dtr_applied_load')}:</span>
              <span className="text-purple-400 font-bold text-sm">{appliedLoadMVA.toFixed(1)} MVA</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="0.5"
              value={appliedLoadMVA}
              onChange={(e) => setAppliedLoadMVA(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
