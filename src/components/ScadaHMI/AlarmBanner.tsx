import React, { useState } from 'react';
import { AlertTriangle, Bell, BellOff, Check, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { AlarmItem } from '../../types/substation';

interface AlarmBannerProps {
  alarms: AlarmItem[];
  onAcknowledge: (id?: string) => void;
  onReset: () => void;
  isSilenced: boolean;
  onToggleSilence: () => void;
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({
  alarms,
  onAcknowledge,
  onReset,
  isSilenced,
  onToggleSilence,
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeAlarms = alarms.filter(a => a.active);
  const unackAlarms = activeAlarms.filter(a => !a.acknowledged);
  const latestAlarm = activeAlarms[activeAlarms.length - 1];

  const hasCritical = activeAlarms.some(a => a.severity === 'CRITICAL');

  return (
    <div className="bg-[#12151b] border border-[#2d3443] rounded-2xl shadow-2xl overflow-hidden font-sans">
      {/* Top Banner Row */}
      <div className={`px-4 py-2.5 flex items-center justify-between gap-4 transition-colors ${
        hasCritical && !isSilenced
          ? 'bg-red-950/80 border-b border-red-700 text-red-100 animate-pulse'
          : 'bg-[#181d26] border-b border-[#2d3646] text-slate-200'
      }`}>
        {/* Left: Latest alarm message */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            hasCritical ? 'bg-red-600 text-white' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-900 rounded font-bold text-slate-300">
                ISA-18.2 ALARMS ({activeAlarms.length})
              </span>
              {latestAlarm ? (
                <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5" dir="ltr">
                  <span>[{latestAlarm.bayId}]</span>
                  <span>{latestAlarm.timestamp}:</span>
                </span>
              ) : (
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  جميع المنظومات في حالة اسمية طبيعية (ALL SYSTEMS NORMAL)
                </span>
              )}
            </div>
            {latestAlarm && (
              <p className="text-xs font-medium truncate text-slate-100 mt-0.5 text-right" dir="rtl">
                {latestAlarm.message}
              </p>
            )}
          </div>
        </div>

        {/* Right: Operator Action Buttons (ACK / SILENCE / RESET) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* ACK Button */}
          <button
            onClick={() => onAcknowledge()}
            disabled={unackAlarms.length === 0}
            title="إقرار الإنذارات (Acknowledge All Alarms)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
              unackAlarms.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>ACK ({unackAlarms.length})</span>
          </button>

          {/* SILENCE Button */}
          <button
            onClick={onToggleSilence}
            title="كتم الصفارة الصوتية (Silence Audio)"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
              isSilenced
                ? 'bg-red-900/80 text-red-200 border border-red-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isSilenced ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{isSilenced ? 'SILENCED' : 'SILENCE'}</span>
          </button>

          {/* RESET Button */}
          <button
            onClick={onReset}
            title="تصفير الإنذارات المنتهية (Reset Cleared Alarms)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          {/* Toggle Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Alarm List Table */}
      {expanded && (
        <div className="p-3 bg-[#0e1116] max-h-56 overflow-y-auto space-y-1.5 text-xs font-mono-numbers">
          {alarms.length === 0 ? (
            <div className="text-center py-4 text-slate-500 font-sans">
              لا توجد إنذارات مسجلة في الذاكرة.
            </div>
          ) : (
            alarms.slice().reverse().map(alarm => (
              <div
                key={alarm.id}
                className={`p-2 rounded-lg border flex items-center justify-between gap-3 ${
                  alarm.severity === 'CRITICAL'
                    ? 'bg-red-950/40 border-red-900/60 text-red-200'
                    : alarm.severity === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                    : 'bg-blue-950/40 border-blue-900/60 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    alarm.severity === 'CRITICAL' ? 'bg-red-900 text-red-100' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {alarm.severity}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{alarm.timestamp}</span>
                  <span className="font-bold text-slate-300 font-mono">[{alarm.bayId}]</span>
                  <span className="truncate font-sans">{alarm.message}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    alarm.acknowledged ? 'bg-slate-800 text-slate-400' : 'bg-amber-900 text-amber-200 font-bold animate-pulse'
                  }`}>
                    {alarm.acknowledged ? 'ACKED' : 'UNACK'}
                  </span>
                  {!alarm.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alarm.id)}
                      className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-[10px] font-bold"
                    >
                      إقرار
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
