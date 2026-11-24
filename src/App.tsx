import React, { useState, useEffect, useRef } from 'react';
import { SubstationState, SwitchgearItem, AlarmItem, SoeEvent } from './types/substation';
import { INITIAL_SUBSTATION_STATE } from './data/initialState';
import { calculateSubstationPhysics } from './engine/physics';
import { validateInterlock } from './engine/interlock';
import { generateGoosePacket, generateIec104Packet } from './engine/protocols';
import { Header } from './components/Header';
import { YardView } from './components/YardSimulation/YardView';
import { ScadaView } from './components/ScadaHMI/ScadaView';
import { AlertOctagon, X, CheckCircle, ShieldAlert } from 'lucide-react';

const INITIAL_POWER_FACTOR = 0.90;

const calcReactiveQ = (pMW: number, pf: number): number => {
  const clampedPf = Math.min(1.0, Math.max(0.5, pf));
  if (clampedPf >= 0.9999) return 0;
  return Number((pMW * Math.tan(Math.acos(clampedPf))).toFixed(2));
};

const createInitialLoads = () => ({
  BAY_T1: { pMW: 70.0, qMVAr: calcReactiveQ(70.0, INITIAL_POWER_FACTOR) },
  BAY_T2: { pMW: 65.0, qMVAr: calcReactiveQ(65.0, INITIAL_POWER_FACTOR) },
});

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'YARD' | 'SCADA'>('YARD');
  const [state, setState] = useState<SubstationState>(INITIAL_SUBSTATION_STATE);
  
  // Environment inputs
  const [gridVoltage, setGridVoltage] = useState(220.0);
  const [ambientTemp, setAmbientTemp] = useState(28.0);
  const [powerFactor, setPowerFactor] = useState(INITIAL_POWER_FACTOR);
  const [lineLoads, setLineLoads] = useState<Record<string, { pMW: number; qMVAr: number }>>(createInitialLoads);

  // Latest state reference for pure event validation outside state updaters
  const stateRef = useRef<SubstationState>(state);
  stateRef.current = state;
  const pendingSyncRef = useRef(false);

  // Interlock System State
  const [interlockBypass, setInterlockBypass] = useState(false);
  const [interlockModal, setInterlockModal] = useState<{
    reason: string;
    recommendedStep?: string;
    code?: string;
  } | null>(null);

  // BroadcastChannel for Decoupled Multi-Window Sync
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      const bc = new BroadcastChannel('substation_digital_twin_sync');
      channelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === 'STATE_SYNC') {
          setState(event.data.payload);
        }
      };
      return () => bc.close();
    } catch (e) {
      // BroadcastChannel might not be supported in some restricted iframes
    }
  }, []);

  const broadcastSync = (newState: SubstationState) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'STATE_SYNC', payload: newState });
    }
  };

  useEffect(() => {
    if (pendingSyncRef.current) {
      pendingSyncRef.current = false;
      broadcastSync(state);
    }
  }, [state]);

  const logSoe = (
    bayId: string,
    sourceDevice: string,
    eventDescription: string,
    protocolTag: string,
    classification: 'TRIP' | 'ALARM' | 'CONTROL' | 'STATUS'
  ) => {
    const newEvent: SoeEvent = {
      id: `SOE_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      millis: Date.now(),
      bayId,
      sourceDevice,
      eventDescription,
      protocolTag,
      classification,
    };
    return newEvent;
  };

  const raiseAlarm = (bayId: string, severity: 'CRITICAL' | 'WARNING' | 'INFO', message: string): AlarmItem => {
    return {
      id: `ALM_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toLocaleTimeString(),
      severity,
      bayId,
      message,
      acknowledged: false,
      active: true,
    };
  };

  // Main Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prevState => {
        const { measurements, transformers, bus1Energized, bus2Energized } = calculateSubstationPhysics(
          prevState,
          gridVoltage,
          ambientTemp,
          lineLoads
        );

        let newPackets = [...prevState.snifferPackets];
        if (Math.random() > 0.4) {
          const sampleBay = ['BAY_W1_1', 'BAY_W2', 'BAY_W1_2', 'BAY_T1'][Math.floor(Math.random() * 4)];
          const sampleMeas = measurements[sampleBay];
          if (sampleMeas) {
            const pkt = generateIec104Packet('MEASUREMENT_SPONTANEOUS', {
              bay: sampleBay,
              ioa: 100 + Math.floor(Math.random() * 50),
              value: sampleMeas.voltageLL_kV,
              cause: 3,
            });
            newPackets = [...newPackets.slice(-60), pkt];
          }
        }

        let alarms = [...prevState.alarms];
        let updatedSwitchgears = { ...prevState.switchgears };
        let soeLogs = [...prevState.soeLogs];

        // Automatic Thermal Protection Trips (IEC 60076 WTI / OTI Trip)
        (['T1', 'T2'] as const).forEach(txId => {
          const tx = transformers[txId];
          const cbId = txId === 'T1' ? 'CB5' : 'CB6';
          if ((tx.protectionStatus?.wtiTrip || tx.protectionStatus?.otiTrip) && updatedSwitchgears[cbId]?.state === 'CLOSED') {
            updatedSwitchgears[cbId] = {
              ...updatedSwitchgears[cbId],
              state: 'OPEN',
              operationsCount: updatedSwitchgears[cbId].operationsCount + 1,
            };
            const tripReason = tx.protectionStatus?.wtiTrip 
              ? `WTI 49 TRIP: بلوغ حرارة النقطة الأسخن للملف ${tx.hotSpotTempC?.toFixed(1)}°C (أعلى من 120°C)`
              : `OTI 26Q TRIP: بلوغ حرارة الزيت العلوية ${tx.topOilTempC?.toFixed(1)}°C (أعلى من 100°C)`;
            
            alarms.push(raiseAlarm(`BAY_${txId}`, 'CRITICAL', tripReason));
            soeLogs.push(logSoe(`BAY_${txId}`, 'PROT_TRIP', `TRIP COMMAND: ${cbId} opened by ${tripReason}`, 'IEC 61850 GOOSE', 'TRIP'));
          } else if (tx.protectionStatus?.wtiAlarm && !alarms.some(a => a.active && a.message.includes(`WTI ALARM ${txId}`))) {
            alarms.push(raiseAlarm(`BAY_${txId}`, 'WARNING', `WTI ALARM ${txId}: حرارة النقطة الأسخن ${tx.hotSpotTempC?.toFixed(1)}°C بلغت عتبة الإنذار (100°C)`));
          }
        });

        const nextState: SubstationState = {
          ...prevState,
          gridVoltageKV: gridVoltage,
          ambientTempC: ambientTemp,
          bus1Energized,
          bus2Energized,
          switchgears: updatedSwitchgears,
          alarms,
          soeLogs,
          measurements,
          transformers,
          snifferPackets: newPackets,
        };

        return nextState;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gridVoltage, ambientTemp, lineLoads]);

  // Handle Switchgear Toggle (with Rigorous Safety Interlocking, pure updaters)
  const handleToggleSwitchgear = (id: string) => {
    const current = stateRef.current;
    const item = current.switchgears[id];
    if (!item) return;

    const targetState = item.state === 'CLOSED' ? 'OPEN' : 'CLOSED';

    // 1. Validate Interlock outside state updater
    if (!interlockBypass) {
      const interlock = validateInterlock(item, targetState, current);
      if (!interlock.allowed) {
        setInterlockModal({
          reason: interlock.reason || 'المناورة محظورة وفق معايير التشابك الميكانيكي والكهربائي!',
          recommendedStep: interlock.recommendedStep,
          code: interlock.code,
        });

        const soe = logSoe(
          item.bayId,
          item.id,
          `INTERLOCK VIOLATION: Blocked attempt to ${targetState} ${item.name} [${interlock.code}]`,
          'IEC 62271 Logic',
          'ALARM'
        );
        const alarm = raiseAlarm(item.bayId, 'WARNING', interlock.reason || 'Interlock Blocked');

        setState(prevState => ({
          ...prevState,
          soeLogs: [...prevState.soeLogs, soe],
          alarms: [...prevState.alarms, alarm],
        }));
        return;
      }
    }

    setInterlockModal(null);
    pendingSyncRef.current = true;

    // 2. Pure State Update
    setState(prevState => {
      const currentItem = prevState.switchgears[id];
      if (!currentItem) return prevState;
      const opTargetState = currentItem.state === 'CLOSED' ? 'OPEN' : 'CLOSED';

      const bypassSoe = interlockBypass
        ? [
            logSoe(
              currentItem.bayId,
              'INTERLOCK_KEY_OVERRIDE',
              `CAUTION: Maneuver ${currentItem.id} -> ${opTargetState} forced under Interlock Bypass Key!`,
              'MANUAL OVERRIDE',
              'ALARM'
            ),
          ]
        : [];

      const updatedItem: SwitchgearItem = {
        ...currentItem,
        state: opTargetState,
        operationsCount: currentItem.operationsCount + 1,
      };

      const goosePacket = generateGoosePacket(currentItem.bayId, `${currentItem.id} MANEUVER`, opTargetState);
      const iec104Packet = generateIec104Packet('SWITCH_STATUS', {
        bay: currentItem.bayId,
        ioa: 200 + parseInt(currentItem.id.replace(/\D/g, '') || '1'),
        value: opTargetState,
        cause: 3,
      });

      const soe = logSoe(
        currentItem.bayId,
        currentItem.id,
        `Maneuver Executed: ${currentItem.name} (${currentItem.id}) changed to ${opTargetState}`,
        currentItem.type === 'CB' ? 'IEC 61850 GOOSE' : 'Bay Controller I/O',
        'CONTROL'
      );

      return {
        ...prevState,
        switchgears: {
          ...prevState.switchgears,
          [id]: updatedItem,
        },
        soeLogs: [...prevState.soeLogs, ...bypassSoe, soe],
        snifferPackets: [...prevState.snifferPackets.slice(-60), goosePacket, iec104Packet],
      };
    });
  };

  // Handle Tap Changer (MR VACUTAP 19 Steps, -9 to +9, Step 10 is nominal 0)
  const handleTapChange = (txId: 'T1' | 'T2', direction: 'UP' | 'DOWN') => {
    setState(prevState => {
      const tx = prevState.transformers[txId];
      let newTap = tx.tapPosition;
      if (direction === 'UP' && newTap < 19) newTap++;
      if (direction === 'DOWN' && newTap > 1) newTap--;

      if (newTap === tx.tapPosition) return prevState;

      const oldOffset = tx.tapPosition - 10;
      const newOffset = newTap - 10;
      const offsetSign = newOffset > 0 ? `+${newOffset}` : `${newOffset}`;

      const soe = logSoe(
        `BAY_${txId}`,
        'TAPCON 260',
        `OLTC ${txId} Step Changed to ${newTap}/19 (${offsetSign} × 1.78%)`,
        'IEC 61850 MMS',
        'CONTROL'
      );

      return {
        ...prevState,
        transformers: {
          ...prevState.transformers,
          [txId]: {
            ...tx,
            tapPosition: newTap,
          }
        },
        soeLogs: [...prevState.soeLogs, soe],
      };
    });
  };

  // Fault Injections
  const handleInjectFault = (type: '3PH_FAULT' | 'SF6_LEAK' | 'TX_OVERHEAT') => {
    setState(prevState => {
      let updatedSwitchgears = { ...prevState.switchgears };
      let newAlarms = [...prevState.alarms];
      let newSoeLogs = [...prevState.soeLogs];
      let newSniffer = [...prevState.snifferPackets];

      if (type === 'SF6_LEAK') {
        updatedSwitchgears['CB1'] = {
          ...updatedSwitchgears['CB1'],
          sf6PressureBar: 4.8,
          sf6Status: 'BLOCK_OPERATION',
        };
        newAlarms.push(raiseAlarm('BAY_W1_1', 'CRITICAL', 'انخفاض حرج في ضغط غاز SF6 في القاطع CB1 (4.8 bar) - حظر المناورة مفعل بموجب IEC 62271!'));
        newSoeLogs.push(logSoe('BAY_W1_1', 'CB1 Density Sensor', 'SF6 GAS PRESSURE LOW ALARM & TRIP/CLOSE LOCKOUT (0.48 MPa)', 'Modbus RTU', 'ALARM'));
      } else if (type === '3PH_FAULT') {
        newAlarms.push(raiseAlarm('BAY_W1_1', 'CRITICAL', 'قصر ثلاثي الأطوار حرج (3-Phase Fault 38.5 kA) على الخط W1 الأول!'));
        newSoeLogs.push(logSoe('BAY_W1_1', 'SEL-487E', 'TRIP 50/51 INSTANTANEOUS PHASE OVERCURRENT (I = 38.5 kA) -> FAST GOOSE TRIP', 'IEC 61850 GOOSE', 'TRIP'));

        setTimeout(() => {
          setState(innerState => {
            const trippedCb: SwitchgearItem = {
              ...innerState.switchgears['CB1'],
              state: 'OPEN',
              operationsCount: innerState.switchgears['CB1'].operationsCount + 1,
            };
            const tripSoe = logSoe('BAY_W1_1', 'CB1 200-SFMT-40E', 'Circuit Breaker CB1 OPENED by SEL-487E Trip Coil (Arc Quenched in SF6)', 'IEC 61850 GOOSE', 'TRIP');
            const tripPkt = generateGoosePacket('BAY_W1_1', 'PROTECTION TRIP TO CB1', 'TRIP');

            return {
              ...innerState,
              switchgears: {
                ...innerState.switchgears,
                CB1: trippedCb,
              },
              soeLogs: [...innerState.soeLogs, tripSoe],
              snifferPackets: [...innerState.snifferPackets.slice(-60), tripPkt],
            };
          });
        }, 120);
      } else if (type === 'TX_OVERHEAT') {
        newAlarms.push(raiseAlarm('BAY_T1', 'WARNING', 'ارتفاع درجة حرارة زيت محول القدرة T1 (> 85°C) - بدء تشغيل التبريد القسري ONAF 2'));
        newSoeLogs.push(logSoe('BAY_T1', 'Pt100 Oil Sensor', 'Transformer T1 Top Oil High Temperature Warning (88.4 °C)', 'IEC 61850 MMS', 'ALARM'));
      }

      return {
        ...prevState,
        faultActive: true,
        faultType: type,
        switchgears: updatedSwitchgears,
        alarms: newAlarms,
        soeLogs: newSoeLogs,
        snifferPackets: newSniffer,
      };
    });
  };

  // Clear Faults
  const handleClearFaults = () => {
    setState(prevState => {
      const restoredSwitchgears = { ...prevState.switchgears };
      if (restoredSwitchgears['CB1']) {
        restoredSwitchgears['CB1'] = {
          ...restoredSwitchgears['CB1'],
          sf6PressureBar: 6.0,
          sf6Status: 'NORMAL',
        };
      }
      const soe = logSoe('SYSTEM', 'DISPATCHER', 'All simulated physical faults cleared. 86 Master Trip Lockouts reset.', 'SCADA MANUAL', 'STATUS');
      return {
        ...prevState,
        faultActive: false,
        faultType: 'NONE',
        switchgears: restoredSwitchgears,
        soeLogs: [...prevState.soeLogs, soe],
      };
    });
  };

  // Acknowledge Alarms
  const handleAcknowledgeAlarms = (id?: string) => {
    setState(prevState => ({
      ...prevState,
      alarms: prevState.alarms.map(a => {
        if (!id || a.id === id) {
          return { ...a, acknowledged: true };
        }
        return a;
      })
    }));
  };

  // Reset Alarms
  const handleResetAlarms = () => {
    setState(prevState => ({
      ...prevState,
      alarms: prevState.alarms.filter(a => !a.acknowledged || (a.severity === 'CRITICAL' && prevState.faultActive)),
    }));
  };

  // Emergency Station Trip
  const handleEmergencyStationTrip = () => {
    setState(prevState => {
      const trippedSwitchgears = { ...prevState.switchgears };
      ['CB1', 'CB2', 'CB3', 'CB4', 'CB5', 'CB6'].forEach(cbId => {
        if (trippedSwitchgears[cbId]) {
          trippedSwitchgears[cbId] = {
            ...trippedSwitchgears[cbId],
            state: 'OPEN',
            operationsCount: trippedSwitchgears[cbId].operationsCount + 1,
          };
        }
      });

      const soe = logSoe('STATION_BUS', 'SCADA_MASTER', 'EMERGENCY STATION TRIP INITIATED: ALL CIRCUIT BREAKERS CB1-CB6 OPENED', 'IEC 61850 GOOSE', 'TRIP');
      const alarm = raiseAlarm('STATION_BUS', 'CRITICAL', 'فصل طوارئ شامل للمحطة (STATION EMERGENCY TRIP) بواسطة مركز الإسكادا!');

      return {
        ...prevState,
        switchgears: trippedSwitchgears,
        soeLogs: [...prevState.soeLogs, soe],
        alarms: [...prevState.alarms, alarm],
      };
    });
  };

  // Reset Whole Substation
  const handleResetStation = () => {
    setState(INITIAL_SUBSTATION_STATE);
    setGridVoltage(220.0);
    setAmbientTemp(28.0);
    setPowerFactor(INITIAL_POWER_FACTOR);
    setLineLoads(createInitialLoads());
    setInterlockBypass(false);
    setInterlockModal(null);
  };

  const criticalAlarmsCount = state.alarms.filter(a => a.active && !a.acknowledged && a.severity === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-[#0e1014] text-slate-100 flex flex-col font-sans">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bus1Energized={state.bus1Energized}
        bus2Energized={state.bus2Energized}
        bus1VoltageKV={state.measurements['BUS1']?.voltageLL_kV || 0}
        bus2VoltageKV={state.measurements['BUS2']?.voltageLL_kV || 0}
        gridVoltage={state.gridVoltageKV}
        criticalAlarmsCount={criticalAlarmsCount}
        interlockBypass={interlockBypass}
        setInterlockBypass={setInterlockBypass}
        onReset={handleResetStation}
      />

      {/* Universal Interlock Safety Lockout Dialog */}
      {interlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18151b] border-2 border-red-500 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-slate-100">
            <div className="flex items-start justify-between border-b border-red-900/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-600 flex items-center justify-center text-red-400 shrink-0">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider block">
                    IEC 62271 INTERLOCK SAFETY LOCKOUT
                  </span>
                  <h3 className="text-base font-bold text-red-100">
                    حظر أمان تشغيلي ومخالفة إنترلوك القواطع
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInterlockModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-xl text-red-100 font-medium">
                {interlockModal.reason}
              </div>

              {interlockModal.recommendedStep && (
                <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-xl text-amber-200">
                  <strong className="block text-amber-300 font-bold mb-1">
                    💡 الإجراء الهندسي السليم المطلوب:
                  </strong>
                  <span>{interlockModal.recommendedStep}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-slate-500">
                Code: {interlockModal.code || 'IEC_INTERLOCK'}
              </span>
              <button
                onClick={() => setInterlockModal(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-900/50"
              >
                إقرار وفهم الإجراء السليم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Display */}
      <main className="flex-1 pb-10">
        {activeTab === 'YARD' ? (
          <YardView
            state={state}
            onToggleSwitchgear={handleToggleSwitchgear}
            onTapChange={handleTapChange}
            gridVoltage={gridVoltage}
            setGridVoltage={setGridVoltage}
            ambientTemp={ambientTemp}
            setAmbientTemp={setAmbientTemp}
            powerFactor={powerFactor}
            setPowerFactor={setPowerFactor}
            lineLoads={lineLoads}
            setLineLoads={setLineLoads}
            onInjectFault={handleInjectFault}
            onClearFaults={handleClearFaults}
            lastInterlockError={null}
            onDismissError={() => {}}
          />
        ) : (
          <ScadaView
            state={state}
            onToggleSwitchgear={handleToggleSwitchgear}
            onAcknowledgeAlarms={handleAcknowledgeAlarms}
            onResetAlarms={handleResetAlarms}
            onClearSoeLogs={() => setState(s => ({ ...s, soeLogs: [] }))}
            onClearSniffer={() => setState(s => ({ ...s, snifferPackets: [] }))}
            onEmergencyStationTrip={handleEmergencyStationTrip}
          />
        )}
      </main>
    </div>
  );
};
export default App;
