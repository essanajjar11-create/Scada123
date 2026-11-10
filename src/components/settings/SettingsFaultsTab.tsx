import React, { useState } from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  SlidersHorizontal,
  Flame,
  AlertOctagon,
  CheckCircle2,
  Activity,
  Shield,
  RefreshCw,
  Zap,
  Wrench
} from 'lucide-react';

export const SettingsFaultsTab: React.FC = () => {
  const {
    simMode,
    setSimMode,
    manualValues,
    setManualValue,
    thresholds,
    updateThresholds,
    injectFault,
    scanRateMs,
    setScanRateMs,
    setCtRatio,
    activeTr,
    activeTelemetry,
    currentUserRole,
    maintenanceMode,
    setMaintenanceMode,
    t
  } = useScada();

  const [tempThresholds, setTempThresholds] = useState(thresholds);

  const handleThresholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(tempThresholds);
  };

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* 1. Simulation Mode & Manual Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-cyan-400">
            <SlidersHorizontal className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('telemetry_engine_overrides')}</h3>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setSimMode('AUTO')}
              className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                simMode === 'AUTO'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              ⚡ {t('auto_sim')}
            </button>
            <button
              onClick={() => setSimMode('MANUAL')}
              className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                simMode === 'MANUAL'
                  ? 'bg-amber-950 text-amber-300 border-amber-700 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              🛠️ {t('manual_override')}
            </button>
          </div>
        </div>

        {simMode === 'MANUAL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs text-slate-300 flex justify-between mb-1">
                <span>{t('current')} (A):</span>
                <span className="font-bold text-emerald-400">{manualValues.loadCurrent.toFixed(0)} A</span>
              </label>
              <input
                type="range"
                min="0"
                max="750"
                value={manualValues.loadCurrent}
                onChange={(e) => setManualValue('loadCurrent', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between mb-1">
                <span>{t('voltage')} (kV):</span>
                <span className="font-bold text-amber-400">{manualValues.gridVoltage.toFixed(1)} kV</span>
              </label>
              <input
                type="range"
                min="100"
                max="150"
                step="0.5"
                value={manualValues.gridVoltage}
                onChange={(e) => setManualValue('gridVoltage', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between mb-1">
                <span>{t('oil_temp')} (°C):</span>
                <span className="font-bold text-rose-400">{manualValues.oilTemp.toFixed(1)} °C</span>
              </label>
              <input
                type="range"
                min="20"
                max="110"
                value={manualValues.oilTemp}
                onChange={(e) => setManualValue('oilTemp', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between mb-1">
                <span>THD (%):</span>
                <span className="font-bold text-purple-400">{manualValues.thd.toFixed(1)} %</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.1"
                value={manualValues.thd}
                onChange={(e) => setManualValue('thd', Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between mb-1">
                <span>{t('oil_level')} (%):</span>
                <span className="font-bold text-cyan-400">{manualValues.oilLevel1.toFixed(1)} %</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={manualValues.oilLevel1}
                onChange={(e) => setManualValue('oilLevel1', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Substation Maintenance Mode (LOTO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-400">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('maintenance_mode_toggle')}</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            maintenanceMode ? 'bg-amber-500 text-black animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}>
            {maintenanceMode ? t('maintenance_active') : 'OFF'}
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-amber-300 block mb-0.5">{t('maint_warning')}</span>
            <span className="text-[11px] text-slate-400">
              {t('maint_desc')}
            </span>
          </div>

          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              maintenanceMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            }`}
          >
            {maintenanceMode ? t('disable_maintenance') : t('enable_maintenance')}
          </button>
        </div>
      </div>

      {/* 3. Substation Fault Injector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-rose-400">
            <AlertOctagon className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('fault_injection_panel')}</h3>
          </div>
          <span className="text-[10px] text-slate-400">ANSI Protection Testing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => injectFault('SLG')}
            className={`p-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTelemetry?.faults?.lgFault
                ? 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-rose-950/60 border-rose-800 hover:bg-rose-900 text-rose-300'
            }`}
          >
            <Zap className="w-5 h-5 text-rose-400" />
            <span>{t('inject_slg')}</span>
            {activeTelemetry?.faults?.lgFault && (
              <span className="text-[9px] bg-rose-500 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">
                ACTIVE
              </span>
            )}
          </button>

          <button
            onClick={() => injectFault('OVER_TEMP')}
            className={`p-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTelemetry?.faults?.overTemp
                ? 'bg-amber-900 border-amber-500 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-amber-950/60 border-amber-800 hover:bg-amber-900 text-amber-300'
            }`}
          >
            <Flame className="w-5 h-5 text-amber-400" />
            <span>{t('inject_overtemp')}</span>
            {activeTelemetry?.faults?.overTemp && (
              <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">
                ACTIVE
              </span>
            )}
          </button>

          <button
            onClick={() => injectFault('BUCHHOLZ')}
            className={`p-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTelemetry?.faults?.buchholz
                ? 'bg-purple-900 border-purple-500 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse'
                : 'bg-purple-950/60 border-purple-800 hover:bg-purple-900 text-purple-300'
            }`}
          >
            <Activity className="w-5 h-5 text-purple-400" />
            <span>{t('inject_buchholz')}</span>
            {activeTelemetry?.faults?.buchholz && (
              <span className="text-[9px] bg-purple-400 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">
                ACTIVE
              </span>
            )}
          </button>

          <button
            onClick={() => injectFault('OPEN_CT')}
            className={`p-3 border rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTelemetry?.faults?.ctOpen
                ? 'bg-rose-900 border-rose-400 text-rose-100 shadow-[0_0_15px_rgba(225,29,72,0.6)] animate-pulse'
                : 'bg-rose-950/80 border-rose-600 hover:bg-rose-900 text-rose-200'
            }`}
          >
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>{t('inject_open_ct')}</span>
            {activeTelemetry?.faults?.ctOpen && (
              <span className="text-[9px] bg-rose-400 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">
                ACTIVE
              </span>
            )}
          </button>

          <button
            onClick={() => injectFault('CLEAR')}
            className="p-3 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{t('clear_all_faults')}</span>
          </button>
        </div>
      </div>

      {/* 3. Safety Thresholds & CT Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Safety Threshold Form */}
        <form onSubmit={handleThresholdSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-purple-400">
              <Shield className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('safety_thresholds_manager')}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">{t('over_voltage_limit')}</label>
              <input
                type="number"
                value={tempThresholds.overVoltageKV}
                onChange={(e) => setTempThresholds({ ...tempThresholds, overVoltageKV: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('under_voltage_limit')}</label>
              <input
                type="number"
                value={tempThresholds.underVoltageKV}
                onChange={(e) => setTempThresholds({ ...tempThresholds, underVoltageKV: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('over_current_limit')}</label>
              <input
                type="number"
                value={tempThresholds.overCurrentA}
                onChange={(e) => setTempThresholds({ ...tempThresholds, overCurrentA: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('oil_temp_limit')}</label>
              <input
                type="number"
                value={tempThresholds.oilTempHighC}
                onChange={(e) => setTempThresholds({ ...tempThresholds, oilTempHighC: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={currentUserRole !== 'manager'}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded text-xs transition-all cursor-pointer"
          >
            {t('update_safety_boundaries')}
          </button>
        </form>

        {/* CT Ratio & Hardware Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-cyan-400">
              <RefreshCw className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('hardware_config')}</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">{t('ct_primary_ratio')} ({activeTr}):</label>
              <div className="grid grid-cols-4 gap-2">
                {[400, 600, 800, 1200].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setCtRatio(activeTr, ratio)}
                    className={`p-2 rounded border font-bold transition-all cursor-pointer ${
                      activeTelemetry?.primaryRatio === ratio
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {ratio}/5A
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">{t('scan_refresh_rate')}:</label>
              <select
                value={scanRateMs}
                onChange={(e) => setScanRateMs(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-cyan-300 font-bold"
              >
                <option value={500}>{t('fast_scan')}</option>
                <option value={1000}>{t('normal_scan')}</option>
                <option value={2000}>{t('logging_interval')}</option>
                <option value={5000}>{t('slow_scan')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
