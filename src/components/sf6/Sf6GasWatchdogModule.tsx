import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Gauge,
  Thermometer,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  TrendingDown,
  Sparkles,
  Sliders,
  Layers,
  Leaf
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface Sf6Compartment {
  id: string;
  name: string;
  nominalPressureBar: number;
  currentRawPressureBar: number;
  gasVolumeLiters: number;
  gasMassKg: number;
  leakRatePercentPerYear: number;
  status: 'NOMINAL' | 'WARNING_ALARM' | 'LOCKOUT_CRITICAL';
}

export const Sf6GasWatchdogModule: React.FC = () => {
  const { isArabic: isAr, addSoeEvent, addToast, triggerAlarm } = useScada();

  const [ambientTempC, setAmbientTempC] = useState<number>(38); // Middle Eastern ambient heat 38°C
  const [isMicroLeakActive, setIsMicroLeakActive] = useState<boolean>(false);

  // Compartments initial state
  const [compartments, setCompartments] = useState<Sf6Compartment[]>([
    {
      id: '52_1_TR1',
      name: '132kV TR-1 Bay Breaker (52-1)',
      nominalPressureBar: 6.0,
      currentRawPressureBar: 5.92,
      gasVolumeLiters: 450,
      gasMassKg: 18.2,
      leakRatePercentPerYear: 0.18,
      status: 'NOMINAL'
    },
    {
      id: '52_2_LINE',
      name: '132kV Line 01 Breaker (52-2)',
      nominalPressureBar: 6.0,
      currentRawPressureBar: 5.88,
      gasVolumeLiters: 450,
      gasMassKg: 18.0,
      leakRatePercentPerYear: 0.22,
      status: 'NOMINAL'
    },
    {
      id: '52_6_COUPLER',
      name: '13.8kV Bus Sectionalizer (52-6)',
      nominalPressureBar: 5.5,
      currentRawPressureBar: 5.42,
      gasVolumeLiters: 220,
      gasMassKg: 8.5,
      leakRatePercentPerYear: 0.12,
      status: 'NOMINAL'
    },
    {
      id: 'GIS_BUSBAR_A',
      name: '132kV GIS Busbar A Chamber',
      nominalPressureBar: 6.5,
      currentRawPressureBar: 6.45,
      gasVolumeLiters: 1200,
      gasMassKg: 48.0,
      leakRatePercentPerYear: 0.15,
      status: 'NOMINAL'
    }
  ]);

  // IEC 62271 Temperature compensation: P_comp = P_raw * ( (20 + 273.15) / (T_amb + 273.15) )
  const getCompensatedPressure = (rawPressure: number, tempC: number) => {
    return rawPressure * (293.15 / (tempC + 273.15));
  };

  // SF6 GWP Carbon Equivalent: 1 kg SF6 = 23,500 kg CO2 (23.5 tCO2e)
  const SF6_GWP = 23500;

  // Calculate total leakage across substation in kg & tons CO2e
  const leakageStats = useMemo(() => {
    let totalKgLostPerYear = 0;
    compartments.forEach((c) => {
      totalKgLostPerYear += (c.gasMassKg * c.leakRatePercentPerYear) / 100;
    });
    const totalCo2eTonsPerYear = (totalKgLostPerYear * SF6_GWP) / 1000;
    return {
      totalKgLostPerYear: totalKgLostPerYear.toFixed(2),
      totalCo2eTonsPerYear: totalCo2eTonsPerYear.toFixed(1)
    };
  }, [compartments]);

  // Inject micro-leak on 52-1 breaker
  const handleInjectMicroLeak = () => {
    setIsMicroLeakActive(true);
    setCompartments((prev) =>
      prev.map((c) => {
        if (c.id === '52_1_TR1') {
          return {
            ...c,
            currentRawPressureBar: 5.35, // Dropped below 5.5 bar alarm threshold!
            leakRatePercentPerYear: 8.4,
            status: 'WARNING_ALARM'
          };
        }
        return c;
      })
    );

    triggerAlarm(
      '132kV Breaker 52-1',
      'SF6 Gas Density Monitor',
      'SF6 Gas Density Low Warning on 132kV Breaker 52-1 (5.35 bar compensated)',
      'major'
    );

    addSoeEvent(
      'SF6 Leak Alarm: 52-1 pressure dropped to 5.35 bar (Stage 1 Warning)',
      'SF6_WATCHDOG',
      'Gas Density Monitor',
      'MAJOR'
    );

    addToast(
      isAr
        ? 'إنذار: انخفاض ضغط غاز SF6 في القاطع 52-1 (5.35 بار) - مرحلة التحذير الأولى'
        : 'Warning: SF6 Low Pressure Alarm triggered on 52-1 (5.35 bar)',
      'error'
    );
  };

  // Refill / Service breaker
  const handleServiceRefill = () => {
    setIsMicroLeakActive(false);
    setCompartments((prev) =>
      prev.map((c) => ({
        ...c,
        currentRawPressureBar: c.nominalPressureBar,
        leakRatePercentPerYear: 0.15,
        status: 'NOMINAL'
      }))
    );

    addSoeEvent(
      'SF6 Top-up Completed: All GIS/AIS compartments refilled to nominal density',
      'SF6_WATCHDOG',
      'Gas Density Monitor',
      'INFO'
    );

    addToast(
      isAr
        ? 'تمت إعادة شحن وتعبئة غاز SF6 لجميع القواطع إلى الضغط الاسمي'
        : 'SF6 Service Complete: All breaker chambers restored to nominal 6.0 bar',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-rose-950/40 border border-amber-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'نظام مراقبة غاز سداسي فلوريد الكبريت SF6 وحساب انبعاثات الاحتباس' : 'SF6 Gas Dual-Zone Watchdog & Greenhouse Emissions Monitor'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold">
                    IEC 62271-1 / GWP 23,500
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'تعويض درجات الحرارة اللحظي • كشف التسريب الميكروي وتفادي عتبة القفل الميكانيكي Lockout (5.0 bar)'
                    : 'Temperature-Compensated Gas Density • Early Leak Prediction • Mechanical Trip Block Prevention'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInjectMicroLeak}
              disabled={isMicroLeakActive}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                isMicroLeakActive
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? 'محاكاة تسريب غاز ميكروي' : 'Inject SF6 Micro-Leak'}</span>
            </button>

            <button
              onClick={handleServiceRefill}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'صيانة وإعادة تعبئة الغاز' : 'Service & Top-Up SF6'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" />
              {isAr ? 'درجة الحرارة المحيطة' : 'Substation Ambient Temp'}
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
              Ref: 20°C
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {ambientTempC}°C
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Density Factor (20°C):</span>
            <span className="text-zinc-200 font-bold">{(293.15 / (ambientTempC + 273.15)).toFixed(3)}x</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-400" />
              {isAr ? 'معدل الفقد السنوي الكلي' : 'Annual SF6 Fugitive Loss'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              IEC Target &lt;0.5%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {leakageStats.totalKgLostPerYear}{' '}
            <span className="text-xs text-zinc-500 font-normal">kg/year</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Total Inventory:</span>
            <span className="text-zinc-200 font-bold">92.7 kg SF6</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-rose-400" />
              {isAr ? 'البصمة الكربونية المكافئة' : 'CO₂e Equivalent Footprint'}
            </span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">
              GWP = 23,500
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {leakageStats.totalCo2eTonsPerYear}{' '}
            <span className="text-xs text-zinc-500 font-normal">tCO₂e/yr</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>EPA Scope 1 Metric:</span>
            <span className="text-zinc-200 font-bold">Active Reporting</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs text-zinc-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              {isAr ? 'حالة أقفال القواطع (Lockout)' : 'Breaker Trip Interlock'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              Stage 2: 5.0 bar
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {isMicroLeakActive ? 'WARNING' : 'HEALTHY'}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Arc Extinction Gas:</span>
            <span className="text-zinc-200 font-bold">Dielectric OK</span>
          </div>
        </div>
      </div>

      {/* Main Compartments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {compartments.map((comp) => {
          const compPressure = getCompensatedPressure(comp.currentRawPressureBar, ambientTempC);
          const isWarning = compPressure < 5.5 && compPressure >= 5.0;
          const isLockout = compPressure < 5.0;

          return (
            <div
              key={comp.id}
              className={`p-5 rounded-2xl border transition-all ${
                isLockout
                  ? 'bg-rose-950/30 border-rose-500/50'
                  : isWarning
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-zinc-900/90 border-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">{comp.name}</h4>
                  <div className="text-xs text-zinc-400">Volume: {comp.gasVolumeLiters}L • Mass: {comp.gasMassKg}kg</div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
                    isLockout
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isLockout ? 'LOCKOUT BLOCKED' : isWarning ? 'STAGE 1 ALARM' : 'NOMINAL 20°C'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center font-mono">
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Raw Measured</div>
                  <div className="text-sm font-bold text-zinc-200">{comp.currentRawPressureBar.toFixed(2)} bar</div>
                </div>
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Compensated (20°C)</div>
                  <div className={`text-sm font-bold ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {compPressure.toFixed(2)} bar
                  </div>
                </div>
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Leak Rate</div>
                  <div className={`text-sm font-bold ${comp.leakRatePercentPerYear > 1.0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                    {comp.leakRatePercentPerYear.toFixed(2)}%/yr
                  </div>
                </div>
              </div>

              {/* Visual Pressure Gauge Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span className="text-rose-400">Lockout (5.0 bar)</span>
                  <span className="text-amber-400">Alarm (5.5 bar)</span>
                  <span className="text-emerald-400">Nominal (6.0 bar)</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isLockout ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (compPressure / 6.5) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Temperature Control Slider */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300 font-bold flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-amber-400" />
            {isAr ? 'محاكاة تغير درجة الحرارة المحيطة بالمحطة:' : 'Simulate Substation Ambient Temperature Shift:'}
          </span>
          <span className="text-amber-400 font-bold">{ambientTempC}°C</span>
        </div>
        <input
          type="range"
          min="-10"
          max="55"
          step="1"
          value={ambientTempC}
          onChange={(e) => setAmbientTempC(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>-10°C (Winter Freeze)</span>
          <span>+20°C (Standard Calibration Reference)</span>
          <span>+55°C (Extreme Desert Summer Heat)</span>
        </div>
      </div>
    </div>
  );
};
