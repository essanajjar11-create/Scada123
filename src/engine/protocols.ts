import { ProtocolPacket } from '../types/substation';

let gooseSqNum = 100;
let gooseStNum = 1;
let iec104Seq = 1;

/**
 * Generates an authentic IEC 61850 GOOSE Protocol frame simulation
 */
export function generateGoosePacket(
  bayId: string,
  event: string,
  stateValue: 'OPEN' | 'CLOSED' | 'TRIP'
): ProtocolPacket {
  gooseSqNum++;
  if (event.includes('TRIP') || event.includes('COMMAND')) {
    gooseStNum++;
    gooseSqNum = 0;
  }

  const hexBytes = [
    '01', '0C', 'CD', '01', '00', '01', // Multicast MAC
    '00', '1E', '8C', '4F', 'B2', '01', // Source MAC (SEL-487E / REC670)
    '88', 'B8',                         // Ethertype: IEC 61850 GOOSE
    '00', '01',                         // APPID: 0x0001
    '00', '68',                         // Length: 104 octets
    '00', '00',                         // Reserved 1
    '00', '00',                         // Reserved 2
    // APDU Tag
    '61', '5E',
    '80', '1A', '53', '55', '42', '53', '54', '41', '54', '49', '4F', '4E', // gocbRef
    '81', '02', '03', 'E8',             // timeAllowedtoLive: 1000ms
    '82', '14', '44', '61', '74', '53', '65', '74', // datSet
    '85', '01', (gooseStNum & 0xFF).toString(16).padStart(2, '0').toUpperCase(), // stNum
    '86', '01', (gooseSqNum & 0xFF).toString(16).padStart(2, '0').toUpperCase(), // sqNum
    '87', '01', '00',                   // test: FALSE
    '88', '01', '01',                   // confRev: 1
    '89', '01', '00',                   // ndsCom: FALSE
    '8A', '01', stateValue === 'CLOSED' ? '01' : (stateValue === 'TRIP' ? '03' : '00')
  ];

  return {
    id: `pkt_goose_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    protocol: 'IEC-61850-GOOSE',
    rawHex: hexBytes.join(' '),
    summary: `GOOSE PDU [${bayId}] ${event} -> ${stateValue} (stNum:${gooseStNum}, sqNum:${gooseSqNum})`,
    details: {
      gocbRef: `SUB220_LD0/LLN0$GO$gcb_${bayId}`,
      timeAllowedtoLive: '1000 ms',
      dataset: `SUB220_LD0/LLN0$ds_${bayId}`,
      stNum: gooseStNum,
      sqNum: gooseSqNum,
      state: stateValue,
      ethertype: '0x88B8',
    }
  };
}

/**
 * Generates an authentic IEC 60870-5-104 Telemetry frame
 */
export function generateIec104Packet(
  type: 'MEASUREMENT_SPONTANEOUS' | 'SWITCH_STATUS' | 'INTERROGATION_REPLY',
  details: { ioa: number; value: number | string; bay: string; cause?: number }
): ProtocolPacket {
  iec104Seq++;
  const cot = details.cause || (type === 'MEASUREMENT_SPONTANEOUS' ? 3 : 20); // 3=Spontaneous, 20=Interrogated
  const asduType = type === 'MEASUREMENT_SPONTANEOUS' ? 36 : 30; // 36 = M_ME_TF_1 (Measured floating point with CP56Time2a), 30 = Single Point with Time

  // Build standard 104 hex frame
  const hexBytes = [
    '68',                               // Start byte 0x68
    '14',                               // APDU length (20 bytes)
    ((iec104Seq * 2) & 0xFF).toString(16).padStart(2, '0').toUpperCase(), '00', // Tx Seq
    '00', '00',                         // Rx Seq
    asduType.toString(16).padStart(2, '0').toUpperCase(), // Type ID
    '01',                               // Number of objects: 1
    cot.toString(16).padStart(2, '0').toUpperCase(), '00', // Cause of Transmission
    '01', '00',                         // Common Address of ASDU (Station 1)
    (details.ioa & 0xFF).toString(16).padStart(2, '0').toUpperCase(), // IOA low
    ((details.ioa >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase(), // IOA mid
    '00',                               // IOA high
    '43', '5C', '80', '00',             // IEEE-754 float / status
    '00',                               // Quality descriptor: VALID
    '1C', '24', '11', '09'              // CP56Time2a timestamp bytes
  ];

  return {
    id: `pkt_104_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    protocol: 'IEC-60870-5-104',
    rawHex: hexBytes.join(' '),
    summary: `IEC-104 ASDU ${asduType} | COT ${cot} | IOA ${details.ioa} [${details.bay}] = ${details.value}`,
    details: {
      typeId: `ASDU ${asduType} (${type === 'MEASUREMENT_SPONTANEOUS' ? 'M_ME_TF_1 Float' : 'M_SP_TB_1 Status'})`,
      causeOfTransmission: `${cot} (${cot === 3 ? 'Spontaneous' : 'General Interrogation'})`,
      commonAddress: 1,
      ioa: details.ioa,
      value: details.value,
      quality: 'VALID (0x00)',
      port: 2404
    }
  };
}
