import React from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  BellRing,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  History,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const AlarmSystemTab: React.FC = () => {
  const {
    alarms,
    acknowledgeAlarm,
    acknowledgeAllAlarms,
    auditLogs,
    audioMuted,
    setAudioMuted,
    sirenActive,
    t,
    lang
  } = useScada();
  const isAr = lang === 'ar';

  const criticalCount = alarms.filter((a) => a.severity === 'critical' && a.state !== 'archived').length;
  const majorCount = alarms.filter((a) => a.severity === 'major' && a.state !== 'archived').length;
  const minorCount = alarms.filter((a) => a.severity === 'minor' && a.state !== 'archived').length;
  const unackedCount = alarms.filter((a) => a.state === 'active_unacked').length;

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'active_unacked':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse border border-rose-400">
            {t('state_active_unacked')}
          </span>
        );
      case 'active_acked':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
            {t('state_active_acked')}
          </span>
        );
      case 'cleared_unacked':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
            {t('state_cleared_unacked')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
            {t('state_archived')}
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1 w-fit">
            <AlertOctagon className="w-3 h-3 text-rose-400" /> {t('priority_critical')}
          </span>
        );
      case 'major':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> {t('priority_major')}
          </span>
        );
      case 'minor':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center gap-1 w-fit">
            <BellRing className="w-3 h-3 text-cyan-400" /> {t('priority_minor')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1 w-fit">
            <Info className="w-3 h-3 text-slate-400" /> {t('priority_info')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* 1. ISA-18.2 Annunciator Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-rose-300 uppercase font-bold block">{t('critical_alarms_card')}</span>
            <span className="text-2xl font-bold text-rose-400 font-mono">{criticalCount}</span>
          </div>
          <AlertOctagon className="w-8 h-8 text-rose-500 opacity-80" />
        </div>

        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 uppercase font-bold block">{t('major_alarms_card')}</span>
            <span className="text-2xl font-bold text-amber-400 font-mono">{majorCount}</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500 opacity-80" />
        </div>

        <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-cyan-300 uppercase font-bold block">{t('minor_alarms_card')}</span>
            <span className="text-2xl font-bold text-cyan-400 font-mono">{minorCount}</span>
          </div>
          <BellRing className="w-8 h-8 text-cyan-500 opacity-80" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('unacknowledged')}</span>
            <span className="text-2xl font-bold text-slate-100 font-mono">{unackedCount}</span>
          </div>
          <Info className="w-8 h-8 text-slate-500 opacity-80" />
        </div>
      </div>

      {/* 2. Audio Siren Controller & Global Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border flex items-center justify-center ${sirenActive && !audioMuted ? 'bg-rose-600 text-white border-rose-400 animate-bounce' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
            {audioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('alarm_management')} ({sirenActive ? (audioMuted ? t('silence_siren') : t('unmuted_siren')) : t('silence_siren')})
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'جهاز الإنذار الصوتي ثنائي التردد وفق معيار ISA-18.2 (880 هرتز / 554 هرتز)'
                : 'ISA-18.2 Dual-Tone Audio Annunciator (880 Hz / 554 Hz)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer ${
              audioMuted
                ? 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-cyan-300'
            }`}
          >
            {audioMuted ? t('unmute_siren') : t('silence_siren')}
          </button>

          <button
            onClick={acknowledgeAllAlarms}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs shadow-lg shadow-cyan-900/50 flex items-center space-x-1.5 rtl:space-x-reverse transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('ack_all')}</span>
          </button>
        </div>
      </div>

      {/* 3. ISA-18.2 Active Alarm Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-rose-400">
            <BellRing className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('alarm_management')}</h3>
          </div>
          <span className="text-[10px] text-slate-400">
            {isAr ? 'تسلسل الأحداث في الوقت الحقيقي' : 'Real-Time Sequence of Events'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-b border-slate-800">{t('timestamp')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('device_asset')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('severity')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('message')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('ack_status')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {alarms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    {isAr
                      ? 'لا توجد إنذارات نشطة في المحطة. المنظومة تعمل بالحالة الاسمية الطبيعية.'
                      : 'No active substation alarms logged. System operating nominally.'}
                  </td>
                </tr>
              ) : (
                alarms.map((alarm) => (
                  <tr key={alarm.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="p-2.5 text-slate-400">{alarm.timestamp}</td>
                    <td className="p-2.5 font-bold text-slate-300">
                      {alarm.asset} <span className="text-slate-500 font-normal">({alarm.device})</span>
                    </td>
                    <td className="p-2.5">{getSeverityBadge(alarm.severity)}</td>
                    <td className="p-2.5 font-bold text-slate-100">{alarm.message}</td>
                    <td className="p-2.5">{getStateBadge(alarm.state)}</td>
                    <td className="p-2.5">
                      {alarm.state === 'active_unacked' ? (
                        <button
                          onClick={() => acknowledgeAlarm(alarm.id)}
                          className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[11px] font-bold rounded transition-all cursor-pointer"
                        >
                          {t('ack_btn')}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {t('acknowledged')} ({alarm.ackBy || 'User'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Quick Event Logger (Audit Trail) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-cyan-400">
            <History className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('alarm_audit_trail')}</h3>
          </div>
          <span className="text-[10px] text-slate-400">
            {isAr ? 'سجل تتبع الأحداث الزمني' : 'Chronological Event Stream'}
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-slate-500 font-mono">{log.timestamp}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-cyan-300 border border-slate-700">
                  {log.category}
                </span>
                <span className="text-slate-200 font-semibold">{log.description}</span>
              </div>
              <span className="text-slate-500 uppercase text-[10px] font-mono">{t('operator')}: {log.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
