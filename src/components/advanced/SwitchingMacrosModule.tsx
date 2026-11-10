import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const SwitchingMacrosModule: React.FC = () => {
  const { toggleSwitch, addAuditLog } = useScada();
  const [activeMacro, setActiveMacro] = useState<string | null>(null);
  const [macroStep, setMacroStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Macro 1: Safe Isolation Sequence for TR-1
  const runIsolationMacro = () => {
    setActiveMacro('ISOLATION');
    setMacroStep(1);
    setLogs([]);
    appendLog('INITIATING: Substation Bay TR-1 Safe Isolation Macro Sequence...');

    setTimeout(() => {
      setMacroStep(2);
      toggleSwitch('TR-1', 'mvBreaker52_2');
      appendLog('STEP 1: Tripped MV Circuit Breaker 52-2. Current = 0.0A');

      setTimeout(() => {
        setMacroStep(3);
        toggleSwitch('TR-1', 'hvBreaker52_1');
        appendLog('STEP 2: Tripped HV Primary Circuit Breaker 52-1.');

        setTimeout(() => {
          setMacroStep(4);
          toggleSwitch('TR-1', 'hvDisconnect89_1A');
          appendLog('STEP 3: Opened Bus-A Selector Disconnector 89-1A.');

          setTimeout(() => {
            setMacroStep(5);
            toggleSwitch('TR-1', 'earthSwitch84_1');
            appendLog('STEP 4: Closed Earth Safety Switch 84-1. Transformer TR-1 Safely Grounded!');
            setActiveMacro(null);
            addAuditLog('SWITCHING', 'Automated Isolation Macro completed successfully for TR-1');
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Macro 2: Automatic Transfer Switch (ATS) to TR-2 Backup
  const runAtsMacro = () => {
    setActiveMacro('ATS');
    setMacroStep(1);
    setLogs([]);
    appendLog('INITIATING: Automatic Transfer Switching (ATS) to Backup Transformer TR-2...');

    setTimeout(() => {
      setMacroStep(2);
      toggleSwitch('TR-1', 'mvBreaker52_2');
      appendLog('STEP 1: Opened TR-1 MV Breaker 52-2.');

      setTimeout(() => {
        setMacroStep(3);
        toggleSwitch('TR-2', 'busSectionalizer52_6');
        appendLog('STEP 2: Closed MV Bus Sectionalizer 52-6. Load Transferred to TR-2!');
        setActiveMacro(null);
        addAuditLog('SWITCHING', 'ATS Bus Transfer to TR-2 Completed Successfully');
      }, 1000);
    }, 1000);
  };

  // Macro 3: 3-Stage Under-Frequency Load Shedding (UFLS)
  const runUflsMacro = () => {
    setActiveMacro('UFLS');
    setMacroStep(1);
    setLogs([]);
    appendLog('INITIATING: 3-Stage Under-Frequency Load Shedding (UFLS) Automation...');

    setTimeout(() => {
      setMacroStep(2);
      appendLog('STAGE 1 (49.2 Hz): Shed Commercial Feeder 03 Breaker 52-9');

      setTimeout(() => {
        setMacroStep(3);
        appendLog('STAGE 2 (48.8 Hz): Shed Industrial Feeder 02 Breaker 52-8');

        setTimeout(() => {
          setMacroStep(4);
          appendLog('STAGE 3 (48.4 Hz): Shed Non-Critical BESS Charger 52-B. Grid Frequency Stabilized!');
          setActiveMacro(null);
          addAuditLog('SWITCHING', '3-Stage UFLS Macro Triggered and Stabilized Frequency');
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-400">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              Scriptable Substation Automated Switching Sequences & Interlock Macros
            </h3>
            <p className="text-xs text-slate-400">
              Interlocked Sequential Operations, ATS Bus Transfer, & 3-Stage Under-Frequency Load Shedding (UFLS)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Macro Buttons */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-slate-800 pb-2">
            Available Macro Routines
          </h4>

          {/* Macro 1 Button */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 text-xs">TR-1 Safe Isolation Routine</span>
              <button
                onClick={runIsolationMacro}
                disabled={activeMacro !== null}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-bold rounded text-xs cursor-pointer transition-all flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Macro</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Sequential trip of MV 52-2 -&gt; HV 52-1 -&gt; Open Disconnector 89-1A -&gt; Close Earth 84-1.
            </p>
          </div>

          {/* Macro 2 Button */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 text-xs">Automatic Transfer Switch (ATS)</span>
              <button
                onClick={runAtsMacro}
                disabled={activeMacro !== null}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold rounded text-xs cursor-pointer transition-all flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run ATS</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Isolates TR-1 MV breaker and closes Bus Sectionalizer 52-6 to transfer load to backup TR-2.
            </p>
          </div>

          {/* Macro 3 Button */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 text-xs">3-Stage UFLS Load Shedding</span>
              <button
                onClick={runUflsMacro}
                disabled={activeMacro !== null}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold rounded text-xs cursor-pointer transition-all flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run UFLS</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Automatic load shed at 49.2 Hz, 48.8 Hz, and 48.4 Hz under severe grid frequency drop.
            </p>
          </div>
        </div>

        {/* Execution Log Terminal */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-slate-200 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Macro Execution Terminal & Interlock Verification</span>
            </h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeMacro ? 'bg-amber-950 text-amber-400 animate-pulse' : 'bg-slate-950 text-slate-400'}`}>
              {activeMacro ? `EXECUTING ${activeMacro} (STEP ${macroStep})` : 'IDLE / READY'}
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 h-56 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">No macro execution active. Select a routine on the left to execute.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="text-amber-300 font-bold border-b border-slate-900/60 pb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
