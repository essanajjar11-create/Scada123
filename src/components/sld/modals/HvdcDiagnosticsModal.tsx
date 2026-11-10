import React, { useState } from 'react';
import {
  X,
  Cpu,
  Activity,
  Flame,
  Droplets,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Layers,
  Thermometer,
  Wind,
  Power
} from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';
import { HvdcFaultType } from '../../../types/scada';
import { soundEngine } from '../../../lib/soundEngine';

interface HvdcDiagnosticsModalProps {
  onClose: () => void;
}

export const HvdcDiagnosticsModal: React.FC<HvdcDiagnosticsModalProps> = ({ onClose }) => {
  const {
    hvdcState,
    setHvdcFault,
    tripHvdcDccb,
    resetHvdcProtection,
    lang
  } = useScada();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'submodules' | 'cooling' | 'protection' | 'control'>('submodules');

  const armNames = [
    { id: 'arm_au', name: 'Phase A Upper Arm', smTotal: 200, smHealthy: 199, smBypassed: 1, tempC: 68.2 },
    { id: 'arm_al', name: 'Phase A Lower Arm', smTotal: 200, smHealthy: 200, smBypassed: 0, tempC: 67.8 },
    { id: 'arm_bu', name: 'Phase B Upper Arm', smTotal: 200, smHealthy: 199, smBypassed: 1, tempC: 69.1 },
    { id: 'arm_bl', name: 'Phase B Lower Arm', smTotal: 200, smHealthy: 200, smBypassed: 0, tempC: 68.4 },
    { id: 'arm_cu', name: 'Phase C Upper Arm', smTotal: 200, smHealthy: 198, smBypassed: 2, tempC: 69.8 },
    { id: 'arm_cl', name: 'Phase C Lower Arm', smTotal: 200, smHealthy: 200, smBypassed: 0, tempC: 67.5 },
  ];

  const handleTripDccb = () => {
    tripHvdcDccb();
    if (soundEngine) soundEngine.playBreakerTrip();
  };

  const handleReset = () => {
    resetHvdcProtection();
    if (soundEngine) soundEngine.playSwitchClick();
  };

  const handleFaultSelect = (fault: HvdcFaultType) => {
    setHvdcFault(fault);
    if (fault !== 'NONE' && soundEngine) soundEngine.playBreakerTrip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-indigo-500/40 rounded-2xl w-full max-w-5xl shadow-2xl shadow-indigo-950/40 overflow-hidden font-sans flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-zinc-900 via-indigo-950/50 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {isAr ? 'منظومة مراقبة وتشخيص صمامات MMC والتبريد (IEC 62747)' : 'VSC-MMC Converter Valves & Cooling Diagnostics'}
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${
                  hvdcState.faultState !== 'NONE' || hvdcState.dccbTripped
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {hvdcState.faultState !== 'NONE' ? `FAULT: ${hvdcState.faultState}` : hvdcState.dccbTripped ? 'DCCB TRIPPED' : 'VALVES HEALTHY (N=1200 SM)'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {isAr
                  ? 'مصفوفة خلايا الجسور النصفية (Half-Bridge SM) • حلقة تبريد الماء منزوع الأيونات • حماية قواطع التيار المستمر DCCB'
                  : 'Modular Submodule Heatmap • Deionized Water Cooling Loop • Fast DCCB Protection (< 5ms)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 bg-zinc-900/90 border-b border-zinc-800 gap-2">
          {[
            { id: 'submodules', label: isAr ? 'مصفوفة الخلايا (1200 SM)' : 'Submodule Matrix (1200 SM)', icon: Layers },
            { id: 'cooling', label: isAr ? 'نظام التبريد المائي' : 'Deionized Cooling Loop', icon: Droplets },
            { id: 'control', label: isAr ? 'المتحكم وديناميكية d-q' : 'd-q Vector & Modulation', icon: Gauge },
            { id: 'protection', label: isAr ? 'قواطع DCCB واختبار الأعطال' : 'DCCB & Fault Injector', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 border-b-2 text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* TAB 1: Submodule Matrix Heatmap */}
          {activeTab === 'submodules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono">TOTAL HALF-BRIDGE SMs</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">{hvdcState.totalSubmodules} SM</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">200 SM / arm × 6 arms</div>
                </div>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono">HEALTHY & ACTIVE SMs</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{hvdcState.healthySubmodules} SM</div>
                  <div className="text-[10px] text-emerald-500/80 font-mono mt-0.5">99.67% valve availability</div>
                </div>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono">BYPASSED REDUNDANT SMs</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">{hvdcState.bypassedSubmodules} SM</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Thyristor bypass active (N+10 red.)</div>
                </div>
              </div>

              {/* 6 Arms Heatmap Grid */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    3-Phase 6-Arm Valve Tower Submodule Array Status
                  </span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Healthy Active</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> Redundant Bypassed</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> Fault Blocked</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {armNames.map((arm, armIdx) => (
                    <div key={arm.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-indigo-300 font-bold">{arm.name}</span>
                        <span className="text-amber-400 font-bold">{arm.tempC}°C</span>
                      </div>
                      
                      {/* Mini Heat-map cells representation (40 rendered blocks representing 200 SMs) */}
                      <div className="grid grid-cols-10 gap-1 p-1 bg-zinc-900/80 rounded-lg">
                        {Array.from({ length: 40 }).map((_, i) => {
                          const isBypassed = arm.smBypassed > 0 && i === 38;
                          const isFault = hvdcState.converterBlocked;
                          return (
                            <div
                              key={i}
                              title={`Submodule ${(i * 5) + 1}-${(i * 5) + 5}: ${isFault ? 'BLOCKED' : isBypassed ? 'BYPASSED' : 'HEALTHY 1.6kV'}`}
                              className={`h-2.5 rounded-xs transition-all ${
                                isFault
                                  ? 'bg-rose-500 animate-pulse'
                                  : isBypassed
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500/85 hover:bg-emerald-400'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>DC Offset: +320kV</span>
                        <span>{arm.smHealthy}/200 OK</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cooling Loop */}
          {activeTab === 'cooling' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    VALVE JUNCTION TEMP
                  </div>
                  <div className={`text-xl font-bold font-mono mt-1 ${hvdcState.valveJunctionTempC > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hvdcState.valveJunctionTempC.toFixed(1)} °C
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Limit: 125.0 °C max</div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    COOLANT INLET TEMP
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {hvdcState.coolantTempC.toFixed(1)} °C
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Nominal: 30-40 °C</div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    COOLANT FLOW RATE
                  </div>
                  <div className={`text-xl font-bold font-mono mt-1 ${hvdcState.coolantFlowRatePct < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hvdcState.coolantFlowRatePct.toFixed(1)} %
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Tripping threshold: 60%</div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    WATER CONDUCTIVITY
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-300 mt-1">
                    {hvdcState.coolantConductivityUS_cm} µS/cm
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Deionized limit: &lt; 0.2 µS/cm</div>
                </div>
              </div>

              {/* Pump Redundancy HUD */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-zinc-300 font-mono">Circulation Pumps Redundancy Status</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-950 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Main Pump A (Primary)</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">RUNNING • 2,450 RPM • Pressure: 4.8 bar</div>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Standby Pump B (Auto-Fallback)</div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">STANDBY ARMED • Ready on &lt; 150ms drop</div>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-cyan-500/60"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Control & Modulation Dynamics */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono">MODULATION INDEX (Ma)</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{hvdcState.modulationIndexMa}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">V_ac / (V_dc / 2)</div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono">FIRING ANGLE (α)</div>
                  <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{hvdcState.firingAngleAlphaDeg}°</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Synchronous Phase Offset</div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="text-[10px] text-zinc-400 font-mono">SYNTHETIC INERTIA CONSTANT (H)</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">{hvdcState.syntheticInertiaH} s</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Fast Frequency Response (FFR)</div>
                </div>
              </div>

              {/* Power Conversion & Loss Summary */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-zinc-300 font-mono">Transmission Link Electrical Losses</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 bg-zinc-950 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">Active Transfer:</span>
                    <span className="text-white font-bold">{hvdcState.activePowerMW} MW</span>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">DC Cable Current:</span>
                    <span className="text-cyan-400 font-bold">{hvdcState.idcAmps} A</span>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">Total Losses (Cu + VSC):</span>
                    <span className="text-amber-400 font-bold">{hvdcState.lossMW} MW</span>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">Transmission Efficiency:</span>
                    <span className="text-emerald-400 font-bold">{hvdcState.efficiencyPct.toFixed(2)} %</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DCCB Protection & Fault Simulator */}
          {activeTab === 'protection' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    High-Speed DC Circuit Breaker (Hybrid DCCB &lt; 5ms)
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${hvdcState.dccbTripped ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                    {hvdcState.dccbTripped ? 'DCCB TRIPPED & ISOLATED' : 'DCCB CLOSED & ARMED'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTripDccb}
                    disabled={hvdcState.dccbTripped}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    MANUAL HIGH-SPEED DCCB TRIP
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    RESET & RE-ARM PROTECTION
                  </button>
                </div>
              </div>

              {/* Fault Injection Matrix */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-zinc-300 font-mono">HVDC Transient Fault Scenarios</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'DC_POLE_TO_GROUND' as HvdcFaultType, label: 'DC Pole-to-Ground', desc: '+320kV Cable Breakdown' },
                    { id: 'DC_POLE_TO_POLE' as HvdcFaultType, label: 'DC Pole-to-Pole', desc: 'Direct DC Bus Short' },
                    { id: 'VALVE_OVERTEMP' as HvdcFaultType, label: 'Valve Overtemperature', desc: 'Junction Temp > 125°C' },
                    { id: 'COOLANT_LOW_FLOW' as HvdcFaultType, label: 'Coolant Flow Loss', desc: 'Flow Rate < 50%' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleFaultSelect(f.id)}
                      className={`p-2.5 rounded-xl border text-left rtl:text-right transition-all text-xs cursor-pointer ${
                        hvdcState.faultState === f.id
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold">{f.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
