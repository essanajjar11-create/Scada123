/**
 * SCADA Instrument Transformers Monitoring System Types
 * Based on IEC 60076, IEC 61869-2/3, IEC 62271, ISA-18.2, IEEE C57.91
 */

export type UserRole = 'operator' | 'engineer' | 'manager';

export interface SwitchgearState {
  // HV 132kV Switchgear
  hvBreaker52_1: boolean;      // TR-1 HV Breaker 52-1
  hvDisconnect89_1A: boolean;  // TR-1 Bus-A Selector 89-1A
  hvDisconnect89_1B: boolean;  // TR-1 Bus-B Selector 89-1B
  hvBreaker52_4: boolean;      // TR-2 HV Breaker 52-4
  hvDisconnect89_2A: boolean;  // TR-2 Bus-A Selector 89-2A
  hvDisconnect89_2B: boolean;  // TR-2 Bus-B Selector 89-2B
  busCoupler52_0: boolean;     // 132kV Bus Coupler 52-0

  // MV 13.8kV Switchgear
  mvBreaker52_2: boolean;      // TR-1 MV Breaker 52-2
  mvDisconnect89_2: boolean;   // TR-1 MV Disconnector 89-2
  mvBreaker52_5: boolean;      // TR-2 MV Breaker 52-5
  mvDisconnect89_5: boolean;   // TR-2 MV Disconnector 89-5
  busSectionalizer52_6: boolean; // MV Bus Sectionalizer 52-6
  earthSwitch84_1: boolean;    // Section-1 Earth Switch 84-1
  earthSwitch84_2: boolean;    // Section-2 Earth Switch 84-2

  // Feeders
  feederCity52_7: boolean;     // City Feeder 01 CB
  feederInd52_8: boolean;      // Industrial Feeder 02 CB
  feederComm52_9: boolean;     // Commercial Feeder 03 CB
  feederBess52_B: boolean;     // BESS Battery CB
  tertiaryBreaker: boolean;    // Tertiary Feeder Breaker

  // 132kV / ±320kV VSC-HVDC Bay Switchgear
  hvBreaker52_HVDC: boolean;      // 132kV AC HVDC Infeed Breaker 52-HVDC
  hvDisconnect89_HVDC_A: boolean; // HVDC Bus-A Selector 89-HVDC-A
  hvDisconnect89_HVDC_B: boolean; // HVDC Bus-B Selector 89-HVDC-B
  pirBreaker52_PIR: boolean;      // Pre-Insertion Resistor (PIR) Soft-charge Breaker
  dccbPositive52_DC1: boolean;    // Positive Pole High-Speed DCCB 52-DC+
  dccbNegative52_DC2: boolean;    // Negative Pole High-Speed DCCB 52-DC-
  dcEarth89_DCE1: boolean;        // DC Positive Pole Earth Switch 89-DCE1
  dcEarth89_DCE2: boolean;        // DC Negative Pole Earth Switch 89-DCE2
}

export interface FanPumpState {
  fan1: boolean;   // Stage 1 Forced Air
  fan2: boolean;   // Stage 2 Peak Air
  pump1: boolean;  // Oil Pump 1
  pump2: boolean;  // Standby Oil Pump 2
}

export interface FaultFlags {
  lgFault: boolean;      // Phase A Single Line-to-Ground fault
  overTemp: boolean;     // Severe thermal overload
  buchholz: boolean;     // Buchholz gas accumulator relay trip
  ctOpen: boolean;       // CT secondary open circuit hazard
  underVoltage: boolean; // Grid undervoltage
  overVoltage: boolean;  // Grid overvoltage
  overCurrent: boolean;  // Transformer overcurrent
}

export interface TransformerTelemetry {
  id: 'TR-1' | 'TR-2';
  name: string;
  ratingMVA: number; // e.g. 50 MVA
  primarykV: number; // 132 kV
  secondarykV: number; // 13.8 kV

  // Live Electrical Readings
  loadCurrent: number;      // Amperes primary
  gridVoltage: number;      // Line-to-Line kV
  phaseA_Voltage: number;   // Line-to-Ground kV
  phaseB_Voltage: number;   // Line-to-Ground kV
  phaseC_Voltage: number;   // Line-to-Ground kV
  voltageUnbalance: number; // Percentage
  frequency: number;        // Hz (50.0)

  // Secondary CT Readings
  ctRatioVal: number;       // e.g. 120 (600/5A)
  primaryRatio: number;     // e.g. 600
  secondaryRatio: number;   // e.g. 5
  ctSecA: number;           // Amperes secondary Phase A
  ctSecB: number;           // Amperes secondary Phase B
  ctSecC: number;           // Amperes secondary Phase C
  ctBurdenVA: number;       // VA burden

  // Thermal Readings
  oilTemp: number;          // °C
  windingTemp: number;      // °C (Hot spot)
  bushingTemp: number;      // °C
  ambientTemp: number;      // °C
  coolingLoad: number;      // %

  // Conservator & OLTC
  oilLevel1: number;        // Main conservator %
  oilLevel2: number;        // OLTC conservator %
  tapPosition: number;      // 1 to 17
  tapOps: number;           // Counter
  tapMode: 'AUTO' | 'MANUAL';

  // Power & Energy
  activePower: number;      // kW
  reactivePower: number;    // kVar
  apparentPower: number;    // kVA
  pf: number;               // cos phi (0.0 to 1.0)
  isLagging: boolean;
  fwdEnergy: number;        // kWh
  revEnergy: number;        // kWh
  indEn: number;            // kVarh
  capEn: number;            // kVarh
  appEn: number;            // kVAh
  maxDemand: number;        // MWh
  thd: number;              // % Total Harmonic Distortion

  // Harmonics breakdown
  harmonics: {
    h1: number;
    h3: number;
    h5: number;
    h7: number;
    h9: number;
    h11: number;
    h13: number;
  };

  switches: SwitchgearState;
  fans: FanPumpState;
  faults: FaultFlags;

  // Optional extended telemetry (populated by WAMS / PV bridges when available)
  rocofHzPerSec?: number;
  solarActivePowerMw?: number;
}

export type AlarmSeverity = 'critical' | 'major' | 'minor' | 'info';
export type AlarmState = 'active_unacked' | 'active_acked' | 'cleared_unacked' | 'archived';

export interface AlarmItem {
  id: string;
  timestamp: string;
  asset: string;       // e.g. "TR-1", "HV CT-1", "MV Switchgear"
  device: string;      // e.g. "ANSI 50/51 Relay", "Buchholz 63"
  message: string;
  severity: AlarmSeverity;
  state: AlarmState;
  ackBy?: string;
  ackTimestamp?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  category:
    | 'SWITCHING'
    | 'TAP_CHANGE'
    | 'FAULT_INJECT'
    | 'SETTINGS'
    | 'ACK'
    | 'SYSTEM'
    | 'MAINTENANCE'
    | 'OPERATOR'
    | 'CYBER_ATTACK'
    | 'SECURITY'
    | 'CONTROL';
  description: string;
}

export interface DGAData {
  h2: number;   // PPM
  ch4: number;  // PPM
  c2h2: number; // PPM
  c2h4: number; // PPM
  c2h6: number; // PPM
  co: number;   // PPM
  co2: number;  // PPM
  generationRatePPMPerDay: number;
  moistureInOilPPM: number;
  bdvKV: number; // Breakdown voltage
}

export interface TelemetryHistoryPoint {
  time: string;
  timestamp: number;
  voltage: number;
  current: number;
  activePower: number;
  oilTemp: number;
  windingTemp: number;
  thd: number;
}

export interface AlarmThresholds {
  overVoltageKV: number;
  underVoltageKV: number;
  overCurrentA: number;
  oilTempHighC: number;
  windingTempHighC: number;
}

export interface ActiveUserPresence {
  workstationId: string;
  userName: string;
  userRole: UserRole;
  lastActiveTimestamp: number;
  isSelf?: boolean;
}

export interface LockedDevice {
  deviceKey: string; // e.g. "TR-1:hvBreaker52_1"
  lockedBy: string;  // e.g. "Eng. Essa Najjar"
  userRole: UserRole;
  lockExpiry: number; // timestamp ms
}

export interface RemoteToastNotification {
  id: string;
  timestamp: string;
  operatorName: string;
  operatorRole: UserRole;
  actionTitle: string;
  actionDetails: string;
}

// 1. High-Resolution Sequence of Events (SOE) Recorder
export interface SOEEvent {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:MM:SS.mmm
  timestampMs: number;
  relativeMs: number; // delta ms relative to initial fault trigger (+00.000 ms...)
  asset: string;
  device: string;
  eventText: string;
  isRootCause?: boolean;
  isCascaded?: boolean;
  severity: 'CRITICAL' | 'MAJOR' | 'INFO';
}

// 2. Comprehensive Asset Health Index (AHI)
export interface AssetHealthDetails {
  trId: 'TR-1' | 'TR-2';
  compositeScore: number; // 0 - 100%
  dgaScore: number; // 30% weight
  thermalLossOfLifeScore: number; // 25% weight
  moistureBdvScore: number; // 20% weight
  mechanicalOltcScore: number; // 25% weight
  statusCategory: 'GOOD' | 'MODERATE' | 'POOR';
  recommendation: string;
}

// 3. Operator Training Simulator (OTS) & Scenarios
export type OTSScenarioId = 'SCENARIO_1' | 'SCENARIO_2' | 'SCENARIO_3';

export interface OTSScenarioConfig {
  id: OTSScenarioId;
  title: string;
  subtitle: string;
  description: string;
  targetObjective: string;
}

export interface OTSReport {
  scenarioId: OTSScenarioId;
  scenarioTitle: string;
  traineeName: string;
  traineeRole: UserRole;
  responseTimeSec: number;
  interlockViolations: number;
  wrongSequenceCount: number;
  restorationScore: number; // 0 - 100%
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
  debriefComments: string[];
  actionLog: { timestamp: string; action: string; penalty?: number }[];
  completedAt: string;
}

// 4. BESS & Load Forecasting
export interface BessState {
  dispatchMode: 'AUTO' | 'MANUAL';
  socPct: number; // 0 - 100%
  powerMW: number; // + discharging (peak shaving), - charging (off-peak)
  capacityMWh: number; // 40 MWh
  maxPowerMW: number; // 10 MW
  statusText: string;
  rteEfficiencyPct?: number;
  fcrActive?: boolean;
  fcrResponseMW?: number;
  marketService?: 'PEAK_SHAVING' | 'FCR_FREQUENCY' | 'ENERGY_ARBITRAGE' | 'CAPACITY_RESERVE';
  stackedRevenueUSD?: number;
  cellTempC?: number;
  hvacPowerKW?: number;
  qLossPct?: number;
}

export interface ForecastPoint {
  hour: string; // "00:00", "01:00", ...
  hourNum: number;
  forecastMW: number;
  actualMW: number | null;
  bessContributionMW: number;
  pricePerMWh?: number;
}

// 5. IEC 61850 GOOSE & Sampled Values (SV) Types
export interface GooseMessage {
  id: string;
  appId: string;
  gocbRef: string;
  datSet: string;
  sqNum: number;
  stNum: number;
  timeString: string;
  timeEpochMs: number;
  confRev: number;
  ndsCom: boolean;
  numDatSetEntries: number;
  dataSummary: string;
  allData: { signal: string; value: boolean | string; quality: 'GOOD' | 'INVALID' | 'TEST' }[];
  latencyMs: number;
  quality: 'GOOD' | 'INVALID' | 'TEST';
  status: 'TRANSMITTING' | 'TRIPPED' | 'STANDBY';
  sourceIed: string;
  targetIeds: string[];
}

export interface SvStreamSample {
  sampleId: number;
  svId: string;
  smpCnt: number;
  smpSynch: 'GLOBAL_GPS' | 'LOCAL' | 'NONE';
  vA_kV: number;
  vB_kV: number;
  vC_kV: number;
  vN_kV: number;
  iA_A: number;
  iB_A: number;
  iC_A: number;
  iN_A: number;
  jitterUs: number;
  latencyUs: number;
}

export interface Iec61850PtpStatus {
  ptpGrandmasterId: string;
  clockClass: number;
  offsetToMasterNs: number;
  meanPathDelayNs: number;
  ptpState: 'LOCKED' | 'HOLDOVER' | 'UNLOCKED';
  packetsPerSec: number;
  gooseLostCount: number;
  svCorruptedCount: number;
}

// 6. Automated Switching Sequence Manager Types
export interface SwitchingStep {
  stepNo: number;
  device: string; // e.g. "52-1 (TR-1 HV Breaker)"
  deviceKey: string; // key in SwitchgearState
  targetAction: 'OPEN' | 'CLOSE' | 'EARTH' | 'UNEARTH' | 'RACK_IN' | 'RACK_OUT';
  description: string;
  interlockRule: string;
  isInterlockSatisfied: boolean;
  status: 'PENDING' | 'VERIFYING' | 'EXECUTED' | 'FAILED' | 'BLOCKED';
  requiresTwoMan: boolean;
  executedBy?: string;
  timestamp?: string;
}

export interface SwitchingOrder {
  id: string;
  title: string;
  category: 'ISOLATION' | 'BUSBAR_TRANSFER' | 'MAINTENANCE_LOTO' | 'RESTORATION';
  description: string;
  targetAsset: string;
  safetyWarning: string;
  steps: SwitchingStep[];
  status: 'DRAFT' | 'READY_FOR_EXECUTION' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
  author: string;
  approvedBy?: string;
}

// 7. Harmonic Distortion Spectrum & Power Quality (IEEE 519) Types
export interface HarmonicOrderData {
  order: number; // 1, 3, 5, 7 ... up to 50
  frequencyHz: number;
  voltagePct: number;
  currentPct: number;
  vMagKV: number;
  iMagA: number;
  ieeeLimitPct: number;
  isExceeded: boolean;
}

export interface CbemaEvent {
  id: string;
  timestamp: string;
  eventType: 'VOLTAGE_SAG' | 'VOLTAGE_SWELL' | 'TRANSIENT' | 'INTERRUPTION';
  durationMs: number;
  magnitudePct: number; // e.g. 72% for a sag, 135% for a swell
  classification: 'ACCEPTABLE' | 'NO_DAMAGE' | 'EQUIPMENT_TRIP';
  affectedPhase: 'A' | 'B' | 'C' | '3-PHASE';
}

export interface PowerQualityReport {
  thdVoltagePct: number;
  thdCurrentPct: number;
  kFactor: number;
  transformerDeratingFactorPct: number;
  crestFactor: number;
  voltageUnbalancePct: number;
  frequencyHz: number;
  cbemaEvents: CbemaEvent[];
}

// 8. Regional Grid Topology & AC Load Flow Types
export interface RegionalSubstationNode {
  id: string;
  name: string;
  code: string;
  type: 'SLACK_BUS' | 'PV_BUS' | 'PQ_BUS';
  nominalKV: number;
  voltageMagPU: number;
  voltageAngleDeg: number;
  genActiveMW: number;
  genReactiveMVar: number;
  loadActiveMW: number;
  loadReactiveMVar: number;
  status: 'ONLINE' | 'ISOLATED' | 'FAULTED';
  x: number; // coordinates for diagram
  y: number;
}

export interface RegionalTransmissionLine {
  id: string;
  name: string;
  fromBus: string;
  toBus: string;
  lengthKm: number;
  resistancePU: number;
  reactancePU: number;
  susceptancePU: number;
  flowActiveMW: number;
  flowReactiveMVar: number;
  lossesMW: number;
  mvaCapacity: number;
  loadingPct: number;
  isTripped: boolean;
}

export interface LoadFlowResult {
  converged: boolean;
  iterations: number;
  maxMismatch: number;
  totalGenMW: number;
  totalLoadMW: number;
  totalLossesMW: number;
  timestamp: string;
}

// 9. VSC-HVDC Transmission Link & Substation Bay Types (IEC 62501, IEC 62747, CIGRE B4)
export type HvdcControlMode =
  | 'CONST_P'           // Mode 1: Constant Active Power (MW)
  | 'CONST_VDC'         // Mode 2: Constant DC Voltage Link Slack (kV)
  | 'STATCOM'           // Mode 3: Dynamic STATCOM Reactive Support (MVAR)
  | 'GRID_FORMING_VF';  // Mode 4: Grid-Forming Black Start (V/f)

export type HvdcFaultType =
  | 'NONE'
  | 'DC_POLE_TO_GROUND'
  | 'DC_POLE_TO_POLE'
  | 'AC_VOLTAGE_SAG'
  | 'VALVE_OVERTEMP'
  | 'COOLANT_LOW_FLOW';

export interface HvdcSubmoduleStatus {
  id: number;
  arm: 'A_UPPER' | 'A_LOWER' | 'B_UPPER' | 'B_LOWER' | 'C_UPPER' | 'C_LOWER';
  index: number;
  status: 'HEALTHY' | 'BYPASSED' | 'WARNING';
  vcVolts: number;
  tempC: number;
}

export interface HvdcTelemetry {
  id: 'HVDC-1';
  name: string;
  nominalMva: number;        // 220 MVA rating
  nominalVdcKV: number;      // ±320 kV (640 kV pole-to-pole)
  nominalVacKV: number;      // 132 kV AC PCC

  // Real-time Power & Electrical
  activePowerMW: number;     // -200 MW (import) to +200 MW (export)
  reactivePowerMVAR: number; // -100 to +100 MVAR
  apparentPowerMVA: number;
  powerFactor: number;
  isExporting: boolean;      // true = exporting to DC line / remote grid, false = importing from DC grid

  // DC Link Parameters
  vdcPositiveKV: number;     // +320.0 kV
  vdcNegativeKV: number;     // -320.0 kV
  vdcTotalKV: number;        // 640.0 kV
  idcAmps: number;           // DC current in Amperes

  // Modulation & Control
  controlMode: HvdcControlMode;
  pRefMW: number;            // Target Active Power Setpoint (-200 to +200 MW)
  qRefMVAR: number;          // Target Reactive Power Setpoint (-100 to +100 MVAR)
  vdcRefKV: number;          // Target DC Voltage Setpoint (320 kV)
  modulationIndexMa: number; // 0.85 - 0.98
  firingAngleAlphaDeg: number;
  syntheticInertiaH: number; // Inertia constant H in seconds (2 to 8s)
  frequencyDroopGainPct: number; // 4% droop

  // MMC Valve & Submodules
  totalSubmodules: number;   // 1200 (200 per arm)
  healthySubmodules: number; // e.g. 1196
  bypassedSubmodules: number;// e.g. 4
  valveJunctionTempC: number;// max IGBT junction temp (Normal < 85°C, Trip > 125°C)

  // Cooling System (Deionized Water-Glycol)
  coolantTempC: number;      // 38.2 °C
  coolantFlowRatePct: number;// 98.4 %
  coolantFlowM3h?: number;   // Volumetric flow derived from coolantFlowRatePct
  coolantConductivityUS_cm: number; // 0.08 uS/cm
  mainPumpRunning: boolean;
  standbyPumpReady: boolean;

  // Converter voltage THD at PCC (%)
  thdPercent?: number;

  // Link Dynamics & Losses
  lineLengthKm: number;      // 150 km
  lossMW: number;            // DC Ohmic + Converter losses
  efficiencyPct: number;     // ~98.8%

  // Fault & Ride-Through
  faultState: HvdcFaultType;
  isLvrtActive: boolean;     // Low-Voltage Ride-Through active
  dccbTripped: boolean;      // DC Circuit Breakers tripped
  converterBlocked: boolean; // Firing pulses blocked
}


