import React, { useState } from 'react';
import { Download, Trash2, Clock, Search } from 'lucide-react';
import { SoeEvent } from '../../types/substation';

interface SoeLogTableProps {
  logs: SoeEvent[];
  onClearLogs: () => void;
}

export const SoeLogTable: React.FC<SoeLogTableProps> = ({ logs, onClearLogs }) => {
  const [filterText, setFilterText] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesText = log.eventDescription.toLowerCase().includes(filterText.toLowerCase()) ||
                        log.bayId.toLowerCase().includes(filterText.toLowerCase()) ||
                        log.sourceDevice.toLowerCase().includes(filterText.toLowerCase());
    const matchesClass = filterClass === 'ALL' || log.classification === filterClass;
    return matchesText && matchesClass;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Bay', 'Device', 'Event Description', 'Protocol Tag', 'Classification'];
    const rows = logs.map(l => [
      l.timestamp,
      l.bayId,
      l.sourceDevice,
      `"${l.eventDescription.replace(/"/g, '""')}"`,
      l.protocolTag,
      l.classification
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `substation_soe_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#12151b] border border-[#2b3341] rounded-2xl p-4 shadow-xl font-sans">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#29313e] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              سجل الأحداث المتسلسل الزمني (Sequence of Events - SOE Log)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              دقة التوثيق بالميلي-ثانية (IEC CP56Time2a / 1 ms Resolution)
            </span>
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الأحداث..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-[#1a202a] border border-[#2e3747] rounded-lg pr-8 pl-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-40"
            />
          </div>

          {/* Classification Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-[#1a202a] border border-[#2e3747] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">جميع الفئات</option>
            <option value="TRIP">رحلة (TRIP)</option>
            <option value="ALARM">إنذار (ALARM)</option>
            <option value="CONTROL">تحكم (CONTROL)</option>
            <option value="STATUS">حالة (STATUS)</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            title="تصدير السجل بتنسيق CSV"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          {/* Clear */}
          <button
            onClick={onClearLogs}
            title="مسح السجل المؤقت"
            className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SOE Log Table */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-[#252c38]">
        <table className="w-full text-right text-xs font-mono-numbers">
          <thead className="bg-[#181d26] text-slate-400 uppercase text-[10px] sticky top-0 border-b border-[#2b3341] font-sans">
            <tr>
              <th className="py-2 px-3">الوقت الدقيق (ms)</th>
              <th className="py-2 px-3">الحقل / الموقع</th>
              <th className="py-2 px-3">الجهاز المصدر</th>
              <th className="py-2 px-3">وصف الحدث التشغيلي</th>
              <th className="py-2 px-3">بروتوكول النقل</th>
              <th className="py-2 px-3">التصنيف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2430] bg-[#0f1217]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500 font-sans">
                  لا توجد سجلات مطابقة للشروط الحالية.
                </td>
              </tr>
            ) : (
              filteredLogs.slice().reverse().map(log => {
                const timeOnly = log.timestamp.split('T')[1]?.replace('Z', '') || log.timestamp;
                return (
                  <tr key={log.id} className="hover:bg-[#161b24] transition-colors">
                    <td className="py-2 px-3 font-mono text-amber-400 whitespace-nowrap">
                      {timeOnly}
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-bold font-mono">
                      {log.bayId}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400">
                      {log.sourceDevice}
                    </td>
                    <td className="py-2 px-3 text-slate-200 font-sans font-medium">
                      {log.eventDescription}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-cyan-400">
                      {log.protocolTag}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        log.classification === 'TRIP'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : log.classification === 'ALARM'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : log.classification === 'CONTROL'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {log.classification}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
