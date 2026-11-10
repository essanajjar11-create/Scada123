import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  X,
  Clock,
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { SOEEvent } from '../../types/scada';

interface SoeRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoeRecorderModal: React.FC<SoeRecorderModalProps> = ({ isOpen, onClose }) => {
  const { soeEvents, clearSoeEvents, t, lang } = useScada();
  const isAr = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [rcaFilterOnly, setRcaFilterOnly] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter events
  const filteredEvents = soeEvents.filter((evt) => {
    const matchesSearch =
      evt.eventText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.device.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = assetFilter === 'ALL' || evt.asset === assetFilter;
    const matchesRca = !rcaFilterOnly || evt.isRootCause || evt.isCascaded;
    return matchesSearch && matchesAsset && matchesRca;
  });

  const rootCauseCount = soeEvents.filter((e) => e.isRootCause).length;
  const cascadedCount = soeEvents.filter((e) => e.isCascaded).length;

  const exportCsv = () => {
    const headers = 'SOE_ID,Timestamp_ISO,Delta_ms,Asset,Device,Event_Description,RCA_Status,Severity\n';
    const rows = soeEvents
      .map((e) => {
        const rca = e.isRootCause ? 'ROOT_CAUSE' : e.isCascaded ? 'CASCADED' : 'NORMAL';
        const delta = `+${(e.relativeMs ?? 0).toFixed(3)} ms`;
        const cleanDesc = e.eventText.replace(/,/g, ' ');
        return `${e.id},"${e.timestamp}","${delta}","${e.asset}","${e.device}","${cleanDesc}",${rca},${e.severity}`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Substation_SOE_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{t('soe_modal_title')}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {isAr ? 'دقة 1 ميلي ثانية • ناقل العمليات IEC 61850' : '1 ms Resolution • IEC 61850 Process Bus'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t('soe_modal_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>{t('soe_export_csv')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RCA Summary Stats */}
        <div className="px-6 py-3 bg-zinc-900/60 border-b border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">{t('soe_total_events')}:</span>
            <span className="text-white font-bold text-sm">{soeEvents.length} / 1000</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-center justify-between">
            <span className="text-rose-300 flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> {t('soe_root_cause_label')}:
            </span>
            <span className="text-rose-400 font-extrabold text-sm">{rootCauseCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-800/80 flex items-center justify-between">
            <span className="text-amber-300 flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> {t('soe_cascaded_trips')}:
            </span>
            <span className="text-amber-400 font-extrabold text-sm">{cascadedCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> {t('soe_delta_standard')}:
            </span>
            <span className="text-indigo-400 font-bold">{t('soe_sub_ms')}</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-zinc-950/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
              <input
                type="text"
                placeholder={t('soe_search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 font-medium">{t('soe_filter_asset')}:</span>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t('soe_all_assets')}</option>
                <option value="TR-1">{isAr ? 'محول TR-1 الرئيسي' : 'TR-1 Primary'}</option>
                <option value="TR-2">{isAr ? 'محول TR-2 الثانوي' : 'TR-2 Secondary'}</option>
                <option value="HV Bay">{isAr ? 'خلية الجهد العالي 132kV' : 'HV 132kV Bay'}</option>
                <option value="MV Bay">{isAr ? 'خلية الجهد المتوسط 13.8kV' : 'MV 13.8kV Bay'}</option>
                <option value="BESS Bay">{isAr ? 'خلية البطاريات BESS 10MW' : 'BESS 10MW Bay'}</option>
              </select>
            </div>

            <button
              onClick={() => setRcaFilterOnly(!rcaFilterOnly)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                rcaFilterOnly
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('soe_rca_only')}</span>
            </button>

            <button
              onClick={clearSoeEvents}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('soe_reset_buffer')}</span>
            </button>
          </div>
        </div>

        {/* SOE Log Table */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <table className="w-full text-left rtl:text-right font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/60 sticky top-0">
                <th className="p-2.5">{t('soe_col_timestamp')}</th>
                <th className="p-2.5">{t('soe_col_delta')}</th>
                <th className="p-2.5">{t('soe_col_asset')}</th>
                <th className="p-2.5">{t('soe_col_device')}</th>
                <th className="p-2.5">{t('soe_col_event_desc')}</th>
                <th className="p-2.5">{t('soe_col_rca')}</th>
                <th className="p-2.5">{t('soe_col_severity')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 font-sans italic">
                    {t('soe_no_events')}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => {
                  const isRoot = e.isRootCause;
                  const isCascaded = e.isCascaded;

                  let rowBg = 'hover:bg-zinc-900/50';
                  if (isRoot) rowBg = 'bg-rose-950/40 hover:bg-rose-900/40 border-l-4 border-l-rose-500 rtl:border-l-0 rtl:border-r-4 rtl:border-r-rose-500';
                  else if (isCascaded) rowBg = 'bg-amber-950/30 hover:bg-amber-900/30 border-l-4 border-l-amber-500 rtl:border-l-0 rtl:border-r-4 rtl:border-r-amber-500';

                  return (
                    <tr key={e.id} className={`transition-colors ${rowBg}`}>
                      <td className="p-2.5 font-bold text-zinc-200">{e.timestamp}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isRoot ? 'bg-rose-900 text-rose-200' : isCascaded ? 'bg-amber-900 text-amber-200' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          +{(e.relativeMs ?? 0).toFixed(3)} ms
                        </span>
                      </td>
                      <td className="p-2.5 text-cyan-400 font-bold">{e.asset}</td>
                      <td className="p-2.5 text-zinc-300">{e.device}</td>
                      <td className="p-2.5 font-sans font-medium text-white">{e.eventText}</td>
                      <td className="p-2.5">
                        {isRoot && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider animate-pulse flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3" />
                            {isAr ? 'السبب الجذري' : 'ROOT CAUSE'}
                          </span>
                        )}
                        {isCascaded && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-600 text-black uppercase tracking-wider flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            {isAr ? 'متتالي' : 'CASCADED'}
                          </span>
                        )}
                        {!isRoot && !isCascaded && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                            {isAr ? 'قياسي' : 'STANDARD'}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          e.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : e.severity === 'MAJOR'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {e.severity === 'CRITICAL'
                            ? (isAr ? 'حرج' : 'CRITICAL')
                            : e.severity === 'MAJOR'
                            ? (isAr ? 'رئيسي' : 'MAJOR')
                            : (isAr ? 'معلومات' : 'INFO')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>{isAr ? 'محرك توقيت أحداث GOOSE والقيم المقاسة IEC 61850-9-2' : 'IEC 61850-9-2 Sampled Values & GOOSE Event Timestamping Engine'}</span>
          <span>{t('soe_buffer_capacity')}: {soeEvents.length} / 1,000</span>
        </div>
      </div>
    </div>
  );
};
