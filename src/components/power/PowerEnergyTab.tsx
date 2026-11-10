import React from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Zap, Activity, BarChart3, Database, Compass, Flame } from 'lucide-react';

export const PowerEnergyTab: React.FC = () => {
  const { activeTelemetry, history, resetEnergyAccumulators, activeTr, t } = useScada();

  // 24-Hour Diurnal Load Data generator
  const diurnalData = [
    { hour: '00:00', loadPct: 35 },
    { hour: '02:00', loadPct: 28 },
    { hour: '04:00', loadPct: 25 },
    { hour: '06:00', loadPct: 42 },
    { hour: '08:00', loadPct: 68 },
    { hour: '10:00', loadPct: 84 },
    { hour: '12:00', loadPct: 91 },
    { hour: '14:00', loadPct: 88 },
    { hour: '16:00', loadPct: 79 },
    { hour: '18:00', loadPct: 86 },
    { hour: '20:00', loadPct: 72 },
    { hour: '22:00', loadPct: 50 },
  ];

  // Harmonics Data
  const harmonicsData = [
    { order: 'H1 (50Hz)', mag: activeTelemetry?.harmonics?.h1 ?? 100 },
    { order: 'H3 (150Hz)', mag: activeTelemetry?.harmonics?.h3 ?? 1.2 },
    { order: 'H5 (250Hz)', mag: activeTelemetry?.harmonics?.h5 ?? 0.8 },
    { order: 'H7 (350Hz)', mag: activeTelemetry?.harmonics?.h7 ?? 0.5 },
    { order: 'H9 (450Hz)', mag: activeTelemetry?.harmonics?.h9 ?? 0.2 },
    { order: 'H11 (550Hz)', mag: activeTelemetry?.harmonics?.h11 ?? 0.1 },
    { order: 'H13 (650Hz)', mag: activeTelemetry?.harmonics?.h13 ?? 0.05 },
  ];

  // Phasor Diagram Calculations (120 deg balanced angles)
  const vA = activeTelemetry?.phaseA_Voltage ?? 13800;
  const vB = activeTelemetry?.phaseB_Voltage ?? 13800;
  const vC = activeTelemetry?.phaseC_Voltage ?? 13800;

  const rA = 70;
  const axA = 100 + rA;
  const ayA = 100;

  const axB = 100 - rA * 0.5;
  const ayB = 100 + rA * 0.866;

  const axC = 100 - rA * 0.5;
  const ayC = 100 - rA * 0.866;

  // Neutral drift calculation
  const nx = (axA + axB + axC - 300) / 3;
  const ny = (ayA + ayB + ayC - 300) / 3;

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* 1. Top Section: Sliding Power Flow & Diurnal Load Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sliding Power Flow Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Zap className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('power_flow_trend')}</h3>
            </div>
            <span className="text-[10px] text-slate-400">{t('rolling_window')}</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="activePower" name={t('active_power_mw')} stroke="#10b981" fillOpacity={1} fill="url(#colorP)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24-Hour Diurnal Load Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('diurnal_profile')}</h3>
            </div>
            <span className="text-[10px] text-slate-400">{t('load_utilization')}</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diurnalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="loadPct" name={t('load_percentage')} fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Harmonics & 120° Phasor Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* THD Harmonics Spectrum */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-purple-400">
              <Activity className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('thd_harmonics_analysis')}</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-800">
              {t('total_thd_val')} {(activeTelemetry?.thd ?? 1.8).toFixed(2)} %
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={harmonicsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="order" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="mag" name="Magnitude %" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 120° Balanced Phasor Vector Diagram */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col items-center justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 w-full">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Compass className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('phasor_diagram_120')}</h3>
            </div>
            <span className="text-[10px] text-slate-400">{t('phase_angle_vectors')}</span>
          </div>

          {/* SVG Phasor Plot */}
          <div className="relative w-56 h-56 my-2">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer circle */}
              <circle cx="100" cy="100" r="75" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="100" cy="100" r="45" fill="none" stroke="#1e293b" strokeWidth="1" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="#1e293b" strokeWidth="1" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="#1e293b" strokeWidth="1" />

              {/* Phase A Vector (Red / Amber) */}
              <line x1="100" y1="100" x2={axA} y2={ayA} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              <circle cx={axA} cy={ayA} r="4" fill="#f59e0b" />
              <text x={axA + 6} y={ayA + 4} fill="#f59e0b" fontSize="10" fontWeight="bold">Va (0°)</text>

              {/* Phase B Vector (Green) */}
              <line x1="100" y1="100" x2={axB} y2={ayB} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              <circle cx={axB} cy={ayB} r="4" fill="#10b981" />
              <text x={axB - 25} y={ayB + 12} fill="#10b981" fontSize="10" fontWeight="bold">Vb (240°)</text>

              {/* Phase C Vector (Cyan) */}
              <line x1="100" y1="100" x2={axC} y2={ayC} stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
              <circle cx={axC} cy={ayC} r="4" fill="#06b6d4" />
              <text x={axC - 25} y={ayC - 8} fill="#06b6d4" fontSize="10" fontWeight="bold">Vc (120°)</text>

              {/* Neutral Drift Indicator */}
              <circle cx={100 + nx} cy={100 + ny} r="3" fill="#f43f5e" />
            </svg>
          </div>

          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 w-full text-center text-xs">
            <span className="text-slate-400">{t('neutral_drift_offset')} </span>
            <span className="font-bold text-emerald-400">x: {nx.toFixed(2)}, y: {ny.toFixed(2)}</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">{t('symmetrical_balance')}</span>
          </div>
        </div>
      </div>

      {/* 3. Energy Accumulators Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Database className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('revenue_energy_accumulators')}</h3>
          </div>
          <button
            onClick={() => resetEnergyAccumulators(activeTr)}
            className="px-3 py-1 bg-slate-950 hover:bg-rose-950 text-rose-400 border border-rose-800 rounded text-xs font-bold transition-all cursor-pointer"
          >
            {t('reset_registers_manager')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-b border-slate-800">{t('energy_register')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('current_val')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('unit')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('class_accuracy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr>
                <td className="p-2.5 font-bold text-emerald-400">{t('fwd_active_energy_reg')}</td>
                <td className="p-2.5 font-bold">{(activeTelemetry?.fwdEnergy ?? 0).toFixed(2)}</td>
                <td className="p-2.5 text-slate-400">kWh</td>
                <td className="p-2.5 text-slate-400">{t('class_02s_revenue')}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-300">{t('rev_active_energy_reg')}</td>
                <td className="p-2.5">{(activeTelemetry?.revEnergy ?? 0).toFixed(2)}</td>
                <td className="p-2.5 text-slate-400">kWh</td>
                <td className="p-2.5 text-slate-400">{t('class_02s_revenue')}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-cyan-400 font-semibold">{t('ind_reactive_energy_reg')}</td>
                <td className="p-2.5 font-bold">{(activeTelemetry?.indEn ?? 0).toFixed(2)}</td>
                <td className="p-2.5 text-slate-400">kVarh</td>
                <td className="p-2.5 text-slate-400">{t('class_05_reactive')}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-purple-400 font-semibold">{t('app_energy_reg')}</td>
                <td className="p-2.5 font-bold">{(activeTelemetry?.appEn ?? 0).toFixed(2)}</td>
                <td className="p-2.5 text-slate-400">kVAh</td>
                <td className="p-2.5 text-slate-400">Class 0.2S</td>
              </tr>
              <tr>
                <td className="p-2.5 text-amber-400 font-bold">{t('peak_max_demand')}</td>
                <td className="p-2.5 font-bold text-amber-400">{(activeTelemetry?.maxDemand ?? 0).toFixed(2)}</td>
                <td className="p-2.5 text-slate-400">MWh</td>
                <td className="p-2.5 text-slate-400">{t('fifteen_min_window')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
