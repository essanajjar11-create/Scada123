import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  Square,
  Clock,
  ShieldAlert,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  FileText
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { OTSScenarioId, OTSReport } from '../../types/scada';

export const OperatorTrainingSimulatorModule: React.FC = () => {
  const {
    currentUserRole,
    otsScenarioId,
    otsStatus,
    otsTimerSec,
    otsReport,
    startOtsScenario,
    stopOtsScenario,
    completeOtsScenario,
    injectFault,
    clearAllFaults,
    t
  } = useScada();

  const [selectedScenario, setSelectedScenario] = useState<OTSScenarioId>('SCENARIO_1');

  const scenarios = [
    {
      id: 'SCENARIO_1' as OTSScenarioId,
      title: t('ots_scen1_title'),
      subtitle: 'Stuck Breaker & Bus Sectionalizer Isolation',
      description: t('ots_scen1_desc'),
      targetObjective: t('ots_scen1_obj')
    },
    {
      id: 'SCENARIO_2' as OTSScenarioId,
      title: t('ots_scen2_title'),
      subtitle: 'Hotspot Thermal Runaway & Emergency Load Shedding',
      description: t('ots_scen2_desc'),
      targetObjective: t('ots_scen2_obj')
    },
    {
      id: 'SCENARIO_3' as OTSScenarioId,
      title: t('ots_scen3_title'),
      subtitle: 'Critical Buchholz Alert & Seamless Bus Transfer',
      description: t('ots_scen3_desc'),
      targetObjective: t('ots_scen3_obj')
    }
  ];

  const handleStart = () => {
    startOtsScenario(selectedScenario);
  };

  const isManagerOrUnlocked = true; // Allowed for evaluation & training in session

  return (
    <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">{t('ots_suite_title')}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                {t('ots_trainer_clearance')}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {t('ots_subtitle')}
            </p>
          </div>
        </div>

        {otsStatus === 'running' && (
          <div className="flex items-center gap-4 bg-zinc-950 px-4 py-2 rounded-xl border border-rose-800/80 animate-pulse">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-extrabold text-sm">
              <Clock className="w-4 h-4" />
              <span>{t('ots_drill_elapsed')}: {otsTimerSec}s</span>
            </div>
            <button
              onClick={() => completeOtsScenario()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
            >
              {t('ots_finish_eval')}
            </button>
            <button
              onClick={stopOtsScenario}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
            >
              <Square className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          const isRunningThis = otsStatus === 'running' && otsScenarioId === sc.id;

          return (
            <div
              key={sc.id}
              onClick={() => {
                if (otsStatus !== 'running') setSelectedScenario(sc.id);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isRunningThis
                  ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : isSelected
                  ? 'bg-zinc-900 border-indigo-500/80 shadow-lg'
                  : 'bg-zinc-950/80 border-zinc-800/80 hover:bg-zinc-900/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300">
                    {sc.id}
                  </span>
                  {isRunningThis && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                      {t('ots_active_drill')}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{sc.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{sc.description}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500 space-y-1">
                <span className="font-bold text-zinc-300 block">{t('ots_target_objective')}</span>
                <p className="text-zinc-400 leading-relaxed">{sc.targetObjective}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-xs text-zinc-300 font-medium">
            {t('ots_selected_scenario')} <strong className="text-white font-mono">{selectedScenario}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {otsStatus === 'idle' ? (
            <button
              onClick={handleStart}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('ots_launch_scenario')}</span>
            </button>
          ) : (
            <button
              onClick={stopOtsScenario}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>{t('ots_abort_scenario')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Debrief & Evaluation Report Modal / View */}
      {otsReport && (
        <div className="p-6 bg-zinc-950 border border-amber-800/80 rounded-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('ots_debrief_title')}</h3>
                <span className="text-xs text-zinc-400">{otsReport.scenarioTitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold font-mono text-amber-400 px-3 py-1 rounded bg-amber-950 border border-amber-800">
                {t('ots_grade')} {otsReport.grade}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">{t('ots_restoration_score')}</span>
              <span className="text-2xl font-extrabold text-emerald-400">{otsReport.restorationScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">{t('ots_response_time')}</span>
              <span className="text-2xl font-extrabold text-cyan-400">{otsReport.responseTimeSec}s</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">{t('ots_interlock_violations')}</span>
              <span className={`text-2xl font-extrabold ${otsReport.interlockViolations > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {otsReport.interlockViolations}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">{t('ots_trainee_workstation')}</span>
              <span className="text-sm font-bold text-indigo-300">{otsReport.traineeName}</span>
            </div>
          </div>

          {/* Action Log Timeline */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-300 uppercase font-mono block">{t('ots_timeline_title')}</span>
            <div className="bg-zinc-900 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs font-mono">
              {otsReport.actionLog.length === 0 ? (
                <span className="text-zinc-500 italic">{t('ots_no_actions')}</span>
              ) : (
                otsReport.actionLog.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between text-zinc-300 border-b border-zinc-800/50 pb-1">
                    <span>{act.timestamp} — {act.action}</span>
                    {act.penalty && (
                      <span className="text-rose-400 font-bold">-{act.penalty}% {t('ots_penalty')}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
