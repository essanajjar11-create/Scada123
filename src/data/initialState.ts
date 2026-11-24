import { SubstationState, SwitchgearItem, TransformerData, ProtectionRelay, BayMeasurements } from '../types/substation';

export const INITIAL_SWITCHGEARS: Record<string, SwitchgearItem> = {
  // Line W1'
  CB1: { id: 'CB1', name: 'قاطع خط W1 الأول', type: 'CB', state: 'CLOSED', model: '200-SFMT-40E', manufacturer: 'Mitsubishi Electric', sf6PressureBar: 6.0, sf6Status: 'NORMAL', operationsCount: 142, bayId: 'BAY_W1_1', ratedCurrentA: 2000, breakingCapacityKA: 40 },
  DS1: { id: 'DS1', name: 'فاصل قضبان خط W1 الأول', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 310, bayId: 'BAY_W1_1', ratedCurrentA: 3150 },
  DS2: { id: 'DS2', name: 'فاصل خروج خط W1 الأول', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 285, bayId: 'BAY_W1_1', ratedCurrentA: 3150 },
  ES1: { id: 'ES1', name: 'سكين تأريض خروج W1 الأول', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 45, bayId: 'BAY_W1_1' },
  ES2: { id: 'ES2', name: 'سكين تأريض قضبان W1 الأول', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 41, bayId: 'BAY_W1_1' },

  // Line W2
  CB2: { id: 'CB2', name: 'قاطع خط W2', type: 'CB', state: 'CLOSED', model: '200-SFMT-40E', manufacturer: 'Mitsubishi Electric', sf6PressureBar: 5.95, sf6Status: 'NORMAL', operationsCount: 88, bayId: 'BAY_W2', ratedCurrentA: 2000, breakingCapacityKA: 40 },
  DS4: { id: 'DS4', name: 'فاصل قضبان خط W2', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 195, bayId: 'BAY_W2', ratedCurrentA: 3150 },
  DS5: { id: 'DS5', name: 'فاصل خروج خط W2', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 172, bayId: 'BAY_W2', ratedCurrentA: 3150 },
  ES3: { id: 'ES3', name: 'سكين تأريض خروج W2', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 30, bayId: 'BAY_W2' },
  ES4: { id: 'ES4', name: 'سكين تأريض قضبان W2', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 28, bayId: 'BAY_W2' },

  // Bus Coupler
  CB4: { id: 'CB4', name: 'قاطع رابط القضبان', type: 'CB', state: 'CLOSED', model: '200-SFMT-40E', manufacturer: 'Mitsubishi Electric', sf6PressureBar: 6.02, sf6Status: 'NORMAL', operationsCount: 220, bayId: 'BAY_COUPLER', ratedCurrentA: 2000, breakingCapacityKA: 40 },
  DS7: { id: 'DS7', name: 'فاصل رابط جهة قضيب 1', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 440, bayId: 'BAY_COUPLER', ratedCurrentA: 3150 },
  DS8: { id: 'DS8', name: 'فاصل رابط جهة قضيب 2', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 435, bayId: 'BAY_COUPLER', ratedCurrentA: 3150 },
  ES7: { id: 'ES7', name: 'سكين تأريض رابط جهة 1', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 18, bayId: 'BAY_COUPLER' },
  ES8: { id: 'ES8', name: 'سكين تأريض رابط جهة 2', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 16, bayId: 'BAY_COUPLER' },

  // Line W1''
  CB3: { id: 'CB3', name: 'قاطع خط W1 الثاني', type: 'CB', state: 'CLOSED', model: '200-SFMT-40E', manufacturer: 'Mitsubishi Electric', sf6PressureBar: 5.98, sf6Status: 'NORMAL', operationsCount: 112, bayId: 'BAY_W1_2', ratedCurrentA: 2000, breakingCapacityKA: 40 },
  DS3: { id: 'DS3', name: 'فاصل خروج خط W1 الثاني', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 240, bayId: 'BAY_W1_2', ratedCurrentA: 3150 },
  DS6: { id: 'DS6', name: 'فاصل قضبان خط W1 الثاني', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 260, bayId: 'BAY_W1_2', ratedCurrentA: 3150 },
  ES5: { id: 'ES5', name: 'سكين تأريض خروج W1 الثاني', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 22, bayId: 'BAY_W1_2' },
  ES6: { id: 'ES6', name: 'سكين تأريض قضبان W1 الثاني', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 25, bayId: 'BAY_W1_2' },

  // Transformer T1 Bay
  CB5: { id: 'CB5', name: 'قاطع محول القدرة T1', type: 'CB', state: 'CLOSED', model: '200-SFMT-40E', manufacturer: 'Mitsubishi Electric', sf6PressureBar: 6.0, sf6Status: 'NORMAL', operationsCount: 315, bayId: 'BAY_T1', ratedCurrentA: 2000, breakingCapacityKA: 40 },
  DS9: { id: 'DS9', name: 'فاصل قضبان محول T1', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 520, bayId: 'BAY_T1', ratedCurrentA: 3150 },
  DS10: { id: 'DS10', name: 'فاصل رأس محول T1', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 512, bayId: 'BAY_T1', ratedCurrentA: 3150 },
  ES9: { id: 'ES9', name: 'سكين تأريض محول T1 عالي', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 50, bayId: 'BAY_T1' },
  ES10: { id: 'ES10', name: 'سكين تأريض نقطة حيادي T1', type: 'ES', state: 'CLOSED', model: 'ES-72.5M', manufacturer: 'Mitsubishi Electric', operationsCount: 15, bayId: 'BAY_T1' },

  // Transformer T2 Bay
  CB6: { id: 'CB6', name: 'قاطع محول القدرة T2', type: 'CB', state: 'CLOSED', model: '200-SFMT-40E', manufacturer: 'Mitsubishi Electric', sf6PressureBar: 6.01, sf6Status: 'NORMAL', operationsCount: 290, bayId: 'BAY_T2', ratedCurrentA: 2000, breakingCapacityKA: 40 },
  DS11: { id: 'DS11', name: 'فاصل قضبان محول T2', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 480, bayId: 'BAY_T2', ratedCurrentA: 3150 },
  DS12: { id: 'DS12', name: 'فاصل رأس محول T2', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 472, bayId: 'BAY_T2', ratedCurrentA: 3150 },
  ES11: { id: 'ES11', name: 'سكين تأريض محول T2 عالي', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 46, bayId: 'BAY_T2' },
  ES12: { id: 'ES12', name: 'سكين تأريض نقطة حيادي T2', type: 'ES', state: 'CLOSED', model: 'ES-72.5M', manufacturer: 'Mitsubishi Electric', operationsCount: 12, bayId: 'BAY_T2' },

  // Bus VT Earthing & Isolators
  DS13: { id: 'DS13', name: 'فاصل محول جهد قضيب 1', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 80, bayId: 'BUS1', ratedCurrentA: 1250 },
  DS14: { id: 'DS14', name: 'فاصل محول جهد قضيب 2', type: 'DS', state: 'CLOSED', model: 'LBS-245C', manufacturer: 'Mitsubishi Electric', operationsCount: 75, bayId: 'BUS2', ratedCurrentA: 1250 },
  ES13: { id: 'ES13', name: 'سكين تأريض صيانة قضبان 1', type: 'ES', state: 'OPEN', model: 'ES-245M', manufacturer: 'Mitsubishi Electric', operationsCount: 10, bayId: 'BUS1' },
};

export const INITIAL_TRANSFORMERS: Record<'T1' | 'T2', TransformerData> = {
  T1: {
    id: 'T1',
    model: 'ATDCTN-125000/220/110/10',
    manufacturer: 'ABB / Siemens Energy (Ref. IEC 60076)',
    mvaRating: 125,
    hvVoltageKV: 230.0,
    mvVoltageKV: 121.0,
    lvVoltageKV: 11.0,
    tapPosition: 10, // Tap 10 is 0 (nominal position)
    tapTarget: 10,
    isTapChanging: false,
    topOilTempC: 49.2,
    windingTempC: 56.4,
    hotSpotTempC: 60.1,
    deltaHotSpotRiseK: 10.9,
    loadingPercent: 63.5,
    activeLossKW: 168.2,
    coreLossKW: 55.0,
    copperLossKW: 113.2,
    auxLossKW: 0,
    efficiencyPercent: 99.79,
    agingRate: 0.01,
    coolingStatus: 'ONAN',
  },
  T2: {
    id: 'T2',
    model: 'ATDCTN-125000/220/110/10',
    manufacturer: 'ABB / Siemens Energy (Ref. IEC 60076)',
    mvaRating: 125,
    hvVoltageKV: 230.0,
    mvVoltageKV: 121.0,
    lvVoltageKV: 11.0,
    tapPosition: 10,
    tapTarget: 10,
    isTapChanging: false,
    topOilTempC: 47.1,
    windingTempC: 53.8,
    hotSpotTempC: 57.2,
    deltaHotSpotRiseK: 10.1,
    loadingPercent: 57.8,
    activeLossKW: 148.5,
    coreLossKW: 55.0,
    copperLossKW: 93.5,
    auxLossKW: 0,
    efficiencyPercent: 99.80,
    agingRate: 0.01,
    coolingStatus: 'ONAN',
  },
};

export const INITIAL_RELAYS: Record<string, ProtectionRelay> = {
  BAY_W1_1: { relayId: 'RELAY_W1_1', model: 'SEL-487E', pickup: false, trip: false, target: null, zone: 'Zone 1 (85%)', syncCheckOk: true },
  BAY_W2: { relayId: 'RELAY_W2', model: 'SIPROTEC 7SJ85', pickup: false, trip: false, target: null, zone: 'Zone 1 (85%)', syncCheckOk: true },
  BAY_W1_2: { relayId: 'RELAY_W1_2', model: 'SEL-487E', pickup: false, trip: false, target: null, zone: 'Zone 1 (85%)', syncCheckOk: true },
  BAY_COUPLER: { relayId: 'RELAY_BC', model: 'REC670', pickup: false, trip: false, target: null, zone: 'Bus Differential 87B', syncCheckOk: true },
  BAY_T1: { relayId: 'RELAY_T1', model: 'SEL-487E', pickup: false, trip: false, target: null, zone: 'Differential 87T', syncCheckOk: true },
  BAY_T2: { relayId: 'RELAY_T2', model: 'SEL-487E', pickup: false, trip: false, target: null, zone: 'Differential 87T', syncCheckOk: true },
};

export const INITIAL_MEASUREMENTS: Record<string, BayMeasurements> = {
  BAY_W1_1: {
    voltageL1N_kV: 126.5, voltageL2N_kV: 126.3, voltageL3N_kV: 126.4, voltageLL_kV: 219.0,
    currentL1_A: 132.5, currentL2_A: 132.0, currentL3_A: 132.2,
    activePowerMW: 45.2, reactivePowerMVAr: 21.9, apparentPowerMVA: 50.2,
    frequencyHz: 50.00, powerFactor: 0.90, energyImportMWh: 14820.5
  },
  BAY_W2: {
    voltageL1N_kV: 126.4, voltageL2N_kV: 126.2, voltageL3N_kV: 126.3, voltageLL_kV: 218.8,
    currentL1_A: 82.8, currentL2_A: 82.4, currentL3_A: 82.6,
    activePowerMW: 28.3, reactivePowerMVAr: 13.7, apparentPowerMVA: 31.4,
    frequencyHz: 50.00, powerFactor: 0.90, energyImportMWh: 18450.2
  },
  BAY_W1_2: {
    voltageL1N_kV: 126.6, voltageL2N_kV: 126.4, voltageL3N_kV: 126.5, voltageLL_kV: 219.2,
    currentL1_A: 183.9, currentL2_A: 183.2, currentL3_A: 183.5,
    activePowerMW: 62.8, reactivePowerMVAr: 30.4, apparentPowerMVA: 69.8,
    frequencyHz: 50.00, powerFactor: 0.90, energyImportMWh: 9840.1
  },
  BAY_COUPLER: {
    voltageL1N_kV: 126.5, voltageL2N_kV: 126.3, voltageL3N_kV: 126.4, voltageLL_kV: 219.0,
    currentL1_A: 9.3, currentL2_A: 9.2, currentL3_A: 9.3,
    activePowerMW: 3.2, reactivePowerMVAr: 1.5, apparentPowerMVA: 3.5,
    frequencyHz: 50.00, powerFactor: 0.90, energyImportMWh: 3410.0, flowDirection: 'BUS1_TO_BUS2'
  },
  BUS1: {
    voltageL1N_kV: 126.5, voltageL2N_kV: 126.3, voltageL3N_kV: 126.4, voltageLL_kV: 219.0,
    currentL1_A: 0, currentL2_A: 0, currentL3_A: 0,
    activePowerMW: 0, reactivePowerMVAr: 0, apparentPowerMVA: 0,
    frequencyHz: 50.00, powerFactor: 1.0, energyImportMWh: 0
  },
  BUS2: {
    voltageL1N_kV: 126.5, voltageL2N_kV: 126.3, voltageL3N_kV: 126.4, voltageLL_kV: 219.0,
    currentL1_A: 0, currentL2_A: 0, currentL3_A: 0,
    activePowerMW: 0, reactivePowerMVAr: 0, apparentPowerMVA: 0,
    frequencyHz: 50.00, powerFactor: 1.0, energyImportMWh: 0
  },
  BAY_T1: {
    voltageL1N_kV: 69.8, voltageL2N_kV: 69.7, voltageL3N_kV: 69.7, voltageLL_kV: 120.8,
    currentL1_A: 371.4, currentL2_A: 370.2, currentL3_A: 370.8,
    activePowerMW: 70.0, reactivePowerMVAr: 33.9, apparentPowerMVA: 77.8,
    frequencyHz: 50.00, powerFactor: 0.90, energyImportMWh: 21540.8
  },
  BAY_T2: {
    voltageL1N_kV: 69.8, voltageL2N_kV: 69.7, voltageL3N_kV: 69.7, voltageLL_kV: 120.8,
    currentL1_A: 344.9, currentL2_A: 343.8, currentL3_A: 344.2,
    activePowerMW: 65.0, reactivePowerMVAr: 31.5, apparentPowerMVA: 72.2,
    frequencyHz: 50.00, powerFactor: 0.90, energyImportMWh: 19820.4
  },
};

export const INITIAL_SUBSTATION_STATE: SubstationState = {
  gridVoltageKV: 220.0,
  ambientTempC: 28.0,
  bus1Energized: true,
  bus2Energized: true,
  faultActive: false,
  faultType: 'NONE',
  switchgears: INITIAL_SWITCHGEARS,
  transformers: INITIAL_TRANSFORMERS,
  relays: INITIAL_RELAYS,
  measurements: INITIAL_MEASUREMENTS,
  alarms: [
    {
      id: 'ALM_INIT_01',
      timestamp: new Date().toLocaleTimeString(),
      severity: 'INFO',
      bayId: 'STATION_SUPERVISOR',
      message: 'نظام SCADA والإشراف الميداني في حالة عمل اسمية طبيعية (Normal Online).',
      acknowledged: true,
      active: true,
    }
  ],
  soeLogs: [
    {
      id: 'SOE_INIT_01',
      timestamp: new Date().toISOString(),
      millis: Date.now(),
      bayId: 'SYSTEM',
      sourceDevice: 'GATEWAY_104',
      eventDescription: 'IEC 60870-5-104 Link Established with SCADA Master (TCP/2404)',
      protocolTag: 'IEC-104 ASDU 100',
      classification: 'STATUS'
    },
    {
      id: 'SOE_INIT_02',
      timestamp: new Date().toISOString(),
      millis: Date.now() + 50,
      bayId: 'STATION_BUS',
      sourceDevice: 'REC670',
      eventDescription: 'IEC 61850 GOOSE Publisher Initialized (Ethertype 0x88B8)',
      protocolTag: 'GOOSE PDU',
      classification: 'STATUS'
    }
  ],
  snifferPackets: [
    {
      id: 'pkt_01',
      timestamp: new Date().toISOString(),
      protocol: 'IEC-60870-5-104',
      rawHex: '68 14 02 00 00 00 24 01 03 00 01 00 0A 01 00 43 5C 80 00 00',
      summary: 'ASDU 36 M_ME_TF_1 | COT 3 (Spontaneous) | IOA 266 [BAY_W1_1] = 220.1 kV',
      details: { asdu: 36, cot: 3, ioa: 266, value: 220.1, status: 'VALID' }
    },
    {
      id: 'pkt_02',
      protocol: 'IEC-61850-GOOSE',
      timestamp: new Date().toISOString(),
      rawHex: '01 0C CD 01 00 01 00 1E 8C 4F B2 01 88 B8 00 01 00 68 61 5E',
      summary: 'GOOSE PDU | AppID 0x0001 | SEL-487E | Bay W1_1 Interlock Status: HEALTHY',
      details: { appid: '0x0001', stNum: 1, sqNum: 142, ttl: '1000ms' }
    }
  ]
};
