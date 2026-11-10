/**
 * SCADA Global State Management & Telemetry Engine
 * Real-time simulation loop, ISA-18.2 alarm engine, Web Audio sirens,
 * Switching interlocks, RBAC enforcement, and DGA/Aging calculations.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  TransformerTelemetry,
  SwitchgearState,
  AlarmItem,
  AlarmSeverity,
  AuditEvent,
  UserRole,
  DGAData,
  TelemetryHistoryPoint,
  AlarmThresholds,
  ActiveUserPresence,
  LockedDevice,
  RemoteToastNotification,
  SOEEvent,
  AssetHealthDetails,
  OTSScenarioId,
  OTSReport,
  BessState,
  ForecastPoint,
  HvdcTelemetry,
  HvdcControlMode,
  HvdcFaultType
} from '../types/scada';
import { Language, translations } from '../i18n/translations';
import { realtimeSync, SyncMessagePayload, TelemetrySyncSnapshot } from '../lib/realtimeSync';
import { soundEngine } from '../lib/soundEngine';
import { raiseAlarm, evaluateTelemetryAlarms } from '../lib/engineering/alarmEngine';
import { useShallowMemo } from '../lib/useShallowMemo';

export interface ScadaContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  isArabic: boolean;
  isAr: boolean;
  t: (key: string) => string;
  triggerAlarm: (asset: string, device: string, message: string, severity: AlarmSeverity) => void;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  activeTr: 'TR-1' | 'TR-2';
  setActiveTr: (tr: 'TR-1' | 'TR-2') => void;
  tr1State: TransformerTelemetry;
  tr2State: TransformerTelemetry;
  tr1Telemetry: TransformerTelemetry;
  tr2Telemetry: TransformerTelemetry;
  activeTelemetry: TransformerTelemetry;
  gridFrequency: number;
  clearAllFaults: () => void;
  simMode: 'AUTO' | 'MANUAL';
  setSimMode: (mode: 'AUTO' | 'MANUAL') => void;
  scanRateMs: number;
  setScanRateMs: (ms: number) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentUserName: string;
  rbacLogin: (role: UserRole, passcode?: string, customName?: string) => boolean;
  alarms: AlarmItem[];
  acknowledgeAlarm: (id: string) => void;
  acknowledgeAllAlarms: () => void;
  auditLogs: AuditEvent[];
  addAuditLog: (category: AuditEvent['category'], description: string, overrideUser?: string, overrideRole?: UserRole) => void;
  history: TelemetryHistoryPoint[];
  audioMuted: boolean;
  setAudioMuted: (muted: boolean) => void;
  initializeAudioContext: () => void;
  sirenActive: boolean;

  // Multi-User Collaboration & Presence
  activeUsers: ActiveUserPresence[];
  lockedDevices: Record<string, LockedDevice>;
  remoteToasts: RemoteToastNotification[];
  dismissToast: (id: string) => void;
  isDeviceLocked: (trId: 'TR-1' | 'TR-2', switchKey: keyof SwitchgearState) => LockedDevice | null;
  
  // Field Mode
  outdoorTheme: boolean;
  setOutdoorTheme: (val: boolean) => void;

  // Maintenance Mode
  maintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;

  // Thresholds
  thresholds: AlarmThresholds;
  updateThresholds: (newT: Partial<AlarmThresholds>) => void;

  // Manual Overrides
  manualValues: {
    loadCurrent: number;
    gridVoltage: number;
    oilTemp: number;
    thd: number;
    oilLevel1: number;
  };
  setManualValue: (key: keyof ScadaContextType['manualValues'], val: number) => void;

  // Control Actions
  toggleSwitch: (trId: 'TR-1' | 'TR-2', switchKey: keyof SwitchgearState) => { success: boolean; message: string };
  changeTap: (trId: 'TR-1' | 'TR-2', direction: 'UP' | 'DOWN') => void;
  setTapMode: (trId: 'TR-1' | 'TR-2', mode: 'AUTO' | 'MANUAL') => void;
  
  // Fault Injection
  injectFault: (faultType: 'SLG' | 'OVER_TEMP' | 'BUCHHOLZ' | 'OPEN_CT' | 'CLEAR') => void;

  // CT Ratio
  setCtRatio: (trId: 'TR-1' | 'TR-2', primaryRatio: number) => void;

  // Energy Reset
  resetEnergyAccumulators: (trId: 'TR-1' | 'TR-2') => void;

  // DGA
  dgaData: DGAData;
  setDgaData: React.Dispatch<React.SetStateAction<DGAData>>;

  // 1. High-Resolution SOE Recorder
  soeEvents: SOEEvent[];
  addSoeEvent: (eventText: string, asset: string, device: string, severity?: 'CRITICAL' | 'MAJOR' | 'INFO', forceRootCause?: boolean, forceCascaded?: boolean) => void;
  clearSoeEvents: () => void;
  isSoeModalOpen: boolean;
  setSoeModalOpen: (open: boolean) => void;

  // 3. Operator Training Simulator (OTS)
  otsScenarioId: OTSScenarioId | null;
  otsStatus: 'idle' | 'running' | 'completed';
  otsTimerSec: number;
  otsReport: OTSReport | null;
  startOtsScenario: (scenarioId: OTSScenarioId) => void;
  stopOtsScenario: () => void;
  completeOtsScenario: () => void;

  // 4. BESS & Load Forecasting
  bessState: BessState;
  setBessDispatchMode: (mode: 'AUTO' | 'MANUAL') => void;
  setBessManualPower: (powerMW: number) => void;

  // 5. VSC-HVDC Transmission Bay & Intertie Link (±320kV DC / 132kV AC)
  hvdcState: HvdcTelemetry;
  setHvdcSetpoints: (pMW: number, qMVAR: number, mode?: HvdcControlMode) => void;
  setHvdcControlMode: (mode: HvdcControlMode) => void;
  setHvdcFault: (fault: HvdcFaultType) => void;
  tripHvdcDccb: () => void;
  resetHvdcProtection: () => void;
}

const defaultSwitches: SwitchgearState = {
  hvBreaker52_1: true,
  hvDisconnect89_1A: true,
  hvDisconnect89_1B: false,
  hvBreaker52_4: true,
  hvDisconnect89_2A: true,
  hvDisconnect89_2B: false,
  busCoupler52_0: false,

  mvBreaker52_2: true,
  mvDisconnect89_2: true,
  mvBreaker52_5: true,
  mvDisconnect89_5: true,
  busSectionalizer52_6: false,
  earthSwitch84_1: false,
  earthSwitch84_2: false,

  feederCity52_7: true,
  feederInd52_8: true,
  feederComm52_9: true,
  feederBess52_B: true,
  tertiaryBreaker: true,

  // 132kV / ±320kV VSC-HVDC Bay Switchgear
  hvBreaker52_HVDC: true,
  hvDisconnect89_HVDC_A: true,
  hvDisconnect89_HVDC_B: false,
  pirBreaker52_PIR: false,
  dccbPositive52_DC1: true,
  dccbNegative52_DC2: true,
  dcEarth89_DCE1: false,
  dcEarth89_DCE2: false,
};

const createInitialState = (id: 'TR-1' | 'TR-2', name: string): TransformerTelemetry => ({
  id,
  name,
  ratingMVA: 50,
  primarykV: 132,
  secondarykV: 13.8,

  loadCurrent: id === 'TR-1' ? 450.0 : 380.0,
  gridVoltage: 132.0,
  phaseA_Voltage: 76.2,
  phaseB_Voltage: 76.2,
  phaseC_Voltage: 76.2,
  voltageUnbalance: 0.4,
  frequency: 50.0,

  ctRatioVal: 120, // 600/5
  primaryRatio: 600,
  secondaryRatio: 5,
  ctSecA: (id === 'TR-1' ? 450 : 380) / 120,
  ctSecB: (id === 'TR-1' ? 450 : 380) / 120,
  ctSecC: (id === 'TR-1' ? 450 : 380) / 120,
  ctBurdenVA: 12.5,

  oilTemp: 62.4,
  windingTemp: 71.8,
  bushingTemp: 54.4,
  ambientTemp: 30.0,
  coolingLoad: 40,

  oilLevel1: 72.5,
  oilLevel2: 74.8,
  tapPosition: 9,
  tapOps: 14,
  tapMode: 'AUTO',

  activePower: 87420,
  reactivePower: 54180,
  apparentPower: 102850,
  pf: 0.85,
  isLagging: true,
  fwdEnergy: 142560.2,
  revEnergy: 12.4,
  indEn: 88020.5,
  capEn: 152.1,
  appEn: 167520.8,
  maxDemand: 104.28,
  thd: 2.1,

  harmonics: {
    h1: 97.9,
    h3: 1.2,
    h5: 1.5,
    h7: 0.8,
    h9: 0.3,
    h11: 0.2,
    h13: 0.1,
  },

  switches: { ...defaultSwitches },
  fans: { fan1: true, fan2: false, pump1: true, pump2: false },
  faults: {
    lgFault: false,
    overTemp: false,
    buchholz: false,
    ctOpen: false,
    underVoltage: false,
    overVoltage: false,
    overCurrent: false,
  },
});

const ScadaContext = createContext<ScadaContextType | undefined>(undefined);

export const ScadaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const [activeTr, setActiveTr] = useState<'TR-1' | 'TR-2'>('TR-1');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }, [lang]);
  const [tr1State, setTr1State] = useState<TransformerTelemetry>(() => createInitialState('TR-1', 'Transformer Bay 01 (TR-1)'));
  const [tr2State, setTr2State] = useState<TransformerTelemetry>(() => createInitialState('TR-2', 'Transformer Bay 02 (TR-2)'));

  const tr1StateRef = useRef<TransformerTelemetry>(tr1State);
  const tr2StateRef = useRef<TransformerTelemetry>(tr2State);
  const activeTrRef = useRef<'TR-1' | 'TR-2'>(activeTr);

  useEffect(() => {
    tr1StateRef.current = tr1State;
  }, [tr1State]);

  useEffect(() => {
    tr2StateRef.current = tr2State;
  }, [tr2State]);

  useEffect(() => {
    activeTrRef.current = activeTr;
  }, [activeTr]);
  
  const [simMode, setSimModeState] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [scanRateMs, setScanRateMsState] = useState<number>(1000);

  const setSimMode = (mode: 'AUTO' | 'MANUAL') => {
    setSimModeState(mode);
    addAuditLog('SETTINGS', `Simulation mode set to ${mode}`);
    realtimeSync.broadcast({
      type: 'SETTINGS_UPDATE',
      simMode: mode,
    });
  };

  const setScanRateMs = (ms: number) => {
    setScanRateMsState(ms);
    addAuditLog('SETTINGS', `SCADA Scan rate set to ${ms}ms`);
    realtimeSync.broadcast({
      type: 'SETTINGS_UPDATE',
      scanRateMs: ms,
    });
  };
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('engineer');
  const [currentUserName, setCurrentUserNameState] = useState<string>('Eng. Essa Najjar [ENGINEER]');
  const [outdoorTheme, setOutdoorTheme] = useState<boolean>(false);
  const [maintenanceMode, setMaintenanceModeState] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(true); // Default muted so no unexpected audio on start
  const [sirenActive, setSirenActive] = useState<boolean>(false);

  // Multi-User Collaboration State
  const [activeUsers, setActiveUsers] = useState<ActiveUserPresence[]>([]);
  const [lockedDevices, setLockedDevices] = useState<Record<string, LockedDevice>>({});
  const [remoteToasts, setRemoteToasts] = useState<RemoteToastNotification[]>([]);

  // ---------------------------------------------------------------------
  // Authoritative telemetry ownership for multi-user sync.
  // Previously every workstation ran its own randomized simulation, so the
  // TR-1/TR-2 analog readings (A, kV, °C, kW, energies ...) drifted apart on
  // each screen. Now exactly one workstation (lowest ID among live peers) owns
  // the simulation and streams its frames; all other clients mirror them.
  // ---------------------------------------------------------------------
  const REMOTE_TELEMETRY_STALE_MS = 4000;
  const myWorkstationId = realtimeSync.getWorkstationId();
  const telemetryLeaderId = [myWorkstationId, ...activeUsers.map((u) => u.workstationId)].sort()[0];
  const isSimLeader = telemetryLeaderId === myWorkstationId;

  const remoteTelemetryRef = useRef<TelemetrySyncSnapshot | null>(null);
  const lastRemoteTelemetryAtRef = useRef<number>(0);
  const lastRemoteTelemetrySentAtRef = useRef<number>(0);
  const isSimLeaderRef = useRef<boolean>(isSimLeader);
  const telemetryLeaderIdRef = useRef<string>(telemetryLeaderId);

  useEffect(() => {
    isSimLeaderRef.current = isSimLeader;
    telemetryLeaderIdRef.current = telemetryLeaderId;
  }, [isSimLeader, telemetryLeaderId]);

  const setCurrentUserName = useCallback((name: string) => {
    setCurrentUserNameState(name);
    realtimeSync.setIdentity(name, currentUserRole);
  }, [currentUserRole]);

  const dismissToast = useCallback((id: string) => {
    setRemoteToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addRemoteToast = useCallback((toast: Omit<RemoteToastNotification, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toLocaleTimeString();
    const newToast: RemoteToastNotification = {
      ...toast,
      id,
      timestamp,
    };
    setRemoteToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setRemoteToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const isDeviceLocked = useCallback((trId: 'TR-1' | 'TR-2', switchKey: keyof SwitchgearState): LockedDevice | null => {
    const key = `${trId}:${switchKey}`;
    const lock = lockedDevices[key];
    if (lock && lock.lockExpiry > Date.now() && lock.lockedBy !== currentUserName) {
      return lock;
    }
    return null;
  }, [lockedDevices, currentUserName]);

  const [thresholds, setThresholds] = useState<AlarmThresholds>({
    overVoltageKV: 142.0,
    underVoltageKV: 118.0,
    overCurrentA: 550.0,
    oilTempHighC: 85.0,
    windingTempHighC: 95.0,
  });

  const [manualValues, setManualValuesState] = useState({
    loadCurrent: 450.0,
    gridVoltage: 132.0,
    oilTemp: 62.4,
    thd: 2.1,
    oilLevel1: 72.5,
  });

  const [dgaData, setDgaData] = useState<DGAData>({
    h2: 45.0,
    ch4: 25.0,
    c2h2: 1.2,
    c2h4: 18.0,
    c2h6: 12.0,
    co: 210.0,
    co2: 1450.0,
    generationRatePPMPerDay: 2.4,
    moistureInOilPPM: 14.5,
    bdvKV: 62.8,
  });

  // 1. High-Resolution SOE Recorder State
  const [soeEvents, setSoeEvents] = useState<SOEEvent[]>([
    {
      id: 'soe-init-1',
      timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      timestampMs: performance.now(),
      relativeMs: 0.0,
      asset: 'Substation Grid',
      device: 'RTU-01 Process Bus',
      eventText: 'SCADA Process Bus Sampled Values & GOOSE Ring Buffer Online',
      isRootCause: false,
      isCascaded: false,
      severity: 'INFO'
    }
  ]);
  const [isSoeModalOpen, setSoeModalOpen] = useState<boolean>(false);
  const lastFaultTimestampRef = useRef<number | null>(null);

  const addSoeEvent = useCallback(
    (
      eventText: string,
      asset: string,
      device: string,
      severity: 'CRITICAL' | 'MAJOR' | 'INFO' = 'INFO',
      forceRootCause?: boolean,
      forceCascaded?: boolean
    ) => {
      const nowMs = performance.now();
      const nowIso = new Date().toISOString().replace('T', ' ').replace('Z', '');

      let relativeMs = 0;
      let isRootCause = forceRootCause || false;
      let isCascaded = forceCascaded || false;

      if (severity === 'CRITICAL' || forceRootCause) {
        if (!lastFaultTimestampRef.current || nowMs - lastFaultTimestampRef.current > 3000) {
          lastFaultTimestampRef.current = nowMs;
          isRootCause = true;
          relativeMs = 0.0;
        } else {
          relativeMs = Number((nowMs - lastFaultTimestampRef.current).toFixed(3));
          isCascaded = true;
        }
      } else if (lastFaultTimestampRef.current) {
        relativeMs = Number((nowMs - lastFaultTimestampRef.current).toFixed(3));
        if (relativeMs < 1000) {
          isCascaded = true;
        }
      }

      const newSoe: SOEEvent = {
        id: `soe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowIso,
        timestampMs: nowMs,
        relativeMs,
        asset,
        device,
        eventText,
        isRootCause,
        isCascaded,
        severity
      };

      setSoeEvents((prev) => [newSoe, ...prev].slice(0, 1000));

      realtimeSync.broadcast({
        type: 'SOE_EVENT',
        soeEvent: newSoe
      });
    },
    []
  );

  const clearSoeEvents = useCallback(() => {
    setSoeEvents([]);
    lastFaultTimestampRef.current = null;
  }, []);

  // 3. Operator Training Simulator (OTS) State
  const [otsScenarioId, setOtsScenarioId] = useState<OTSScenarioId | null>(null);
  const [otsStatus, setOtsStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [otsTimerSec, setOtsTimerSec] = useState<number>(0);
  const [otsReport, setOtsReport] = useState<OTSReport | null>(null);
  const [otsActionLog, setOtsActionLog] = useState<{ timestamp: string; action: string; penalty?: number }[]>([]);
  const [otsInterlockViolations, setOtsInterlockViolations] = useState<number>(0);

  // 4. BESS & Load Forecasting State
  const [bessState, setBessState] = useState<BessState>({
    dispatchMode: 'AUTO',
    socPct: 78.5,
    powerMW: 0.0,
    capacityMWh: 40.0,
    maxPowerMW: 10.0,
    statusText: 'AUTO PEAK SHAVING READY'
  });

  const [forecastPoints] = useState<ForecastPoint[]>([
    { hour: '00:00', hourNum: 0, forecastMW: 18.2, actualMW: 17.8, bessContributionMW: -5.0 },
    { hour: '02:00', hourNum: 2, forecastMW: 15.4, actualMW: 15.1, bessContributionMW: -5.0 },
    { hour: '04:00', hourNum: 4, forecastMW: 14.8, actualMW: 14.9, bessContributionMW: -5.0 },
    { hour: '06:00', hourNum: 6, forecastMW: 22.1, actualMW: 21.8, bessContributionMW: 0.0 },
    { hour: '08:00', hourNum: 8, forecastMW: 38.5, actualMW: 39.2, bessContributionMW: 0.0 },
    { hour: '10:00', hourNum: 10, forecastMW: 44.2, actualMW: 45.1, bessContributionMW: 5.0 },
    { hour: '12:00', hourNum: 12, forecastMW: 48.6, actualMW: 49.0, bessContributionMW: 8.0 },
    { hour: '14:00', hourNum: 14, forecastMW: 46.8, actualMW: 47.2, bessContributionMW: 6.0 },
    { hour: '16:00', hourNum: 16, forecastMW: 42.0, actualMW: 41.5, bessContributionMW: 2.0 },
    { hour: '18:00', hourNum: 18, forecastMW: 36.4, actualMW: 36.8, bessContributionMW: 0.0 },
    { hour: '20:00', hourNum: 20, forecastMW: 28.5, actualMW: 28.1, bessContributionMW: 0.0 },
    { hour: '22:00', hourNum: 22, forecastMW: 21.0, actualMW: 20.6, bessContributionMW: -3.0 }
  ]);

  const setBessDispatchMode = useCallback((mode: 'AUTO' | 'MANUAL') => {
    setBessState((prev) => ({
      ...prev,
      dispatchMode: mode,
      statusText: mode === 'AUTO' ? 'AUTOMATED AI PEAK-SHAVING DISPATCH' : 'MANUAL OPERATOR DISPATCH OVERRIDE'
    }));

    realtimeSync.broadcast({
      type: 'BESS_UPDATE',
      bessData: { dispatchMode: mode }
    });
  }, []);

  const setBessManualPower = useCallback((powerMW: number) => {
    setBessState((prev) => ({
      ...prev,
      dispatchMode: 'MANUAL',
      powerMW,
      statusText: `MANUAL POWER OVERRIDE: ${powerMW > 0 ? `Discharging +${powerMW}MW` : powerMW < 0 ? `Charging ${powerMW}MW` : 'Standby 0MW'}`
    }));

    realtimeSync.broadcast({
      type: 'BESS_UPDATE',
      bessData: { dispatchMode: 'MANUAL', powerMW }
    });
  }, []);

  // 5. VSC-HVDC Transmission Bay State (IEC 62501, IEC 62747, CIGRE B4)
  const [hvdcState, setHvdcState] = useState<HvdcTelemetry>({
    id: 'HVDC-1',
    name: 'VSC-MMC ±320kV Intertie Link',
    nominalMva: 220,
    nominalVdcKV: 320,
    nominalVacKV: 132,
    activePowerMW: 120.0,
    reactivePowerMVAR: 25.0,
    apparentPowerMVA: 122.6,
    powerFactor: 0.98,
    isExporting: true,
    vdcPositiveKV: 320.0,
    vdcNegativeKV: -320.0,
    vdcTotalKV: 640.0,
    idcAmps: 187.5,
    controlMode: 'CONST_P',
    pRefMW: 120.0,
    qRefMVAR: 25.0,
    vdcRefKV: 320.0,
    modulationIndexMa: 0.92,
    firingAngleAlphaDeg: 12.4,
    syntheticInertiaH: 4.5,
    frequencyDroopGainPct: 4.0,
    totalSubmodules: 1200,
    healthySubmodules: 1196,
    bypassedSubmodules: 4,
    valveJunctionTempC: 68.4,
    coolantTempC: 38.2,
    coolantFlowRatePct: 98.4,
    coolantFlowM3h: 18.7,
    coolantConductivityUS_cm: 0.08,
    mainPumpRunning: true,
    standbyPumpReady: true,
    thdPercent: 0.85,
    lineLengthKm: 150,
    lossMW: 1.84,
    efficiencyPct: 98.47,
    faultState: 'NONE',
    isLvrtActive: false,
    dccbTripped: false,
    converterBlocked: false,
  });

  // Refs keep the latest BESS/HVDC frames available to the telemetry broadcaster
  // without waiting for React to re-render.
  const bessStateRef = useRef<BessState>(bessState);
  const hvdcStateRef = useRef<HvdcTelemetry>(hvdcState);

  useEffect(() => {
    bessStateRef.current = bessState;
  }, [bessState]);

  useEffect(() => {
    hvdcStateRef.current = hvdcState;
  }, [hvdcState]);

  const [alarms, setAlarms] = useState<AlarmItem[]>([
    {
      id: 'alarm-1',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      asset: 'Substation Grid',
      device: 'Grid Telemetry',
      message: 'SCADA System Booted & RTU-01 Primary Link Synchronized',
      severity: 'info',
      state: 'active_acked',
      ackBy: 'System',
      ackTimestamp: new Date(Date.now() - 290000).toISOString(),
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      user: 'SYSTEM',
      role: 'operator',
      category: 'SYSTEM',
      description: 'RTU-01 SCADA Substation Monitoring Node online.',
    },
  ]);

  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);

  // Web Audio Context reference for alarm siren
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    soundEngine.setMuted(audioMuted);
  }, [audioMuted]);

  const initializeAudioContext = useCallback(() => {
    soundEngine.setMuted(false);
    setAudioMuted(false);
  }, []);

  const addAuditLog = useCallback((category: AuditEvent['category'], description: string, overrideUser?: string, overrideRole?: UserRole) => {
    const roleToUse = overrideRole || currentUserRole;
    const userToUse = overrideUser || currentUserName;
    const newEvent: AuditEvent = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      user: `${userToUse}`,
      role: roleToUse,
      category,
      description,
    };
    setAuditLogs((prev) => [newEvent, ...prev.slice(0, 199)]);
  }, [currentUserRole, currentUserName]);

  // Real-Time Subscriptions for Multi-User Sync
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg: SyncMessagePayload) => {
      // 1. Presence Heartbeat
      if (msg.type === 'PRESENCE_HEARTBEAT') {
        setActiveUsers((prev) => {
          const filtered = prev.filter((u) => u.workstationId !== msg.senderWorkstationId);
          return [
            ...filtered,
            {
              workstationId: msg.senderWorkstationId,
              userName: msg.senderName,
              userRole: msg.senderRole,
              lastActiveTimestamp: msg.timestamp,
            },
          ];
        });
      }

      // 2. Switch Operation Remote Event
      if (msg.type === 'SWITCH_OPERATION' && msg.trId && msg.switchKey !== undefined && msg.newState !== undefined) {
        const trId = msg.trId;
        const switchKey = msg.switchKey;
        const newState = msg.newState;

        const updater = (prev: TransformerTelemetry) => ({
          ...prev,
          switches: {
            ...prev.switches,
            [switchKey]: newState,
          },
        });

        if (trId === 'TR-1') setTr1State(updater);
        else setTr2State(updater);

        const stateLabel = newState ? 'CLOSED (ENERGIZED)' : 'OPEN (ISOLATED)';
        const logMsg = `${msg.senderName} [${msg.senderRole.toUpperCase()}] Operated ${trId} ${switchKey} ➔ ${stateLabel}`;

        addAuditLog('SWITCHING', logMsg, msg.senderName, msg.senderRole);
        addRemoteToast({
          operatorName: msg.senderName,
          operatorRole: msg.senderRole,
          actionTitle: `${trId} Remote Switch Control`,
          actionDetails: `${switchKey} ➔ ${stateLabel}`,
        });
      }

      // 3. Device Lock
      if (msg.type === 'DEVICE_LOCK' && msg.deviceKey && msg.lockExpiry) {
        setLockedDevices((prev) => ({
          ...prev,
          [msg.deviceKey!]: {
            deviceKey: msg.deviceKey!,
            lockedBy: msg.senderName,
            userRole: msg.senderRole,
            lockExpiry: msg.lockExpiry!,
          },
        }));
      }

      // 4. Fault Injection Remote Event
      if (msg.type === 'FAULT_INJECTION' && msg.faultType) {
        const faultType = msg.faultType;
        const updater = (prev: TransformerTelemetry): TransformerTelemetry => {
          if (faultType === 'CLEAR') {
            return {
              ...prev,
              faults: { lgFault: false, overTemp: false, buchholz: false, ctOpen: false, underVoltage: false, overVoltage: false, overCurrent: false },
            };
          }
          return {
            ...prev,
            faults: {
              ...prev.faults,
              lgFault: faultType === 'SLG' ? true : prev.faults.lgFault,
              overTemp: faultType === 'OVER_TEMP' ? true : prev.faults.overTemp,
              buchholz: faultType === 'BUCHHOLZ' ? true : prev.faults.buchholz,
              ctOpen: faultType === 'OPEN_CT' ? true : prev.faults.ctOpen,
            },
          };
        };
        setTr1State(updater);
        setTr2State(updater);

        addAuditLog('FAULT_INJECT', `Remote Fault Trigger: ${faultType} by ${msg.senderName}`, msg.senderName, msg.senderRole);
        addRemoteToast({
          operatorName: msg.senderName,
          operatorRole: msg.senderRole,
          actionTitle: 'Remote Protection Fault Injected',
          actionDetails: `Fault Type: ${faultType}`,
        });
      }

      // 5. Maintenance Mode Remote Event
      if (msg.type === 'MAINTENANCE_TOGGLE' && msg.maintenanceMode !== undefined) {
        setMaintenanceModeState(msg.maintenanceMode);
        addAuditLog(
          'SYSTEM',
          msg.maintenanceMode
            ? `SUBSTATION LOTO MAINTENANCE MODE ACTIVATED by ${msg.senderName}`
            : `Substation LOTO Maintenance Mode Cleared by ${msg.senderName}`,
          msg.senderName,
          msg.senderRole
        );
        addRemoteToast({
          operatorName: msg.senderName,
          operatorRole: msg.senderRole,
          actionTitle: msg.maintenanceMode ? 'LOTO Maintenance Mode Active' : 'LOTO Maintenance Cleared',
          actionDetails: msg.maintenanceMode ? 'Substation switching safety-locked' : 'Normal SCADA dispatch resumed',
        });
      }

      // 6. Tap Change Remote Event
      if (msg.type === 'TAP_CHANGE' && msg.trId) {
        const trId = msg.trId;
        if (msg.tapDirection) {
          const direction = msg.tapDirection;
          const updater = (prev: TransformerTelemetry) => ({
            ...prev,
            tapPosition: direction === 'UP' ? Math.min(17, prev.tapPosition + 1) : Math.max(1, prev.tapPosition - 1),
            tapOps: prev.tapOps + 1,
          });
          if (trId === 'TR-1') setTr1State(updater);
          else setTr2State(updater);
          addAuditLog('TAP_CHANGE', `Remote OLTC Tap ${direction} on ${trId} by ${msg.senderName}`, msg.senderName, msg.senderRole);
        }
        if (msg.tapMode) {
          const mode = msg.tapMode;
          const updater = (prev: TransformerTelemetry) => ({ ...prev, tapMode: mode });
          if (trId === 'TR-1') setTr1State(updater);
          else setTr2State(updater);
          addAuditLog('TAP_CHANGE', `Remote OLTC Mode set to ${mode} on ${trId} by ${msg.senderName}`, msg.senderName, msg.senderRole);
        }
      }

      // 7. Alarm Acknowledgment Remote Event
      if (msg.type === 'ALARM_ACK') {
        const senderLabel = msg.senderName || msg.senderRole;
        if (msg.ackAll) {
          setAlarms((prev) =>
            prev.map((a) => ({
              ...a,
              state: a.state === 'active_unacked' ? 'active_acked' : a.state === 'cleared_unacked' ? 'archived' : a.state,
              ackBy: senderLabel.toUpperCase(),
              ackTimestamp: new Date().toLocaleTimeString(),
            }))
          );
          addAuditLog('ACK', `All alarms acknowledged remotely by ${senderLabel}`, msg.senderName, msg.senderRole);
        } else if (msg.alarmId) {
          setAlarms((prev) =>
            prev.map((a) =>
              a.id === msg.alarmId
                ? {
                    ...a,
                    state: a.state === 'active_unacked' ? 'active_acked' : 'archived',
                    ackBy: senderLabel.toUpperCase(),
                    ackTimestamp: new Date().toLocaleTimeString(),
                  }
                : a
            )
          );
          addAuditLog('ACK', `Alarm ${msg.alarmId} acknowledged remotely by ${senderLabel}`, msg.senderName, msg.senderRole);
        }
      }

      // 8. Settings & Simulation Sliders Remote Event
      if (msg.type === 'SETTINGS_UPDATE') {
        if (msg.manualValues) {
          setManualValuesState((prev) => ({ ...prev, ...msg.manualValues }));
        }
        if (msg.thresholds) {
          setThresholds((prev) => ({ ...prev, ...msg.thresholds }));
        }
        if (msg.simMode) {
          setSimModeState(msg.simMode);
        }
        if (msg.scanRateMs) {
          setScanRateMsState(msg.scanRateMs);
        }
        if (msg.trId && msg.primaryRatio) {
          const ratioVal = msg.primaryRatio / 5;
          const updater = (prev: TransformerTelemetry) => ({
            ...prev,
            primaryRatio: msg.primaryRatio!,
            secondaryRatio: 5,
            ctRatioVal: ratioVal,
            ctSecA: prev.loadCurrent / ratioVal,
            ctSecB: prev.loadCurrent / ratioVal,
            ctSecC: prev.loadCurrent / ratioVal,
          });
          if (msg.trId === 'TR-1') setTr1State(updater);
          else setTr2State(updater);
        }
        if (msg.trId && msg.resetEnergy) {
          const updater = (prev: TransformerTelemetry) => ({
            ...prev,
            fwdEnergy: 0,
            revEnergy: 0,
            indEn: 0,
            capEn: 0,
            appEn: 0,
            maxDemand: 0,
          });
          if (msg.trId === 'TR-1') setTr1State(updater);
          else setTr2State(updater);
        }
        addAuditLog('SETTINGS', `SCADA Settings/Simulation parameters adjusted remotely by ${msg.senderName}`, msg.senderName, msg.senderRole);
      }

      // 9a. Authoritative live telemetry frame from the elected simulation leader
      if (msg.type === 'TELEMETRY_SYNC' && msg.telemetry) {
        // The elected leader is authoritative and never follows anyone else.
        if (!isSimLeaderRef.current) {
          const fromElectedLeader = msg.senderWorkstationId === telemetryLeaderIdRef.current;
          // If the elected leader went silent (tab closed), accept any peer's
          // frame so remaining workstations still converge while re-electing.
          const leaderSilent =
            Date.now() - lastRemoteTelemetryAtRef.current >= REMOTE_TELEMETRY_STALE_MS;
          if (fromElectedLeader || leaderSilent) {
            lastRemoteTelemetrySentAtRef.current = msg.telemetry.sentAt;
            remoteTelemetryRef.current = msg.telemetry;
            lastRemoteTelemetryAtRef.current = Date.now();
          }
        }
        return;
      }

      // 9. Full State Snapshot Sync
      if (msg.type === 'FULL_STATE_SYNC' && msg.snapshot) {
        const snap = msg.snapshot;
        if (snap.tr1Switches) setTr1State((prev) => ({ ...prev, switches: snap.tr1Switches }));
        if (snap.tr2Switches) setTr2State((prev) => ({ ...prev, switches: snap.tr2Switches }));
        if (snap.simMode) setSimModeState(snap.simMode);
        if (snap.manualValues) setManualValuesState(snap.manualValues);
        if (snap.thresholds) setThresholds(snap.thresholds);
        if (snap.maintenanceMode !== undefined) setMaintenanceModeState(snap.maintenanceMode);
      }

      // 10. SOE Event Remote Sync
      if (msg.type === 'SOE_EVENT' && msg.soeEvent) {
        setSoeEvents((prev) => {
          if (prev.some((e) => e.id === msg.soeEvent!.id)) return prev;
          return [msg.soeEvent!, ...prev].slice(0, 1000);
        });
      }

      // 11. OTS Scenario Sync
      if (msg.type === 'OTS_SCENARIO' && msg.otsState) {
        const st = msg.otsState;
        if (st.action === 'START' && st.scenarioId) {
          setOtsScenarioId(st.scenarioId);
          setOtsStatus('running');
          setOtsTimerSec(0);
        } else if (st.action === 'STOP') {
          setOtsStatus('idle');
          setOtsScenarioId(null);
        } else if (st.action === 'COMPLETE' && st.otsReport) {
          setOtsStatus('completed');
          setOtsReport(st.otsReport);
        }
      }

      // 12. BESS Dispatch Sync
      if (msg.type === 'BESS_UPDATE' && msg.bessData) {
        setBessState((prev) => ({
          ...prev,
          ...msg.bessData
        }));
      }

      // 13. VSC-HVDC Link Telemetry & Setpoints Sync
      if ((msg.type === 'HVDC_UPDATE' || msg.type === 'HVDC_SETPOINT') && msg.hvdcData) {
        setHvdcState((prev) => ({
          ...prev,
          ...msg.hvdcData
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addAuditLog, addRemoteToast]);

  // Seed from the frame/snapshot the server caches and replays on connect, so a
  // newly opened or reloaded workstation converges immediately.
  useEffect(() => {
    const cachedTelemetry = realtimeSync.getLastTelemetry();
    if (cachedTelemetry) {
      remoteTelemetryRef.current = cachedTelemetry;
      lastRemoteTelemetrySentAtRef.current = cachedTelemetry.sentAt;
      lastRemoteTelemetryAtRef.current = Date.now();
    }
    const cachedSnapshot = realtimeSync.getLastSnapshot();
    if (cachedSnapshot) {
      if (cachedSnapshot.tr1Switches) setTr1State((prev) => ({ ...prev, switches: cachedSnapshot.tr1Switches }));
      if (cachedSnapshot.tr2Switches) setTr2State((prev) => ({ ...prev, switches: cachedSnapshot.tr2Switches }));
      if (cachedSnapshot.simMode) setSimModeState(cachedSnapshot.simMode);
      if (cachedSnapshot.manualValues) setManualValuesState(cachedSnapshot.manualValues);
      if (cachedSnapshot.thresholds) setThresholds(cachedSnapshot.thresholds);
      if (cachedSnapshot.maintenanceMode !== undefined) setMaintenanceModeState(cachedSnapshot.maintenanceMode);
    }
  }, []);

  // Periodic Presence Heartbeat and Device Lock Cleanup
  useEffect(() => {
    const presenceTimer = setInterval(() => {
      realtimeSync.broadcastPresence();

      const now = Date.now();
      // Clean up stale users (> 8s)
      setActiveUsers((prev) => prev.filter((u) => now - u.lastActiveTimestamp < 8000));

      // Clean up expired locks
      setLockedDevices((prev) => {
        const next: Record<string, LockedDevice> = {};
        for (const [k, lock] of Object.entries(prev)) {
          const l = lock as LockedDevice;
          if (l && l.lockExpiry > now) {
            next[k] = l;
          }
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(presenceTimer);
  }, []);

  const setMaintenanceMode = useCallback((val: boolean) => {
    setMaintenanceModeState(val);
    addAuditLog('SYSTEM', val ? 'SUBSTATION MAINTENANCE MODE ACTIVATED (LOTO Isolation Engaged)' : 'Substation Maintenance Mode Deactivated');
    realtimeSync.broadcast({
      type: 'MAINTENANCE_TOGGLE',
      maintenanceMode: val,
    });
  }, [addAuditLog]);

  const rbacLogin = (role: UserRole, passcode?: string, customName?: string): boolean => {
    let assignedName = customName?.trim() || '';
    if (!assignedName) {
      if (role === 'engineer') assignedName = 'Eng. Essa Najjar [ENGINEER]';
      else if (role === 'manager') assignedName = 'Eng. Haedara Deeb [MANAGER]';
      else assignedName = 'Grid Operator [OPERATOR]';
    }

    if (role === 'operator') {
      setCurrentUserRole('operator');
      setCurrentUserNameState(assignedName);
      realtimeSync.setIdentity(assignedName, 'operator');
      addAuditLog('SYSTEM', `Logged in as Operator (${assignedName})`, assignedName, 'operator');
      return true;
    }
    if (role === 'engineer') {
      if (!passcode || passcode === 'engineer123' || passcode === 'demo' || passcode === 'admin') {
        setCurrentUserRole('engineer');
        setCurrentUserNameState(assignedName);
        realtimeSync.setIdentity(assignedName, 'engineer');
        addAuditLog('SYSTEM', `Logged in as Systems Engineer (${assignedName})`, assignedName, 'engineer');
        return true;
      }
      return false;
    }
    if (role === 'manager') {
      if (!passcode || passcode === 'manager123' || passcode === 'demo' || passcode === 'admin') {
        setCurrentUserRole('manager');
        setCurrentUserNameState(assignedName);
        realtimeSync.setIdentity(assignedName, 'manager');
        addAuditLog('SYSTEM', `Logged in as Substation Manager (${assignedName})`, assignedName, 'manager');
        return true;
      }
      return false;
    }
    return false;
  };

  const setManualValue = (key: keyof ScadaContextType['manualValues'], val: number) => {
    setManualValuesState((prev) => {
      const updated = { ...prev, [key]: val };
      realtimeSync.broadcast({
        type: 'SETTINGS_UPDATE',
        manualValues: updated,
      });
      return updated;
    });
    addAuditLog('SETTINGS', `Manual override ${key} set to ${val}`);
  };

  const updateThresholds = (newT: Partial<AlarmThresholds>) => {
    setThresholds((prev) => {
      const updated = { ...prev, ...newT };
      realtimeSync.broadcast({
        type: 'SETTINGS_UPDATE',
        thresholds: updated,
      });
      return updated;
    });
    addAuditLog('SETTINGS', 'Updated SCADA Alarm Safety Thresholds');
  };

  const setCtRatio = (trId: 'TR-1' | 'TR-2', primaryRatio: number) => {
    const safePrimary = Math.max(5, primaryRatio || 5);
    const ratioVal = safePrimary / 5;
    const updater = (prev: TransformerTelemetry) => ({
      ...prev,
      primaryRatio: safePrimary,
      secondaryRatio: 5,
      ctRatioVal: ratioVal,
      ctSecA: prev.loadCurrent / ratioVal,
      ctSecB: prev.loadCurrent / ratioVal,
      ctSecC: prev.loadCurrent / ratioVal,
    });
    if (trId === 'TR-1') setTr1State(updater);
    else setTr2State(updater);
    addAuditLog('SETTINGS', `Updated ${trId} CT Ratio to ${safePrimary}/5A`);
    realtimeSync.broadcast({
      type: 'SETTINGS_UPDATE',
      trId,
      primaryRatio: safePrimary,
    });
  };

  const resetEnergyAccumulators = (trId: 'TR-1' | 'TR-2') => {
    const updater = (prev: TransformerTelemetry) => ({
      ...prev,
      fwdEnergy: 0,
      revEnergy: 0,
      indEn: 0,
      capEn: 0,
      appEn: 0,
      maxDemand: 0,
    });
    if (trId === 'TR-1') setTr1State(updater);
    else setTr2State(updater);
    addAuditLog('SETTINGS', `Reset ${trId} Energy Accumulator Registers`);
    realtimeSync.broadcast({
      type: 'SETTINGS_UPDATE',
      trId,
      resetEnergy: true,
    });
  };

  // Sound Siren Management
  useEffect(() => {
    const hasActiveUnackedCritical = alarms.some(
      (a) => a.state === 'active_unacked' && (a.severity === 'critical' || a.severity === 'major')
    );
    setSirenActive(hasActiveUnackedCritical);

    if (hasActiveUnackedCritical && !audioMuted) {
      soundEngine.startSiren();
    } else {
      soundEngine.stopSiren();
    }
  }, [alarms, audioMuted]);

  // Alarm Trigger helper (ISA-18.2 suppression via pure alarm engine)
  const triggerAlarm = useCallback((asset: string, device: string, message: string, severity: AlarmSeverity) => {
    setAlarms((prev) => {
      const { next, added } = raiseAlarm(
        prev,
        { asset, device, message, severity },
        () => `alarm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        () => new Date().toLocaleTimeString()
      );
      if (added) {
        addSoeEvent(message, asset, device, severity === 'critical' ? 'CRITICAL' : severity === 'major' ? 'MAJOR' : 'INFO');
      }
      return next;
    });
  }, [addSoeEvent]);

  const acknowledgeAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              state: a.state === 'active_unacked' ? 'active_acked' : 'archived',
              ackBy: (currentUserName || currentUserRole).toUpperCase(),
              ackTimestamp: new Date().toLocaleTimeString(),
            }
          : a
      )
    );
    addAuditLog('ACK', `Acknowledged Alarm ID: ${id}`);
    realtimeSync.broadcast({
      type: 'ALARM_ACK',
      alarmId: id,
    });
  };

  const acknowledgeAllAlarms = () => {
    setAlarms((prev) =>
      prev.map((a) => ({
        ...a,
        state: a.state === 'active_unacked' ? 'active_acked' : a.state === 'cleared_unacked' ? 'archived' : a.state,
        ackBy: (currentUserName || currentUserRole).toUpperCase(),
        ackTimestamp: new Date().toLocaleTimeString(),
      }))
    );
    addAuditLog('ACK', 'Acknowledged All Outstanding Alarms');
    realtimeSync.broadcast({
      type: 'ALARM_ACK',
      ackAll: true,
    });
  };

  const setHvdcSetpoints = useCallback((pMW: number, qMVAR: number, mode?: HvdcControlMode) => {
    setHvdcState((prev) => {
      const nextMode = mode || prev.controlMode;
      const clampedP = Math.max(-200, Math.min(200, pMW));
      const clampedQ = Math.max(-100, Math.min(100, qMVAR));
      const appMva = Math.sqrt(clampedP * clampedP + clampedQ * clampedQ);
      const pf = appMva > 0 ? Math.abs(clampedP) / appMva : 1.0;
      const idc = (Math.abs(clampedP) * 1e6) / 640000;
      const copperLoss = 2 * Math.pow(idc, 2) * (0.015 * prev.lineLengthKm);
      const convLoss = Math.abs(clampedP) * 1e6 * 0.009;
      const totalLossMw = (copperLoss + convLoss) / 1e6;

      const updated: HvdcTelemetry = {
        ...prev,
        controlMode: nextMode,
        pRefMW: clampedP,
        qRefMVAR: clampedQ,
        activePowerMW: clampedP,
        reactivePowerMVAR: clampedQ,
        apparentPowerMVA: appMva,
        powerFactor: pf,
        isExporting: clampedP >= 0,
        idcAmps: idc,
        lossMW: totalLossMw,
        efficiencyPct: clampedP !== 0 ? Math.max(90, 100 - (totalLossMw / Math.abs(clampedP)) * 100) : 99.1
      };

      realtimeSync.broadcast({
        type: 'HVDC_SETPOINT',
        hvdcData: updated
      });

      return updated;
    });

    addAuditLog('SETTINGS', `HVDC Dispatch Setpoints Updated: P=${pMW.toFixed(1)}MW, Q=${qMVAR.toFixed(1)}MVAR${mode ? ` [${mode}]` : ''}`);
  }, [addAuditLog]);

  const setHvdcControlMode = useCallback((mode: HvdcControlMode) => {
    setHvdcState((prev) => {
      const updated: HvdcTelemetry = {
        ...prev,
        controlMode: mode
      };
      realtimeSync.broadcast({
        type: 'HVDC_UPDATE',
        hvdcData: updated
      });
      return updated;
    });
    addAuditLog('SETTINGS', `HVDC Operational Control Mode changed to ${mode}`);
  }, [addAuditLog]);

  const setHvdcFault = useCallback((fault: HvdcFaultType) => {
    setHvdcState((prev) => {
      const isFault = fault !== 'NONE';
      const isTrip = fault === 'DC_POLE_TO_GROUND' || fault === 'DC_POLE_TO_POLE';
      const isBlock = isFault;

      const updated: HvdcTelemetry = {
        ...prev,
        faultState: fault,
        converterBlocked: isBlock,
        dccbTripped: isTrip,
        isLvrtActive: fault === 'AC_VOLTAGE_SAG',
        activePowerMW: isFault ? 0 : prev.pRefMW,
        reactivePowerMVAR: isFault && fault === 'AC_VOLTAGE_SAG' ? 80 : isFault ? 0 : prev.qRefMVAR,
        idcAmps: isFault ? 0 : (Math.abs(prev.pRefMW) * 1e6) / 640000,
        valveJunctionTempC: fault === 'VALVE_OVERTEMP' ? 132.5 : 68.4,
        coolantFlowRatePct: fault === 'COOLANT_LOW_FLOW' ? 42.0 : 98.4
      };

      if (fault === 'DC_POLE_TO_GROUND') {
        triggerAlarm('HVDC-1', 'DCCB Ultra-Fast Trip Relay', 'CRITICAL: DC Positive Pole-to-Ground Fault Detected! DCCBs Tripped (<5ms)', 'critical');
      } else if (fault === 'DC_POLE_TO_POLE') {
        triggerAlarm('HVDC-1', 'MMC Capacitor Protection', 'CRITICAL: DC Pole-to-Pole Short Circuit! Firing Pulses Blocked & AC Breaker Tripped', 'critical');
      } else if (fault === 'VALVE_OVERTEMP') {
        triggerAlarm('HVDC-1', 'IGBT Thermal Watchdog', 'MAJOR: Converter Valve Junction Temperature Exceeded 125°C Limit', 'major');
      } else if (fault === 'COOLANT_LOW_FLOW') {
        triggerAlarm('HVDC-1', 'Cooling System Watchdog', 'MAJOR: Deionized Coolant Flow Rate Dropped Below 80% Threshold', 'major');
      } else if (fault === 'AC_VOLTAGE_SAG') {
        triggerAlarm('HVDC-1', 'LVRT Fast Controller', 'INFO: AC Voltage Sag Detected - Dynamic STATCOM Reactive Support Injected', 'info');
      }

      realtimeSync.broadcast({
        type: 'HVDC_UPDATE',
        hvdcData: updated
      });
      return updated;
    });
  }, [triggerAlarm]);

  const tripHvdcDccb = useCallback(() => {
    setHvdcState((prev) => {
      const updated: HvdcTelemetry = {
        ...prev,
        dccbTripped: true,
        converterBlocked: true,
        activePowerMW: 0,
        reactivePowerMVAR: 0,
        idcAmps: 0
      };
      realtimeSync.broadcast({
        type: 'HVDC_UPDATE',
        hvdcData: updated
      });
      return updated;
    });
    triggerAlarm('HVDC-1', 'High-Speed DCCB 52-DC', 'Manual DCCB Trip Dispatched: DC Transmission Link Isolated', 'major');
    addAuditLog('SWITCHING', 'Manual DCCB High-Speed Trip Command Executed');
  }, [triggerAlarm, addAuditLog]);

  const resetHvdcProtection = useCallback(() => {
    setHvdcState((prev) => {
      const updated: HvdcTelemetry = {
        ...prev,
        faultState: 'NONE',
        dccbTripped: false,
        converterBlocked: false,
        isLvrtActive: false,
        valveJunctionTempC: 68.4,
        coolantFlowRatePct: 98.4,
        activePowerMW: prev.pRefMW,
        reactivePowerMVAR: prev.qRefMVAR,
        idcAmps: (Math.abs(prev.pRefMW) * 1e6) / 640000
      };
      realtimeSync.broadcast({
        type: 'HVDC_UPDATE',
        hvdcData: updated
      });
      return updated;
    });
    addAuditLog('FAULT_INJECT', 'HVDC Protection Lockout Reset & Re-armed');
  }, [addAuditLog]);

  // Switch Control with Interlocking
  const toggleSwitch = (trId: 'TR-1' | 'TR-2', switchKey: keyof SwitchgearState): { success: boolean; message: string } => {
    if (currentUserRole === 'operator') {
      setCurrentUserRole('engineer');
      setCurrentUserNameState('Eng. Essa Najjar [ENGINEER]');
      addAuditLog('SYSTEM', 'Role elevated to Engineer for switch operation');
    }

    if (maintenanceMode && !switchKey.startsWith('earthSwitch')) {
      return { success: false, message: 'MAINTENANCE MODE ACTIVE: Switching breakers/disconnectors is prohibited during LOTO maintenance.' };
    }

    const lock = isDeviceLocked(trId, switchKey);
    if (lock) {
      return { success: false, message: `DEVICE LOCKED BY ${lock.lockedBy} [${lock.userRole.toUpperCase()}]. Exclusive LOTO / Operation lock engaged.` };
    }

    const state = trId === 'TR-1' ? tr1State : tr2State;
    const currentSw = state.switches;
    const targetVal = !currentSw[switchKey];

    // Interlocking Rules:
    // Rule 1: HV Disconnectors cannot open/close while HV Breaker is CLOSED
    if ((switchKey === 'hvDisconnect89_1A' || switchKey === 'hvDisconnect89_1B') && currentSw.hvBreaker52_1) {
      return { success: false, message: 'INTERLOCK BLOCKED: Cannot operate HV Disconnector 89-1 while HV Breaker 52-1 is CLOSED.' };
    }
    if ((switchKey === 'hvDisconnect89_2A' || switchKey === 'hvDisconnect89_2B') && currentSw.hvBreaker52_4) {
      return { success: false, message: 'INTERLOCK BLOCKED: Cannot operate HV Disconnector 89-2 while HV Breaker 52-4 is CLOSED.' };
    }
    if ((switchKey === 'hvDisconnect89_HVDC_A' || switchKey === 'hvDisconnect89_HVDC_B') && currentSw.hvBreaker52_HVDC) {
      return { success: false, message: 'INTERLOCK BLOCKED: Cannot operate HVDC Disconnector 89-HVDC while AC Infeed Breaker 52-HVDC is CLOSED.' };
    }

    // Rule 2: MV Disconnector cannot operate while MV Breaker is CLOSED
    if (switchKey === 'mvDisconnect89_2' && currentSw.mvBreaker52_2) {
      return { success: false, message: 'INTERLOCK BLOCKED: Cannot operate MV Disconnector 89-2 while MV Breaker 52-2 is CLOSED.' };
    }
    if (switchKey === 'mvDisconnect89_5' && currentSw.mvBreaker52_5) {
      return { success: false, message: 'INTERLOCK BLOCKED: Cannot operate MV Disconnector 89-5 while MV Breaker 52-5 is CLOSED.' };
    }

    // Rule 3: Earth switch cannot CLOSE unless corresponding Disconnector/Breaker is OPEN
    if (switchKey === 'earthSwitch84_1' && targetVal && currentSw.mvDisconnect89_2) {
      return { success: false, message: 'SAFETY INTERLOCK BLOCKED: Cannot close Earth Switch 84-1 while MV Disconnector 89-2 is CLOSED!' };
    }
    if (switchKey === 'earthSwitch84_2' && targetVal && currentSw.mvDisconnect89_5) {
      return { success: false, message: 'SAFETY INTERLOCK BLOCKED: Cannot close Earth Switch 84-2 while MV Disconnector 89-5 is CLOSED!' };
    }
    if ((switchKey === 'dcEarth89_DCE1' || switchKey === 'dcEarth89_DCE2') && targetVal && (currentSw.dccbPositive52_DC1 || currentSw.dccbNegative52_DC2 || currentSw.hvBreaker52_HVDC)) {
      return { success: false, message: 'SAFETY INTERLOCK BLOCKED: Cannot close DC Earth Switch while DC Link is Energized or Breakers Closed!' };
    }
    if (switchKey === 'dccbPositive52_DC1' && targetVal && currentSw.dcEarth89_DCE1) {
      return { success: false, message: 'SAFETY INTERLOCK BLOCKED: Cannot close DCCB 52-DC+ while Positive Pole Earth Switch 89-DCE1 is CLOSED!' };
    }
    if (switchKey === 'dccbNegative52_DC2' && targetVal && currentSw.dcEarth89_DCE2) {
      return { success: false, message: 'SAFETY INTERLOCK BLOCKED: Cannot close DCCB 52-DC- while Negative Pole Earth Switch 89-DCE2 is CLOSED!' };
    }

    // Rule 4: If Earth switch closes while bus is energized, trigger immediate TRIP
    const isBusLive = trId === 'TR-1'
      ? (currentSw.hvBreaker52_1 && currentSw.mvBreaker52_2)
      : (currentSw.hvBreaker52_4 && currentSw.mvBreaker52_5);
    const isEarthCloseOnLive = (switchKey === 'earthSwitch84_1' || switchKey === 'earthSwitch84_2') && targetVal && isBusLive;

    if (isEarthCloseOnLive) {
      triggerAlarm(trId, 'ANSI 50/51 Protection Relay', 'EARTH SWITCH CLOSED ON LIVE BUS! INSTANTANEOUS TRIP EXECUTED', 'critical');
      soundEngine.playBreakerTrip();
    } else if (String(switchKey).toLowerCase().includes('breaker')) {
      soundEngine.playBreakerTrip();
    } else {
      soundEngine.playSwitchClick();
    }

    const updater = (prev: TransformerTelemetry) => {
      const updatedSwitches = {
        ...prev.switches,
        [switchKey]: targetVal,
      };
      if (isEarthCloseOnLive) {
        if (trId === 'TR-1') {
          updatedSwitches.hvBreaker52_1 = false;
          updatedSwitches.mvBreaker52_2 = false;
        } else {
          updatedSwitches.hvBreaker52_4 = false;
          updatedSwitches.mvBreaker52_5 = false;
        }
      }
      return {
        ...prev,
        switches: updatedSwitches,
      };
    };

    if (trId === 'TR-1') setTr1State(updater);
    else setTr2State(updater);

    // Lock device for 4000ms
    const deviceKey = `${trId}:${switchKey}`;
    const lockExpiry = Date.now() + 4000;
    setLockedDevices((prev) => ({
      ...prev,
      [deviceKey]: {
        deviceKey,
        lockedBy: currentUserName,
        userRole: currentUserRole,
        lockExpiry,
      },
    }));

    realtimeSync.broadcast({
      type: 'SWITCH_OPERATION',
      trId,
      switchKey,
      newState: targetVal,
    });
    realtimeSync.broadcast({
      type: 'DEVICE_LOCK',
      deviceKey,
      lockExpiry,
    });

    const actionText = `${targetVal ? 'CLOSED' : 'OPENED'} switch ${switchKey} on ${trId}`;
    addAuditLog('SWITCHING', actionText);
    addSoeEvent(actionText, trId, String(switchKey), 'INFO');
    return { success: true, message: actionText };
  };

  const changeTap = (trId: 'TR-1' | 'TR-2', direction: 'UP' | 'DOWN') => {
    if (currentUserRole === 'operator') {
      setCurrentUserRole('engineer');
      setCurrentUserNameState('Eng. Essa Najjar [ENGINEER]');
    }
    const updater = (prev: TransformerTelemetry) => {
      const newPos = direction === 'UP' ? Math.min(17, prev.tapPosition + 1) : Math.max(1, prev.tapPosition - 1);
      return {
        ...prev,
        tapPosition: newPos,
        tapOps: prev.tapOps + 1,
      };
    };
    if (trId === 'TR-1') setTr1State(updater);
    else setTr2State(updater);
    addAuditLog('TAP_CHANGE', `Stepped OLTC ${direction} on ${trId}`);
    realtimeSync.broadcast({
      type: 'TAP_CHANGE',
      trId,
      tapDirection: direction,
    });
  };

  const setTapMode = (trId: 'TR-1' | 'TR-2', mode: 'AUTO' | 'MANUAL') => {
    if (currentUserRole === 'operator') {
      setCurrentUserRole('engineer');
      setCurrentUserNameState('Eng. Essa Najjar [ENGINEER]');
    }
    const updater = (prev: TransformerTelemetry) => ({ ...prev, tapMode: mode });
    if (trId === 'TR-1') setTr1State(updater);
    else setTr2State(updater);
    addAuditLog('TAP_CHANGE', `Set OLTC Mode to ${mode} on ${trId}`);
    realtimeSync.broadcast({
      type: 'TAP_CHANGE',
      trId,
      tapMode: mode,
    });
  };

  const injectFault = (faultType: 'SLG' | 'OVER_TEMP' | 'BUCHHOLZ' | 'OPEN_CT' | 'CLEAR') => {
    if (faultType === 'CLEAR') {
      soundEngine.playSwitchClick();
    } else {
      soundEngine.playArcFaultZap();
    }

    const updater = (prev: TransformerTelemetry): TransformerTelemetry => {
      if (faultType === 'CLEAR') {
        return {
          ...prev,
          loadCurrent: 420.0,
          oilTemp: 62.4,
          windingTemp: 71.8,
          faults: {
            lgFault: false,
            overTemp: false,
            buchholz: false,
            ctOpen: false,
            underVoltage: false,
            overVoltage: false,
            overCurrent: false,
          },
        };
      }
      return {
        ...prev,
        loadCurrent: faultType === 'SLG' ? 680.0 : prev.loadCurrent,
        oilTemp: faultType === 'OVER_TEMP' ? 95.5 : prev.oilTemp,
        windingTemp: faultType === 'OVER_TEMP' ? 108.2 : prev.windingTemp,
        faults: {
          ...prev.faults,
          lgFault: faultType === 'SLG' ? true : prev.faults.lgFault,
          overTemp: faultType === 'OVER_TEMP' ? true : prev.faults.overTemp,
          buchholz: faultType === 'BUCHHOLZ' ? true : prev.faults.buchholz,
          ctOpen: faultType === 'OPEN_CT' ? true : prev.faults.ctOpen,
        },
      };
    };

    setTr1State(updater);
    setTr2State(updater);

    if (faultType === 'SLG') {
      triggerAlarm(activeTr, 'ANSI 50N Earth Fault Relay', 'Phase A Single Line-to-Ground Fault Detected!', 'critical');
      addAuditLog('FAULT_INJECT', 'Injected Single Line-to-Ground Fault');
    } else if (faultType === 'OVER_TEMP') {
      triggerAlarm(activeTr, 'ANSI 49 Winding Temp Relay', 'Severe Thermal Overload! Hotspot > 105°C', 'critical');
      addAuditLog('FAULT_INJECT', 'Injected Over-Temperature Thermal Fault');
    } else if (faultType === 'BUCHHOLZ') {
      triggerAlarm(activeTr, 'ANSI 63 Buchholz Relay', 'Gas Accumulation Detected in Main Tank Diverter', 'major');
      addAuditLog('FAULT_INJECT', 'Injected Buchholz Gas Accumulation Fault');
    } else if (faultType === 'OPEN_CT') {
      triggerAlarm(activeTr, 'CT Protection Supervisory', 'HAZARD: Open Circuit Detected on CT-1 Secondary Winding!', 'critical');
      addAuditLog('FAULT_INJECT', 'Injected Open CT Secondary Hazard');
    } else if (faultType === 'CLEAR') {
      addAuditLog('FAULT_INJECT', 'Cleared All Substation Fault Conditions');
    }

    realtimeSync.broadcast({
      type: 'FAULT_INJECTION',
      faultType,
    });
  };

  // 3. Operator Training Simulator (OTS) Control Functions
  const startOtsScenario = useCallback((scenarioId: OTSScenarioId) => {
    setOtsScenarioId(scenarioId);
    setOtsStatus('running');
    setOtsTimerSec(0);
    setOtsReport(null);

    addAuditLog('SYSTEM', `OTS Emergency Drill Started: ${scenarioId}`);
    addSoeEvent(`OTS Drill Initiated: ${scenarioId}`, 'Substation Simulator', 'OTS Controller', 'MAJOR', true);

    if (scenarioId === 'SCENARIO_1') {
      injectFault('SLG');
    } else if (scenarioId === 'SCENARIO_2') {
      injectFault('OVER_TEMP');
    } else if (scenarioId === 'SCENARIO_3') {
      injectFault('BUCHHOLZ');
    }

    realtimeSync.broadcast({
      type: 'OTS_SCENARIO',
      otsState: { action: 'START', scenarioId, otsStatus: 'running' }
    });
  }, [addAuditLog, addSoeEvent, injectFault]);

  const stopOtsScenario = useCallback(() => {
    setOtsStatus('idle');
    setOtsScenarioId(null);
    injectFault('CLEAR');

    realtimeSync.broadcast({
      type: 'OTS_SCENARIO',
      otsState: { action: 'STOP', otsStatus: 'idle' }
    });
  }, [injectFault]);

  const completeOtsScenario = useCallback(() => {
    setOtsStatus('completed');

    let score = 100;
    score -= Math.min(30, otsTimerSec * 0.5);
    score -= otsInterlockViolations * 20;
    score = Math.max(0, Math.round(score));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'F' = 'A+';
    if (score < 60) grade = 'F';
    else if (score < 75) grade = 'C';
    else if (score < 85) grade = 'B';
    else if (score < 95) grade = 'A';

    const report: OTSReport = {
      scenarioId: otsScenarioId || 'SCENARIO_1',
      scenarioTitle: otsScenarioId === 'SCENARIO_1'
        ? 'Cascading Feeder Short-Circuit with Breaker 52-2 Failure'
        : otsScenarioId === 'SCENARIO_2'
        ? 'Severe Winding Thermal Overload with Cooling Fan Failure'
        : 'Bushing Dielectric Breakdown & Gas Accumulation',
      traineeName: currentUserName,
      traineeRole: currentUserRole,
      responseTimeSec: otsTimerSec,
      interlockViolations: otsInterlockViolations,
      wrongSequenceCount: 0,
      restorationScore: score,
      grade,
      debriefComments: [
        `Completed emergency isolation drill in ${otsTimerSec}s.`,
        `Safety interlock violations: ${otsInterlockViolations}.`,
        score >= 85 ? 'Excellent grid restoration & safety compliance.' : 'Review interlock protocol and repeat drill.'
      ],
      actionLog: [
        { timestamp: new Date().toLocaleTimeString(), action: 'Fault Trigger Acknowledged & Breaker Tripped' }
      ],
      completedAt: new Date().toLocaleTimeString()
    };

    setOtsReport(report);
    injectFault('CLEAR');

    realtimeSync.broadcast({
      type: 'OTS_SCENARIO',
      otsState: { action: 'COMPLETE', otsStatus: 'completed', otsReport: report }
    });
  }, [otsScenarioId, currentUserName, currentUserRole, otsTimerSec, otsInterlockViolations, injectFault]);

  useEffect(() => {
    let interval: any = null;
    if (otsStatus === 'running') {
      interval = setInterval(() => {
        setOtsTimerSec((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otsStatus]);

  // Main Simulation Loop
  useEffect(() => {
    const timer = setInterval(() => {
      const remoteFrame = remoteTelemetryRef.current;
      const remoteIsFresh =
        remoteFrame !== null && Date.now() - lastRemoteTelemetryAtRef.current < REMOTE_TELEMETRY_STALE_MS;
      // Leader ticks simulate and publish; followers mirror the frame. If the
      // leader goes silent (closed tab / lost link) a follower temporarily takes
      // over so the readings keep moving and the rest re-converge on it.
      const simulateLocally = isSimLeaderRef.current || !remoteIsFresh;

      if (!simulateLocally && remoteFrame) {
        tr1StateRef.current = remoteFrame.tr1;
        tr2StateRef.current = remoteFrame.tr2;
        bessStateRef.current = remoteFrame.bess;
        hvdcStateRef.current = remoteFrame.hvdc;
        setTr1State(remoteFrame.tr1);
        setTr2State(remoteFrame.tr2);
        setBessState(remoteFrame.bess);
        setHvdcState(remoteFrame.hvdc);

        // Keep alarm evaluation and trend history consistent with the leader.
        for (const trTelemetry of [remoteFrame.tr1, remoteFrame.tr2]) {
          for (const finding of evaluateTelemetryAlarms(
            {
              asset: trTelemetry.id,
              gridVoltageKV: trTelemetry.gridVoltage,
              loadCurrentA: trTelemetry.loadCurrent,
              oilTempC: trTelemetry.oilTemp,
              windingTempC: trTelemetry.windingTemp,
            },
            thresholds
          )) {
            triggerAlarm(trTelemetry.id, finding.device, finding.message, finding.severity);
          }
        }

        const followed = activeTrRef.current === 'TR-1' ? remoteFrame.tr1 : remoteFrame.tr2;
        setHistory((prevHist) => [
          ...prevHist.slice(-200),
          {
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            voltage: followed.gridVoltage,
            current: followed.loadCurrent,
            activePower: followed.activePower / 1000,
            oilTemp: followed.oilTemp,
            windingTemp: followed.windingTemp,
            thd: followed.thd,
          },
        ]);
        return;
      }

      const updateTelemetry = (prev: TransformerTelemetry): TransformerTelemetry => {
        let current = prev.loadCurrent;
        let gridV = prev.gridVoltage;
        let oilT = prev.oilTemp;
        let thdVal = prev.thd;
        let oilLvl = prev.oilLevel1;

        if (simMode === 'AUTO') {
          // Dynamic small sinusoidal / random fluctuations
          const noiseI = (Math.random() - 0.5) * 4.0;
          const noiseV = (Math.random() - 0.5) * 0.4;
          current = Math.max(0, Math.min(600, current + noiseI));
          gridV = Math.max(100, Math.min(150, gridV + noiseV));

          // Thermal equations based on current
          const loadRatio = current / 600;
          const targetOilT = prev.ambientTemp + 20 + loadRatio * 35;
          oilT = oilT + (targetOilT - oilT) * 0.05;
        } else {
          // Manual values override
          current = manualValues.loadCurrent;
          gridV = manualValues.gridVoltage;
          oilT = manualValues.oilTemp;
          thdVal = manualValues.thd;
          oilLvl = manualValues.oilLevel1;
        }

        // Apply Fault Effects
        if (prev.faults.lgFault) {
          current = 580.0; // High fault current
        }
        if (prev.faults.overTemp) {
          oilT = Math.max(oilT, 92.0);
        }

        const windingT = oilT + (current / 600) * 12.0;
        const bushingT = oilT * 0.85;

        // Fan & Pump Hysteretic Controls
        const fan1 = oilT > 65 ? true : oilT < 56 ? false : prev.fans.fan1;
        const fan2 = oilT > 75 ? true : oilT < 66 ? false : prev.fans.fan2;
        const pump1 = true;
        const pump2 = oilT > 84 ? true : oilT < 74 ? false : prev.fans.pump2;

        const coolingLoad = (fan1 ? 30 : 0) + (fan2 ? 40 : 0) + (pump2 ? 30 : 0);

        // Electrical Calculations
        const safeRatioVal = Math.max(1, prev.ctRatioVal || (prev.primaryRatio ? prev.primaryRatio / 5 : 24));
        const ctSecA = prev.faults.ctOpen ? 0 : current / safeRatioVal;
        const ctSecB = current / safeRatioVal;
        const ctSecC = current / safeRatioVal;

        const isConnected =
          prev.id === 'TR-2'
            ? prev.switches.hvBreaker52_4 && prev.switches.mvBreaker52_5
            : prev.switches.hvBreaker52_1 && prev.switches.mvBreaker52_2;
        const actualCurrent = isConnected ? current : 0;
        if (prev.id === activeTrRef.current) {
          soundEngine.updateHum((actualCurrent / 600) * 100);
        }

        const lineV_V = gridV * 1000;
        const apparentS = Math.sqrt(3) * lineV_V * actualCurrent; // VA
        const clampedPf = Math.max(-1.0, Math.min(1.0, prev.pf ?? 0.85));
        const activeP = (apparentS * clampedPf) / 1000; // kW
        const reactiveQ = (apparentS * Math.sqrt(Math.max(0, 1 - clampedPf * clampedPf))) / 1000; // kVar
        const apparentS_kVA = apparentS / 1000; // kVA

        // Check Alarm Thresholds (pure evaluator, ISA-18.2 suppressed at engine level)
        for (const finding of evaluateTelemetryAlarms(
          { asset: prev.id, gridVoltageKV: gridV, loadCurrentA: actualCurrent, oilTempC: oilT, windingTempC: windingT },
          thresholds
        )) {
          triggerAlarm(prev.id, finding.device, finding.message, finding.severity);
        }

        // Energy increment
        const timeHours = scanRateMs / 3600000;
        const fwdEnergyInc = activeP * timeHours;

        return {
          ...prev,
          loadCurrent: actualCurrent,
          gridVoltage: gridV,
          phaseA_Voltage: (gridV / Math.sqrt(3)),
          phaseB_Voltage: (gridV / Math.sqrt(3)),
          phaseC_Voltage: (gridV / Math.sqrt(3)),
          ctSecA,
          ctSecB,
          ctSecC,
          oilTemp: oilT,
          windingTemp: windingT,
          bushingTemp: bushingT,
          coolingLoad,
          oilLevel1: oilLvl,
          activePower: activeP,
          reactivePower: reactiveQ,
          apparentPower: apparentS_kVA,
          fwdEnergy: prev.fwdEnergy + fwdEnergyInc,
          thd: thdVal,
          fans: { fan1, fan2, pump1, pump2 },
        };
      };

      setTr1State((prev) => {
        const next = updateTelemetry(prev);
        tr1StateRef.current = next;
        return next;
      });
      setTr2State((prev) => {
        const next = updateTelemetry(prev);
        tr2StateRef.current = next;
        return next;
      });

      // Append to rolling history using freshly computed telemetry
      setHistory((prevHist) => {
        const target = activeTrRef.current === 'TR-1' ? tr1StateRef.current : tr2StateRef.current;
        const point: TelemetryHistoryPoint = {
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          voltage: target.gridVoltage,
          current: target.loadCurrent,
          activePower: target.activePower / 1000, // MW
          oilTemp: target.oilTemp,
          windingTemp: target.windingTemp,
          thd: target.thd,
        };
        return [...prevHist.slice(-200), point];
      });

      // Live BESS Automatic Dispatch & SOC Evolution
      setBessState((prevBess) => {
        const commitBess = (nextBess: BessState): BessState => {
          bessStateRef.current = nextBess;
          return nextBess;
        };
        const totalSubstationMW = (tr1StateRef.current.activePower + tr2StateRef.current.activePower) / 1000.0;
        let pMW = prevBess.powerMW;
        let status = prevBess.statusText;

        if (prevBess.dispatchMode === 'AUTO') {
          if (totalSubstationMW > 42.5) {
            pMW = Math.min(prevBess.maxPowerMW, 6.0 + (totalSubstationMW - 42.5) * 0.8);
            status = `⚡ AI PEAK SHAVING: Injecting +${pMW.toFixed(1)} MW (Substation Load: ${totalSubstationMW.toFixed(1)} MW)`;
          } else if (totalSubstationMW < 20.0 && prevBess.socPct < 95.0) {
            pMW = -4.5;
            status = `🔌 AI OFF-PEAK CHARGING: Drawing -4.5 MW from Grid (Substation Load: ${totalSubstationMW.toFixed(1)} MW)`;
          } else {
            pMW = 0.0;
            status = `⏸️ AI DISPATCH STANDBY: Substation Load Nominal (${totalSubstationMW.toFixed(1)} MW)`;
          }
        }

        // SOC evolution based on active power
        const deltaMWhPct = (pMW / 40.0) * (scanRateMs / 3600000) * 100.0 * (pMW >= 0 ? 0.95 : 1.05);
        const newSoc = Math.max(5.0, Math.min(98.0, prevBess.socPct + deltaMWhPct));

        return commitBess({
          ...prevBess,
          powerMW: Number(pMW.toFixed(1)),
          socPct: Number(newSoc.toFixed(2)),
          statusText: status,
        });
      });

      // Live VSC-HVDC Transmission Bay & Intertie Link Dynamics (IEC 62501 / CIGRE B4)
      setHvdcState((prevHvdc) => {
        const commitHvdc = (nextHvdc: HvdcTelemetry): HvdcTelemetry => {
          hvdcStateRef.current = nextHvdc;
          return nextHvdc;
        };
        const sw = tr1StateRef.current.switches;
        const isAcConnected = sw.hvBreaker52_HVDC && (sw.hvDisconnect89_HVDC_A || sw.hvDisconnect89_HVDC_B);
        const isDcConnected = sw.dccbPositive52_DC1 && sw.dccbNegative52_DC2 && !sw.dcEarth89_DCE1 && !sw.dcEarth89_DCE2;
        const isFullyEnergized = isAcConnected && isDcConnected && !prevHvdc.converterBlocked && !prevHvdc.dccbTripped && prevHvdc.faultState === 'NONE';

        // Frequency Droop Delta: Delta P = (f_nom - f_actual) / (f_nom * Droop) * P_rated
        const currentFreq = tr1StateRef.current.frequency || 50.0;
        const freqDeviation = 50.0 - currentFreq;
        const droopGainMwPerHz = (prevHvdc.nominalMva * 0.9) / (50.0 * (prevHvdc.frequencyDroopGainPct / 100.0));
        const syntheticInertiaP = isFullyEnergized ? freqDeviation * droopGainMwPerHz : 0;

        let liveP = isFullyEnergized ? prevHvdc.pRefMW + syntheticInertiaP : 0;
        let liveQ = isFullyEnergized ? prevHvdc.qRefMVAR : 0;

        if (prevHvdc.controlMode === 'STATCOM') {
          liveP = 0; // zero active transfer, purely dynamic reactive voltage regulation
        } else if (prevHvdc.controlMode === 'GRID_FORMING_VF') {
          liveP = 45.0; // grid forming source supplying 45MW reference load
          liveQ = 12.0;
        }

        // Modulation index Ma based on AC/DC voltage ratio
        const vdcTotal = isFullyEnergized ? 640.0 + (Math.random() - 0.5) * 1.5 : 0.0;
        const vacPcc = tr1StateRef.current.gridVoltage || 132.0;
        const targetMa = Math.min(0.98, Math.max(0.75, (vacPcc * Math.sqrt(2) * 1.15) / (vdcTotal || 640)));

        const idc = isFullyEnergized ? (Math.abs(liveP) * 1e6) / (vdcTotal * 1e3 || 640000) : 0;
        const copperLossWatts = 2 * Math.pow(idc, 2) * (0.015 * prevHvdc.lineLengthKm);
        const converterLossWatts = isFullyEnergized ? Math.abs(liveP) * 1e6 * 0.009 : 200000;
        const totalLossMw = (copperLossWatts + converterLossWatts) / 1e6;

        // Dynamic Valve Junction & Coolant Temperatures
        const targetJunctionT = 40.0 + (Math.abs(liveP) / 200.0) * 38.0 + (Math.random() - 0.5) * 0.6;
        const nextJunctionT = prevHvdc.faultState === 'VALVE_OVERTEMP' ? 132.5 : prevHvdc.valveJunctionTempC + (targetJunctionT - prevHvdc.valveJunctionTempC) * 0.1;
        const nextCoolantT = 32.0 + (Math.abs(liveP) / 200.0) * 8.5;

        const appMva = Math.sqrt(liveP * liveP + liveQ * liveQ);
        const pf = appMva > 0 ? Math.abs(liveP) / appMva : 1.0;

        return commitHvdc({
          ...prevHvdc,
          activePowerMW: Number(liveP.toFixed(1)),
          reactivePowerMVAR: Number(liveQ.toFixed(1)),
          apparentPowerMVA: Number(appMva.toFixed(1)),
          powerFactor: Number(pf.toFixed(2)),
          isExporting: liveP >= 0,
          vdcPositiveKV: isFullyEnergized ? 320.0 + (Math.random() - 0.5) * 0.8 : 0.0,
          vdcNegativeKV: isFullyEnergized ? -320.0 - (Math.random() - 0.5) * 0.8 : 0.0,
          vdcTotalKV: Number(vdcTotal.toFixed(1)),
          idcAmps: Number(idc.toFixed(1)),
          modulationIndexMa: Number(targetMa.toFixed(3)),
          firingAngleAlphaDeg: Number((10.0 + (1 - targetMa) * 20.0).toFixed(1)),
          valveJunctionTempC: Number(nextJunctionT.toFixed(1)),
          coolantTempC: Number(nextCoolantT.toFixed(1)),
          lossMW: Number(totalLossMw.toFixed(2)),
          efficiencyPct: liveP !== 0 ? Math.max(90.0, Math.min(99.4, 100 - (totalLossMw / Math.abs(liveP)) * 100)) : 99.1
        });
      });

      // The authoritative workstation publishes this tick's frame so every
      // other workstation (other tabs, other machines) shows the same numbers.
      if (simulateLocally) {
        realtimeSync.broadcast({
          type: 'TELEMETRY_SYNC',
          telemetry: {
            tr1: tr1StateRef.current,
            tr2: tr2StateRef.current,
            bess: bessStateRef.current,
            hvdc: hvdcStateRef.current,
            sentAt: Date.now(),
          },
        });
      }
    }, scanRateMs);

    return () => clearInterval(timer);
  }, [simMode, scanRateMs, manualValues, thresholds, triggerAlarm]);

  const activeTelemetry = activeTr === 'TR-1' ? tr1State : tr2State;
  // Late-join snapshots: reply to newly seen workstations and refresh the
  // server-side cache so any workstation joining mid-session converges.
  const knownPeersRef = useRef<Set<string>>(new Set());
  const lastSnapshotSentRef = useRef<number>(0);
  useEffect(() => {
    const sendSnapshot = () => {
      const now = Date.now();
      if (now - lastSnapshotSentRef.current < 4000) return;
      lastSnapshotSentRef.current = now;
      realtimeSync.broadcast({
        type: 'FULL_STATE_SYNC',
        snapshot: {
          tr1Switches: tr1StateRef.current.switches,
          tr2Switches: tr2StateRef.current.switches,
          simMode,
          manualValues,
          thresholds,
          maintenanceMode,
        },
      });
    };
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type !== 'PRESENCE_HEARTBEAT') return;
      if (!knownPeersRef.current.has(msg.senderWorkstationId)) {
        knownPeersRef.current.add(msg.senderWorkstationId);
        sendSnapshot();
      }
    });
    const seedTimer = setTimeout(sendSnapshot, 1500);
    const refreshTimer = setInterval(sendSnapshot, 15000);
    return () => {
      unsubscribe();
      clearTimeout(seedTimer);
      clearInterval(refreshTimer);
    };
  }, [manualValues, thresholds, maintenanceMode, simMode]);

  const contextValue = {
        lang,
        setLang,
        t,
        activeTr,
        setActiveTr,
        tr1State,
        tr2State,
        tr1Telemetry: tr1State,
        tr2Telemetry: tr2State,
        activeTelemetry,
        gridFrequency: activeTelemetry.frequency || 50.0,
        clearAllFaults: () => injectFault('CLEAR'),
        simMode,
        setSimMode,
        scanRateMs,
        setScanRateMs,
        currentUserRole,
        setCurrentUserRole,
        currentUserName,
        rbacLogin,
        alarms,
        acknowledgeAlarm,
        acknowledgeAllAlarms,
        auditLogs,
        addAuditLog,
        history,
        audioMuted,
        setAudioMuted,
        initializeAudioContext,
        sirenActive,
        activeUsers,
        lockedDevices,
        remoteToasts,
        dismissToast,
        isDeviceLocked,
        outdoorTheme,
        setOutdoorTheme,
        maintenanceMode,
        setMaintenanceMode,
        thresholds,
        updateThresholds,
        manualValues,
        setManualValue,
        toggleSwitch,
        changeTap,
        setTapMode,
        injectFault,
        setCtRatio,
        resetEnergyAccumulators,
        dgaData,
        setDgaData,
        soeEvents,
        addSoeEvent,
        clearSoeEvents,
        isSoeModalOpen,
        setSoeModalOpen,
        otsScenarioId,
        otsStatus,
        otsTimerSec,
        otsReport,
        startOtsScenario,
        stopOtsScenario,
        completeOtsScenario,
        bessState,
        setBessDispatchMode,
        setBessManualPower,
        hvdcState,
        setHvdcSetpoints,
        setHvdcControlMode,
        setHvdcFault,
        tripHvdcDccb,
        resetHvdcProtection,
        isArabic: lang === 'ar',
        isAr: lang === 'ar',
        triggerAlarm,
        addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => {
          addRemoteToast({
            operatorName: currentUserName || 'SCADA System',
            operatorRole: currentUserRole,
            actionTitle: title,
            actionDetails: message,
          });
        },
  };

  const stableContextValue = useShallowMemo(contextValue);

  return (
    <ScadaContext.Provider value={stableContextValue}>
      {children}
    </ScadaContext.Provider>
  );
};

export const useScada = () => {
  const context = useContext(ScadaContext);
  if (!context) {
    throw new Error('useScada must be used within a ScadaProvider');
  }
  return context;
};
