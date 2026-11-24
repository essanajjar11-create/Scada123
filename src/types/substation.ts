// Substation Data Types & Telemetry Models

export type SwitchState = 'CLOSED' | 'OPEN' | 'INTERMEDIATE' | 'FAULT';
export type SF6Status = 'NORMAL' | 'LOW_ALARM' | 'BLOCK_OPERATION';
export type VoltageLevel = '220kV' | '110kV' | '11kV';

export interface SwitchgearItem {
  id: string;
  name: string;
  type: 'CB' | 'DS' | 'ES'; // Circuit Breaker, Disconnector, Earthing Switch
  state: SwitchState;
  model: string;
  manufacturer: string;
  sf6PressureBar?: number; // e.g. 6.0 bar = 0.60 MPa
  sf6Status?: SF6Status;
  operationsCount: number;
  bayId: string;
  ratedCurrentA?: number;
  breakingCapacityKA?: number;
}

export interface BayMeasurements {
  voltageL1N_kV: number;
  voltageL2N_kV: number;
  voltageL3N_kV: number;
  voltageLL_kV: number;
  currentL1_A: number;
  currentL2_A: number;
  currentL3_A: number;
  activePowerMW: number;
  reactivePowerMVAr: number;
  apparentPowerMVA: number;
  frequencyHz: number;
  powerFactor: number;
  energyImportMWh: number;
  flowDirection?: 'BUS1_TO_BUS2' | 'BUS2_TO_BUS1' | 'NONE';
}

export interface ProtectionRelay {
  relayId: string;
  model: 'SEL-487E' | 'SIPROTEC 7SJ85' | 'REC670';
  pickup: boolean;
  trip: boolean;
  target: string | null;
  zone: string;
  syncCheckOk: boolean;
}

export interface TransformerData {
  id: 'T1' | 'T2';
  model: string;
  manufacturer: string;
  mvaRating: number;
  hvVoltageKV: number;
  mvVoltageKV: number;
  lvVoltageKV: number;
  tapPosition: number; // 1 to 19 (10 is nominal = 0)
  tapTarget: number;
  isTapChanging: boolean;
  topOilTempC: number;
  windingTempC: number;
  hotSpotTempC?: number;
  deltaHotSpotRiseK?: number;
  loadingPercent: number;
  activeLossKW: number;
  coreLossKW?: number;
  copperLossKW?: number;
  auxLossKW?: number;
  efficiencyPercent?: number;
  agingRate?: number;
  coolingStatus: 'ONAN' | 'ONAF_STAGE_1' | 'ONAF_STAGE_2' | 'STANDBY';
  coolingModeOverride?: 'AUTO' | 'FORCE_ONAN' | 'FORCE_ONAF1' | 'FORCE_ONAF2';
  protectionStatus?: {
    otiAlarm: boolean;
    otiTrip: boolean;
    wtiAlarm: boolean;
    wtiTrip: boolean;
  };
}

export interface AlarmItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  bayId: string;
  message: string;
  acknowledged: boolean;
  active: boolean;
}

export interface SoeEvent {
  id: string;
  timestamp: string; // ISO with ms
  millis: number;
  bayId: string;
  sourceDevice: string;
  eventDescription: string;
  protocolTag: string;
  classification: 'TRIP' | 'ALARM' | 'CONTROL' | 'STATUS';
}

export interface ProtocolPacket {
  id: string;
  timestamp: string;
  protocol: 'IEC-61850-GOOSE' | 'IEC-60870-5-104' | 'MODBUS-TCP';
  rawHex: string;
  summary: string;
  details: Record<string, any>;
}

export interface SubstationState {
  gridVoltageKV: number;
  ambientTempC: number;
  bus1Energized: boolean;
  bus2Energized: boolean;
  faultActive: boolean;
  faultType: 'NONE' | '3PH_FAULT' | 'SF6_LEAK' | 'TX_OVERHEAT';
  
  switchgears: Record<string, SwitchgearItem>;
  transformers: Record<'T1' | 'T2', TransformerData>;
  relays: Record<string, ProtectionRelay>;
  measurements: Record<string, BayMeasurements>;
  
  alarms: AlarmItem[];
  soeLogs: SoeEvent[];
  snifferPackets: ProtocolPacket[];
}
