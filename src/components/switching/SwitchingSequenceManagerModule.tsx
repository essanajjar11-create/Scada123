import React, { useState } from 'react';
import {
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  UserCheck,
  FileCheck,
  Lock,
  Unlock,
  Sliders,
  ListOrdered,
  Zap,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { SwitchingOrder, SwitchingStep } from '../../types/scada';

export const SwitchingSequenceManagerModule: React.FC = () => {
  const { tr1State, toggleSwitch, addAuditLog, currentUserName, t } = useScada();

  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORDER-01');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [dryRunPassed, setDryRunPassed] = useState<boolean>(false);
  const [twoManAuthorized, setTwoManAuthorized] = useState<boolean>(false);
  const [authorizerName, setAuthorizerName] = useState<string>('Eng. Essa Najjar (Clearance #8492)');

  // Pre-configured switching orders
  const [switchingOrders, setSwitchingOrders] = useState<SwitchingOrder[]>([
    {
      id: 'ORDER-01',
      title: 'TR-1 Complete LOTO Isolation for 132kV Bushing Overhaul',
      category: 'ISOLATION',
      description: 'Sequential de-energization and safe earthing of 50 MVA Transformer 1 according to OSHA / NFPA 70E safety procedures.',
      targetAsset: 'Transformer 1 (TR-1)',
      safetyWarning: 'Ensure zero residual voltage check before applying Earth Switch 84-1.',
      status: 'READY_FOR_EXECUTION',
      author: 'Senior Dispatcher: Eng. Haedara Deeb',
      steps: [
        {
          stepNo: 1,
          device: '52-2 (TR-1 13.8kV MV Breaker)',
          deviceKey: 'mvBreaker52_2',
          targetAction: 'OPEN',
          description: 'Trip and open the 13.8kV secondary breaker to disconnect downstream loads.',
          interlockRule: 'Interlock Check: Check load current < 2500A before trip.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: false
        },
        {
          stepNo: 2,
          device: '52-1 (TR-1 132kV HV Breaker)',
          deviceKey: 'hvBreaker52_1',
          targetAction: 'OPEN',
          description: 'Trip and open the primary 132kV SF6 circuit breaker.',
          interlockRule: 'Interlock Check: Verify MV breaker 52-2 is OPEN first to eliminate backfeed.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: true
        },
        {
          stepNo: 3,
          device: '89-2 (TR-1 MV Disconnector)',
          deviceKey: 'mvDisconnect89_2',
          targetAction: 'OPEN',
          description: 'Open the secondary motorized disconnector for visual air-gap isolation.',
          interlockRule: 'Interlock Check: Breaker 52-2 must be OPEN (Dead Circuit Disconnection).',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: false
        },
        {
          stepNo: 4,
          device: '89-1A (TR-1 132kV Bus-A Selector)',
          deviceKey: 'hvDisconnect89_1A',
          targetAction: 'OPEN',
          description: 'Open primary 132kV Busbar A selector isolator.',
          interlockRule: 'Interlock Check: HV Breaker 52-1 must be confirmed OPEN.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: true
        },
        {
          stepNo: 5,
          device: '84-1 (Section-1 Earth Switch)',
          deviceKey: 'earthSwitch84_1',
          targetAction: 'CLOSE',
          description: 'Apply high-fault-rated earthing switch to discharge and earth the transformer bay.',
          interlockRule: 'Interlock Check: All disconnectors (89-1A, 89-1B, 89-2) OPEN and Voltage = 0 kV.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: true
        }
      ]
    },
    {
      id: 'ORDER-02',
      title: '132kV Busbar A to Busbar B Live On-Load Bus Transfer',
      category: 'BUSBAR_TRANSFER',
      description: 'Transfer TR-1 from Main Busbar A to Reserve Busbar B seamlessly without feeder supply interruption.',
      targetAsset: '132kV Busbars A & B',
      safetyWarning: 'Bus Coupler Breaker 52-0 MUST remain closed during disconnector changeover.',
      status: 'READY_FOR_EXECUTION',
      author: 'Grid Operations Controller',
      steps: [
        {
          stepNo: 1,
          device: '52-0 (132kV Bus Coupler Breaker)',
          deviceKey: 'busCoupler52_0',
          targetAction: 'CLOSE',
          description: 'Close 132kV bus tie breaker to equalize potentials between Bus A and Bus B.',
          interlockRule: 'Interlock Check: Bus A and Bus B synchronized within 5 degrees.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: false
        },
        {
          stepNo: 2,
          device: '89-1B (TR-1 Bus-B Disconnector)',
          deviceKey: 'hvDisconnect89_1B',
          targetAction: 'CLOSE',
          description: 'Close Bus B selector disconnector onto energized parallel bus.',
          interlockRule: 'Interlock Check: Bus Coupler 52-0 confirmed CLOSED (Parallel bus transfer).',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: true
        },
        {
          stepNo: 3,
          device: '89-1A (TR-1 Bus-A Disconnector)',
          deviceKey: 'hvDisconnect89_1A',
          targetAction: 'OPEN',
          description: 'Open Bus A selector disconnector now that TR-1 is supported via Bus B.',
          interlockRule: 'Interlock Check: Bus-B Disconnector 89-1B confirmed fully CLOSED.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: true
        }
      ]
    },
    {
      id: 'ORDER-03',
      title: '13.8kV Medium-Voltage Feeder Load Transfer via Tie 52-6',
      category: 'MAINTENANCE_LOTO',
      description: 'Close MV Bus Sectionalizer 52-6 to transfer City Feeder onto Section 2 during TR-1 outage.',
      targetAsset: '13.8kV MV Switchgear Section 1 & 2',
      safetyWarning: 'Verify parallel inrush capacity before closing bus sectionalizer.',
      status: 'READY_FOR_EXECUTION',
      author: 'Senior Dispatcher: Eng. Haedara Deeb',
      steps: [
        {
          stepNo: 1,
          device: '52-6 (MV Bus Sectionalizer)',
          deviceKey: 'busSectionalizer52_6',
          targetAction: 'CLOSE',
          description: 'Close bus-tie circuit breaker to connect Section 1 and Section 2 busbars.',
          interlockRule: 'Interlock Check: Section 1 & 2 in phase synchronization.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: false
        },
        {
          stepNo: 2,
          device: '52-2 (TR-1 MV Breaker)',
          deviceKey: 'mvBreaker52_2',
          targetAction: 'OPEN',
          description: 'Isolate TR-1 from MV bus to leave TR-2 feeding both bus sections.',
          interlockRule: 'Interlock Check: TR-2 load capacity check < 100%.',
          isInterlockSatisfied: true,
          status: 'PENDING',
          requiresTwoMan: true
        }
      ]
    }
  ]);

  const activeOrder = switchingOrders.find((o) => o.id === selectedOrderId) || switchingOrders[0];

  // Perform dry-run safety interlocking verification
  const handlePerformDryRun = () => {
    setIsExecuting(true);
    addAuditLog('SWITCHING', `Initiated automated safety interlock dry-run simulation for Switching Order [${activeOrder.id}]: ${activeOrder.title}`);

    setTimeout(() => {
      setDryRunPassed(true);
      setIsExecuting(false);
      addAuditLog('SYSTEM', `Dry-run passed: All 5 safety interlocking conditions verified clean for [${activeOrder.id}].`);
    }, 1000);
  };

  // Execute single next step
  const handleExecuteNextStep = () => {
    if (currentStepIndex >= activeOrder.steps.length) return;

    const step = activeOrder.steps[currentStepIndex];
    if (step.requiresTwoMan && !twoManAuthorized) {
      alert('This critical step requires Two-Man Electronic Sign-Off authorization before remote actuation.');
      return;
    }

    setIsExecuting(true);

    // Apply real SCADA switchgear state change
    const targetTrId: 'TR-1' | 'TR-2' = /TR-2/.test(activeOrder.targetAsset) ? 'TR-2' : 'TR-1';
    toggleSwitch(targetTrId, step.deviceKey as keyof typeof tr1State.switches);
    addAuditLog(
      'SWITCHING',
      `Switching Sequence Step ${step.stepNo}/${activeOrder.steps.length} EXECUTED: ${step.targetAction} ${step.device} by ${currentUserName || 'Operator'}`
    );

    setTimeout(() => {
      // Update step status
      setSwitchingOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === activeOrder.id) {
            const updatedSteps = [...ord.steps];
            updatedSteps[currentStepIndex] = {
              ...updatedSteps[currentStepIndex],
              status: 'EXECUTED',
              executedBy: currentUserName || 'Operator',
              timestamp: new Date().toLocaleTimeString()
            };
            const allDone = currentStepIndex + 1 === ord.steps.length;
            return {
              ...ord,
              steps: updatedSteps,
              status: allDone ? 'COMPLETED' : 'IN_PROGRESS'
            };
          }
          return ord;
        })
      );

      setCurrentStepIndex((prev) => prev + 1);
      setIsExecuting(false);
    }, 800);
  };

  // Reset order
  const handleResetOrder = () => {
    setCurrentStepIndex(0);
    setDryRunPassed(false);
    setTwoManAuthorized(false);
    setSwitchingOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === activeOrder.id) {
          return {
            ...ord,
            status: 'READY_FOR_EXECUTION',
            steps: ord.steps.map((s) => ({ ...s, status: 'PENDING', executedBy: undefined, timestamp: undefined }))
          };
        }
        return ord;
      })
    );
    addAuditLog('SWITCHING', `Reset Switching Order [${activeOrder.id}] to initial state.`);
  };

  return (
    <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {t('switching_title')}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                IEC 62271 / IEEE C37.20 / OSHA LOTO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {t('switching_subtitle')}
            </p>
          </div>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">{t('switching_select_order')}:</span>
          <select
            value={selectedOrderId}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              setCurrentStepIndex(0);
              setDryRunPassed(false);
              setTwoManAuthorized(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            {switchingOrders.map((ord) => (
              <option key={ord.id} value={ord.id}>
                [{ord.category}] {ord.id}: {ord.title.substring(0, 38)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Order Overview Card */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                {activeOrder.category}
              </span>
              <h3 className="text-base font-bold text-white">{activeOrder.title}</h3>
            </div>
            <p className="text-xs text-zinc-400 pt-1">{activeOrder.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs font-mono">
              <span className="text-zinc-500 block">{t('switching_author')}: {activeOrder.author}</span>
              <span
                className={`font-bold ${
                  activeOrder.status === 'COMPLETED'
                    ? 'text-emerald-400'
                    : activeOrder.status === 'IN_PROGRESS'
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}
              >
                {t('switching_status_label')}: {activeOrder.status}
              </span>
            </div>
            <button
              onClick={handleResetOrder}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
              title="Reset Order"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Safety Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span><strong>{t('switching_safety_rule')}:</strong> {activeOrder.safetyWarning}</span>
        </div>

        {/* Step-by-Step Interactive Execution Flow */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-400" />
              <span>{t('switching_sequence_steps')} ({activeOrder.steps.length} Steps)</span>
            </h4>
            <span className="text-[11px] font-mono text-zinc-500">
              {t('switching_completed_count')}: {currentStepIndex} / {activeOrder.steps.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {activeOrder.steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isDone = step.status === 'EXECUTED';
              const isPending = idx > currentStepIndex;

              return (
                <div
                  key={step.stepNo}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-zinc-300'
                      : isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-900/20 ring-1 ring-indigo-500/40'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.stepNo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              step.targetAction === 'OPEN'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : step.targetAction === 'CLOSE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}
                          >
                            {step.targetAction}
                          </span>
                          <span className="text-xs font-bold text-white">{step.device}</span>
                          {step.requiresTwoMan && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              {t('switching_2man_signoff')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 pt-0.5">{step.description}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono">
                      <span className="text-[10px] text-zinc-400 block">{step.interlockRule}</span>
                      {step.timestamp && (
                        <span className="text-[10px] text-emerald-400 block font-bold">
                          {t('switching_executed_at')} {step.timestamp} by {step.executedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Man Authorization Box & Remote Dispatch Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
          {/* Two-Man Electronic Sign-Off */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                {t('switching_dual_auth')}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  twoManAuthorized
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {twoManAuthorized ? t('switching_authorized') : t('switching_pending')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              {t('switching_dual_desc')}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={authorizerName}
                onChange={(e) => setAuthorizerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white"
                placeholder="Authorizer Name & Badge ID"
              />
              <button
                onClick={() => {
                  setTwoManAuthorized(!twoManAuthorized);
                  if (!twoManAuthorized) {
                    addAuditLog('SYSTEM', `Two-Man Sign-Off Authorized by ${authorizerName}`);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap cursor-pointer transition-all ${
                  twoManAuthorized
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {twoManAuthorized ? t('switching_btn_authorized') : t('switching_btn_signoff')}
              </button>
            </div>
          </div>

          {/* Action Dispatch Controls */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {t('switching_step_dispatcher')}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  dryRunPassed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {dryRunPassed ? t('switching_dryrun_verified') : t('switching_dryrun_required')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePerformDryRun}
                disabled={isExecuting || dryRunPassed}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  dryRunPassed
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 opacity-80 cursor-default'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{dryRunPassed ? t('switching_dryrun_clean') : t('switching_run_dryrun')}</span>
              </button>

              <button
                onClick={handleExecuteNextStep}
                disabled={isExecuting || !dryRunPassed || currentStepIndex >= activeOrder.steps.length}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  currentStepIndex >= activeOrder.steps.length
                    ? 'bg-emerald-600 text-white cursor-default'
                    : !dryRunPassed
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>
                  {currentStepIndex >= activeOrder.steps.length
                    ? t('switching_completed_btn')
                    : `${t('switching_execute_step')} ${currentStepIndex + 1}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
