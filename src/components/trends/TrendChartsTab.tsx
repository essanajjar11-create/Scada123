import React, { useState } from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Download, CheckSquare, Square } from 'lucide-react';

export const TrendChartsTab: React.FC = () => {
  const { history, activeTelemetry, t } = useScada();

  const [channels, setChannels] = useState({
    voltage: true,
    current: true,
    activePower: true,
    oilTemp: true,
    thd: false,
  });

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = 'Timestamp,Grid Voltage (kV),Load Current (A),Active Power (MW),Oil Temp (°C),THD (%)\n';
    const rows = history
      .map(
        (h) =>
          `${h.time},${(h.voltage ?? 0).toFixed(2)},${(h.current ?? 0).toFixed(2)},${(h.activePower ?? 0).toFixed(3)},${(h.oilTemp ?? 0).toFixed(1)},${(h.thd ?? 0).toFixed(2)}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCADA_Telemetry_${activeTelemetry?.id ?? 'TR1'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Top Header & Channel Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-cyan-950 border border-cyan-700/50 rounded-lg text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              {t('trend_channels')}
            </h2>
            <p className="text-xs text-slate-400">{t('high_res_telemetry')} • {history.length} {t('samples_captured')}</p>
          </div>
        </div>

        {/* Channel Selection Checkboxes */}
        <div className="flex items-center flex-wrap gap-2.5 text-xs">
          {[
            { key: 'voltage', label: `${t('voltage')} (kV)`, color: 'text-amber-400' },
            { key: 'current', label: `${t('current')} (A)`, color: 'text-emerald-400' },
            { key: 'activePower', label: `${t('active_power')} (MW)`, color: 'text-cyan-400' },
            { key: 'oilTemp', label: `${t('oil_temp')} (°C)`, color: 'text-rose-400' },
            { key: 'thd', label: 'THD (%)', color: 'text-purple-400' },
          ].map((item) => {
            const isChecked = channels[item.key as keyof typeof channels];
            return (
              <button
                key={item.key}
                onClick={() => toggleChannel(item.key as keyof typeof channels)}
                className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 rtl:space-x-reverse transition-all cursor-pointer ${
                  isChecked ? 'bg-slate-950 border-cyan-500/80 text-slate-200 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> : <Square className="w-3.5 h-3.5" />}
                <span className={item.color}>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleExportCSV}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs shadow-lg shadow-cyan-900/50 flex items-center space-x-1.5 rtl:space-x-reverse transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('export_csv')}</span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {channels.voltage && <Line type="monotone" dataKey="voltage" name={`${t('voltage')} (kV)`} stroke="#f59e0b" strokeWidth={2} dot={false} />}
              {channels.current && <Line type="monotone" dataKey="current" name={`${t('current')} (A)`} stroke="#10b981" strokeWidth={2} dot={false} />}
              {channels.activePower && <Line type="monotone" dataKey="activePower" name={`${t('active_power')} (MW)`} stroke="#06b6d4" strokeWidth={2} dot={false} />}
              {channels.oilTemp && <Line type="monotone" dataKey="oilTemp" name={`${t('oil_temp')} (°C)`} stroke="#f43f5e" strokeWidth={2} dot={false} />}
              {channels.thd && <Line type="monotone" dataKey="thd" name="THD (%)" stroke="#a855f7" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
