import React, { useState, useEffect } from 'react';
import {
  Server,
  Network,
  Cpu,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Activity,
  Zap,
  Sliders,
  Database,
  ArrowRight,
  Radio,
  Lock,
  Layers,
  Copy,
  Download,
  Trash2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { SwitchgearState } from '../../types/scada';

export const ProtocolEmulatorModule: React.FC = () => {
  const {
    tr1Telemetry,
    tr2Telemetry,
    gridFrequency,
    toggleSwitch,
    addAuditLog,
    t,
    lang
  } = useScada();
  const isAr = lang === 'ar';

  const [activeProtocol, setActiveProtocol] = useState<'modbus' | 'iec104'>('modbus');

  // ==========================================
  // MODBUS TCP STATE & CONFIGURATION
  // ==========================================
  const [modbusPort] = useState<number>(502);
  const [modbusSlaveId, setModbusSlaveId] = useState<number>(1);
  const [modbusFc, setModbusFc] = useState<'FC01' | 'FC02' | 'FC03' | 'FC04' | 'FC05' | 'FC06' | 'FC16'>('FC03');
  const [modbusStartAddr, setModbusStartAddr] = useState<number>(40001);
  const [modbusQuantity, setModbusQuantity] = useState<number>(6);
  const [modbusWriteVal, setModbusWriteVal] = useState<number>(13200);
  const [modbusWriteCoilState, setModbusWriteCoilState] = useState<boolean>(true);
  const [modbusWriteMultiVals, setModbusWriteMultiVals] = useState<string>('13200, 1225, 238, 148');
  const [selectedMemoryTable, setSelectedMemoryTable] = useState<'HR' | 'IR' | 'COIL' | 'DI'>('HR');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Modbus Traffic Packet Log
  const [modbusTrafficLog, setModbusTrafficLog] = useState<Array<{
    id: string;
    timestamp: string;
    direction: 'TX' | 'RX';
    hex: string;
    description: string;
    fc: string;
    isError?: boolean;
    breakdown?: {
      txId: string;
      protoId: string;
      length: string;
      unitId: string;
      fc: string;
      data: string;
    };
  }>>([]);

  // Live Holding Registers (40001 - 40016 / 4x)
  const [holdingRegisters, setHoldingRegisters] = useState<Record<number, number>>({
    40001: Math.round((tr1Telemetry?.gridVoltage ?? 132.0) * 100),  // 132.00 kV -> 13200
    40002: Math.round((tr1Telemetry?.loadCurrent ?? 122.5) * 10),   // 122.5 A -> 1225
    40003: Math.round(((tr1Telemetry?.activePower ?? 23800) / 1000) * 10), // 23.8 MW -> 238
    40004: Math.round(((tr1Telemetry?.reactivePower ?? 14750) / 1000) * 10), // 14.8 MVAR -> 148
    40005: Math.round((tr1Telemetry?.oilTemp ?? 62.4) * 10),        // 62.4 °C -> 624
    40006: Math.round((tr1Telemetry?.windingTemp ?? 71.8) * 10),    // 71.8 °C -> 718
    40007: tr1Telemetry?.tapPosition ?? 7,                         // Tap Position 1-17
    40008: Math.round((tr2Telemetry?.gridVoltage ?? 132.0) * 100),  // TR2 V -> 13200
    40009: Math.round((tr2Telemetry?.loadCurrent ?? 105.0) * 10),   // TR2 I -> 1050
    40010: Math.round((gridFrequency ?? 50.0) * 100),              // 50.00 Hz -> 5000
    40011: Math.round((tr1Telemetry?.pf ?? 0.85) * 1000),          // PF 0.850 -> 850
    40012: Math.round((tr1Telemetry?.thd ?? 1.85) * 100),          // THD 1.85% -> 185
    40013: Math.floor((tr1Telemetry?.fwdEnergy ?? 184500) / 65536),// Energy High Word
    40014: (tr1Telemetry?.fwdEnergy ?? 184500) % 65536,             // Energy Low Word
    40015: tr1Telemetry?.fans?.fan1 ? (tr1Telemetry?.fans?.fan2 ? 3 : 2) : 0, // Cooling Stage
    40016: 0, // Protection Reset Register
  });

  // Live Input Registers (30001 - 30012 / 3x - Read-Only)
  const inputRegisters: Record<number, { val: number; name: string; eng: string; scale: string }> = {
    30001: { val: Math.round((tr1Telemetry?.ctSecA ?? 2.04) * 100), name: 'CT Secondary Phase A', eng: `${(tr1Telemetry?.ctSecA ?? 2.04).toFixed(2)} A`, scale: 'x100' },
    30002: { val: Math.round((tr1Telemetry?.ctSecB ?? 2.04) * 100), name: 'CT Secondary Phase B', eng: `${(tr1Telemetry?.ctSecB ?? 2.04).toFixed(2)} A`, scale: 'x100' },
    30003: { val: Math.round((tr1Telemetry?.ctSecC ?? 2.04) * 100), name: 'CT Secondary Phase C', eng: `${(tr1Telemetry?.ctSecC ?? 2.04).toFixed(2)} A`, scale: 'x100' },
    30004: { val: Math.round((tr1Telemetry?.ctBurdenVA ?? 8.5) * 100), name: 'CT Burden', eng: `${(tr1Telemetry?.ctBurdenVA ?? 8.5).toFixed(1)} VA`, scale: 'x100' },
    30005: { val: Math.round((tr1Telemetry?.ambientTemp ?? 34.2) * 10), name: 'Substation Ambient Temp', eng: `${(tr1Telemetry?.ambientTemp ?? 34.2).toFixed(1)} °C`, scale: 'x10' },
    30006: { val: Math.round((tr1Telemetry?.bushingTemp ?? 52.1) * 10), name: 'HV Bushing Temp', eng: `${(tr1Telemetry?.bushingTemp ?? 52.1).toFixed(1)} °C`, scale: 'x10' },
    30007: { val: Math.round((tr1Telemetry?.oilLevel1 ?? 82) * 10), name: 'Main Conservator Level', eng: `${(tr1Telemetry?.oilLevel1 ?? 82).toFixed(1)} %`, scale: 'x10' },
    30008: { val: Math.round((tr1Telemetry?.oilLevel2 ?? 78) * 10), name: 'OLTC Conservator Level', eng: `${(tr1Telemetry?.oilLevel2 ?? 78).toFixed(1)} %`, scale: 'x10' },
    30009: { val: Math.round((tr1Telemetry?.maxDemand ?? 48.2) * 10), name: 'Daily Max Peak Demand', eng: `${(tr1Telemetry?.maxDemand ?? 48.2).toFixed(1)} MW`, scale: 'x10' },
    30010: { val: Math.round((tr1Telemetry?.voltageUnbalance ?? 0.42) * 100), name: 'Voltage Unbalance', eng: `${(tr1Telemetry?.voltageUnbalance ?? 0.42).toFixed(2)} %`, scale: 'x100' },
    30011: { val: Math.round((tr1Telemetry?.harmonics?.h3 ?? 1.1) * 100), name: '3rd Harmonic Component', eng: `${(tr1Telemetry?.harmonics?.h3 ?? 1.1).toFixed(2)} %`, scale: 'x100' },
    30012: { val: Math.round((tr1Telemetry?.harmonics?.h5 ?? 0.8) * 100), name: '5th Harmonic Component', eng: `${(tr1Telemetry?.harmonics?.h5 ?? 0.8).toFixed(2)} %`, scale: 'x100' },
  };

  // Live Coils (00001 - 00016 / 0x - Read/Write)
  const coils: Record<number, { state: boolean; name: string; tag: string; switchKey?: keyof SwitchgearState }> = {
    1: { state: tr1Telemetry?.switches?.hvBreaker52_1 ?? true, name: 'TR-1 132kV HV Breaker', tag: '52-1', switchKey: 'hvBreaker52_1' },
    2: { state: tr1Telemetry?.switches?.mvBreaker52_2 ?? true, name: 'TR-1 13.8kV MV Breaker', tag: '52-2', switchKey: 'mvBreaker52_2' },
    3: { state: tr1Telemetry?.switches?.busCoupler52_0 ?? false, name: '132kV Bus Coupler', tag: '52-0', switchKey: 'busCoupler52_0' },
    4: { state: tr1Telemetry?.switches?.hvBreaker52_4 ?? true, name: 'TR-2 132kV HV Breaker', tag: '52-4', switchKey: 'hvBreaker52_4' },
    5: { state: tr1Telemetry?.switches?.mvBreaker52_5 ?? true, name: 'TR-2 13.8kV MV Breaker', tag: '52-5', switchKey: 'mvBreaker52_5' },
    6: { state: tr1Telemetry?.switches?.busSectionalizer52_6 ?? true, name: '13.8kV Bus Sectionalizer', tag: '52-6', switchKey: 'busSectionalizer52_6' },
    7: { state: tr1Telemetry?.switches?.feederCity52_7 ?? true, name: 'City Feeder 01 Breaker', tag: '52-7', switchKey: 'feederCity52_7' },
    8: { state: tr1Telemetry?.switches?.feederInd52_8 ?? true, name: 'Industrial Feeder 02 Breaker', tag: '52-8', switchKey: 'feederInd52_8' },
    9: { state: tr1Telemetry?.switches?.feederComm52_9 ?? true, name: 'Commercial Feeder 03 Breaker', tag: '52-9', switchKey: 'feederComm52_9' },
    10: { state: tr1Telemetry?.switches?.feederBess52_B ?? true, name: 'BESS Battery System Breaker', tag: '52-B', switchKey: 'feederBess52_B' },
    11: { state: tr1Telemetry?.fans?.fan1 ?? false, name: 'Cooling Stage 1 Forced Air', tag: 'FAN-1' },
    12: { state: tr1Telemetry?.fans?.fan2 ?? false, name: 'Cooling Stage 2 Peak Air', tag: 'FAN-2' },
    13: { state: tr1Telemetry?.fans?.pump1 ?? true, name: 'Oil Circulation Pump 1', tag: 'PUMP-1' },
    14: { state: tr1Telemetry?.fans?.pump2 ?? false, name: 'Oil Standby Pump 2', tag: 'PUMP-2' },
    15: { state: tr1Telemetry?.switches?.earthSwitch84_1 ?? false, name: 'Section 1 Earth Switch', tag: '84-1', switchKey: 'earthSwitch84_1' },
    16: { state: tr1Telemetry?.switches?.earthSwitch84_2 ?? false, name: 'Section 2 Earth Switch', tag: '84-2', switchKey: 'earthSwitch84_2' },
  };

  // Live Discrete Inputs (10001 - 10012 / 1x - Read-Only)
  const discreteInputs: Record<number, { state: boolean; name: string; tag: string; isAlarm?: boolean }> = {
    10001: { state: tr1Telemetry?.faults?.overCurrent ?? false, name: 'Instantaneous Overcurrent Trip', tag: 'ANSI 50/51', isAlarm: true },
    10002: { state: tr1Telemetry?.faults?.lgFault ?? false, name: 'Transformer Differential Trip', tag: 'ANSI 87T', isAlarm: true },
    10003: { state: tr1Telemetry?.faults?.buchholz ?? false, name: 'Buchholz Gas Accumulator Trip', tag: 'ANSI 63', isAlarm: true },
    10004: { state: tr1Telemetry?.faults?.overTemp ?? false, name: 'Winding Thermal Over-Temperature', tag: 'ANSI 49', isAlarm: true },
    10005: { state: tr1Telemetry?.faults?.underVoltage ?? false, name: 'Under-Voltage Warning Stage', tag: 'ANSI 27', isAlarm: true },
    10006: { state: tr1Telemetry?.faults?.overVoltage ?? false, name: 'Over-Voltage Warning Stage', tag: 'ANSI 59', isAlarm: true },
    10007: { state: tr1Telemetry?.faults?.ctOpen ?? false, name: 'CT Secondary Open Circuit Hazard', tag: 'CT-OPEN', isAlarm: true },
    10008: { state: true, name: 'Breaker 52-1 Spring Mechanism Charged', tag: '52-1 SPRG' },
    10009: { state: true, name: 'Breaker 52-2 Spring Mechanism Charged', tag: '52-2 SPRG' },
    10010: { state: false, name: 'Master Trip Lockout Relay Active', tag: 'ANSI 86', isAlarm: true },
    10011: { state: true, name: 'GIS SF6 Gas Pressure Nominal (>1.05 bar)', tag: 'SF6 OK' },
    10012: { state: true, name: 'Substation Fire Deluge Valve Armed', tag: 'FIRE DELUGE' },
  };

  // Keep Holding Registers synchronized with live SCADA
  useEffect(() => {
    setHoldingRegisters(prev => ({
      ...prev,
      40001: Math.round((tr1Telemetry?.gridVoltage ?? 132.0) * 100),
      40002: Math.round((tr1Telemetry?.loadCurrent ?? 122.5) * 10),
      40003: Math.round(((tr1Telemetry?.activePower ?? 23800) / 1000) * 10),
      40004: Math.round(((tr1Telemetry?.reactivePower ?? 14750) / 1000) * 10),
      40005: Math.round((tr1Telemetry?.oilTemp ?? 62.4) * 10),
      40006: Math.round((tr1Telemetry?.windingTemp ?? 71.8) * 10),
      40007: tr1Telemetry?.tapPosition ?? 7,
      40008: Math.round((tr2Telemetry?.gridVoltage ?? 132.0) * 100),
      40009: Math.round((tr2Telemetry?.loadCurrent ?? 105.0) * 10),
      40010: Math.round((gridFrequency ?? 50.0) * 100),
      40011: Math.round((tr1Telemetry?.pf ?? 0.85) * 1000),
      40012: Math.round((tr1Telemetry?.thd ?? 1.85) * 100),
    }));
  }, [tr1Telemetry, tr2Telemetry, gridFrequency]);

  // Adjust default start address when FC changes
  const handleFcChange = (fc: typeof modbusFc) => {
    setModbusFc(fc);
    if (fc === 'FC01' || fc === 'FC05') setModbusStartAddr(1);
    else if (fc === 'FC02') setModbusStartAddr(10001);
    else if (fc === 'FC03' || fc === 'FC06' || fc === 'FC16') setModbusStartAddr(40001);
    else if (fc === 'FC04') setModbusStartAddr(30001);
  };

  // ==========================================
  // MODBUS TCP PACKET ENGINE & DISPATCHER
  // ==========================================
  const handleSendModbus = () => {
    const txId = Math.floor(Math.random() * 65535);
    const txIdHex = txId.toString(16).padStart(4, '0').toUpperCase();
    const protoHex = '00 00';
    const unitHex = modbusSlaveId.toString(16).padStart(2, '0').toUpperCase();
    const now = new Date().toLocaleTimeString();

    let requestHex = '';
    let responseHex = '';
    let description = '';
    let isError = false;

    // Helper for Byte Hex
    const toHex16 = (num: number) => Math.max(0, Math.min(65535, num)).toString(16).padStart(4, '0').toUpperCase();
    const toHex8 = (num: number) => Math.max(0, Math.min(255, num)).toString(16).padStart(2, '0').toUpperCase();

    // ------------------------------------------------------------------------
    // FC03: READ HOLDING REGISTERS (40001..40020)
    // ------------------------------------------------------------------------
    if (modbusFc === 'FC03') {
      const regOffset = modbusStartAddr - 40001;
      const qty = Math.max(1, Math.min(125, modbusQuantity));
      const reqPdu = `03 ${toHex16(regOffset)} ${toHex16(qty)}`;
      requestHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} ${reqPdu}`;

      if (regOffset < 0 || regOffset > 100) {
        // Exception 0x02: Illegal Data Address
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 83 02`;
        description = `EXCEPTION 0x02: Illegal Data Address @ ${modbusStartAddr}`;
      } else {
        const byteCount = qty * 2;
        const readDataBytes: string[] = [];
        const readLogs: string[] = [];

        for (let i = 0; i < qty; i++) {
          const targetAddr = modbusStartAddr + i;
          const regVal = holdingRegisters[targetAddr] ?? 0;
          readDataBytes.push(toHex16(regVal));
          readLogs.push(`HR${targetAddr}=${regVal}`);
        }

        const respLen = (3 + byteCount);
        const respPdu = `03 ${toHex8(byteCount)} ${readDataBytes.join(' ')}`;
        responseHex = `${txIdHex} ${protoHex} ${toHex16(respLen)} ${unitHex} ${respPdu}`;
        description = `FC03 Read ${qty} HRs @ ${modbusStartAddr} -> [${readLogs.slice(0, 4).join(', ')}${readLogs.length > 4 ? '...' : ''}]`;
      }
    }

    // ------------------------------------------------------------------------
    // FC04: READ INPUT REGISTERS (30001..30020)
    // ------------------------------------------------------------------------
    else if (modbusFc === 'FC04') {
      const regOffset = modbusStartAddr - 30001;
      const qty = Math.max(1, Math.min(125, modbusQuantity));
      const reqPdu = `04 ${toHex16(regOffset)} ${toHex16(qty)}`;
      requestHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} ${reqPdu}`;

      if (regOffset < 0 || regOffset > 50) {
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 84 02`;
        description = `EXCEPTION 0x02: Illegal Input Register Address @ ${modbusStartAddr}`;
      } else {
        const byteCount = qty * 2;
        const readDataBytes: string[] = [];
        const readLogs: string[] = [];

        for (let i = 0; i < qty; i++) {
          const targetAddr = modbusStartAddr + i;
          const irData = inputRegisters[targetAddr];
          const val = irData ? irData.val : 0;
          readDataBytes.push(toHex16(val));
          readLogs.push(`IR${targetAddr}=${val}`);
        }

        const respLen = 3 + byteCount;
        responseHex = `${txIdHex} ${protoHex} ${toHex16(respLen)} ${unitHex} 04 ${toHex8(byteCount)} ${readDataBytes.join(' ')}`;
        description = `FC04 Read ${qty} Input Regs @ ${modbusStartAddr} -> [${readLogs.slice(0, 4).join(', ')}]`;
      }
    }

    // ------------------------------------------------------------------------
    // FC01: READ COILS (00001..00016)
    // ------------------------------------------------------------------------
    else if (modbusFc === 'FC01') {
      const coilOffset = Math.max(0, modbusStartAddr - 1);
      const qty = Math.max(1, Math.min(2000, modbusQuantity));
      requestHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 01 ${toHex16(coilOffset)} ${toHex16(qty)}`;

      if (coilOffset < 0 || coilOffset > 64) {
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 81 02`;
        description = `EXCEPTION 0x02: Illegal Coil Address @ ${modbusStartAddr}`;
      } else {
        const byteCount = Math.ceil(qty / 8);
        const byteArr: number[] = new Array(byteCount).fill(0);
        const coilLogs: string[] = [];

        for (let i = 0; i < qty; i++) {
          const coilAddr = modbusStartAddr + i;
          const coilObj = coils[coilAddr];
          const st = coilObj ? coilObj.state : false;
          if (st) {
            const byteIdx = Math.floor(i / 8);
            const bitIdx = i % 8;
            byteArr[byteIdx] |= (1 << bitIdx);
          }
          coilLogs.push(`C${coilAddr}=${st ? '1' : '0'}`);
        }

        const hexBytes = byteArr.map(b => toHex8(b)).join(' ');
        const respLen = 3 + byteCount;
        responseHex = `${txIdHex} ${protoHex} ${toHex16(respLen)} ${unitHex} 01 ${toHex8(byteCount)} ${hexBytes}`;
        description = `FC01 Read ${qty} Coils @ ${modbusStartAddr} -> [${coilLogs.slice(0, 6).join(', ')}]`;
      }
    }

    // ------------------------------------------------------------------------
    // FC02: READ DISCRETE INPUTS (10001..10016)
    // ------------------------------------------------------------------------
    else if (modbusFc === 'FC02') {
      const diOffset = Math.max(0, modbusStartAddr - 10001);
      const qty = Math.max(1, Math.min(2000, modbusQuantity));
      requestHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 02 ${toHex16(diOffset)} ${toHex16(qty)}`;

      if (diOffset < 0 || diOffset > 64) {
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 82 02`;
        description = `EXCEPTION 0x02: Illegal Discrete Input Address @ ${modbusStartAddr}`;
      } else {
        const byteCount = Math.ceil(qty / 8);
        const byteArr: number[] = new Array(byteCount).fill(0);
        const diLogs: string[] = [];

        for (let i = 0; i < qty; i++) {
          const diAddr = modbusStartAddr + i;
          const diObj = discreteInputs[diAddr];
          const st = diObj ? diObj.state : false;
          if (st) {
            const byteIdx = Math.floor(i / 8);
            const bitIdx = i % 8;
            byteArr[byteIdx] |= (1 << bitIdx);
          }
          diLogs.push(`DI${diAddr}=${st ? '1' : '0'}`);
        }

        const hexBytes = byteArr.map(b => toHex8(b)).join(' ');
        const respLen = 3 + byteCount;
        responseHex = `${txIdHex} ${protoHex} ${toHex16(respLen)} ${unitHex} 02 ${toHex8(byteCount)} ${hexBytes}`;
        description = `FC02 Read ${qty} Discrete Inputs @ ${modbusStartAddr} -> [${diLogs.slice(0, 6).join(', ')}]`;
      }
    }

    // ------------------------------------------------------------------------
    // FC05: WRITE SINGLE COIL (00001..00016)
    // ------------------------------------------------------------------------
    else if (modbusFc === 'FC05') {
      const coilOffset = Math.max(0, modbusStartAddr - 1);
      const valHex = modbusWriteCoilState ? 'FF 00' : '00 00';
      requestHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 05 ${toHex16(coilOffset)} ${valHex}`;

      if (coilOffset < 0 || coilOffset > 64) {
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 85 02`;
        description = `EXCEPTION 0x02: Illegal Coil Address @ ${modbusStartAddr}`;
      } else {
        // Echo request on successful write
        responseHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 05 ${toHex16(coilOffset)} ${valHex}`;
        const targetCoil = coils[modbusStartAddr];
        description = `FC05 Write Coil #${modbusStartAddr} (${targetCoil ? targetCoil.name : 'Unknown'}) := ${modbusWriteCoilState ? 'ON (0xFF00)' : 'OFF (0x0000)'}`;

        // If mapped to switchgear, execute toggle
        if (targetCoil && targetCoil.switchKey) {
          toggleSwitch('TR-1', targetCoil.switchKey);
        }
      }
    }

    // ------------------------------------------------------------------------
    // FC06: WRITE SINGLE REGISTER (40001..40020)
    // ------------------------------------------------------------------------
    else if (modbusFc === 'FC06') {
      const regOffset = modbusStartAddr - 40001;
      const val16 = Math.max(0, Math.min(65535, modbusWriteVal));
      requestHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 06 ${toHex16(regOffset)} ${toHex16(val16)}`;

      if (regOffset < 0 || regOffset > 100) {
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 86 02`;
        description = `EXCEPTION 0x02: Illegal Holding Register Address @ ${modbusStartAddr}`;
      } else {
        // Echo request on successful write
        responseHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 06 ${toHex16(regOffset)} ${toHex16(val16)}`;
        description = `FC06 Write Single Register HR${modbusStartAddr} := ${val16} (0x${toHex16(val16)})`;

        // Update local holding registers map
        setHoldingRegisters(prev => ({ ...prev, [modbusStartAddr]: val16 }));
      }
    }

    // ------------------------------------------------------------------------
    // FC16 (0x10): WRITE MULTIPLE REGISTERS
    // ------------------------------------------------------------------------
    else if (modbusFc === 'FC16') {
      const regOffset = modbusStartAddr - 40001;
      const parsedVals = modbusWriteMultiVals.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      const qty = Math.max(1, Math.min(120, parsedVals.length || 1));
      const byteCount = qty * 2;
      const valHexes = parsedVals.slice(0, qty).map(v => toHex16(v)).join(' ');

      const reqLen = 7 + byteCount;
      requestHex = `${txIdHex} ${protoHex} ${toHex16(reqLen)} ${unitHex} 10 ${toHex16(regOffset)} ${toHex16(qty)} ${toHex8(byteCount)} ${valHexes}`;

      if (regOffset < 0 || regOffset > 100) {
        isError = true;
        responseHex = `${txIdHex} ${protoHex} 00 03 ${unitHex} 90 02`;
        description = `EXCEPTION 0x02: Illegal Holding Register Address @ ${modbusStartAddr}`;
      } else {
        responseHex = `${txIdHex} ${protoHex} 00 06 ${unitHex} 10 ${toHex16(regOffset)} ${toHex16(qty)}`;
        description = `FC16 Write ${qty} Registers starting @ HR${modbusStartAddr} -> [${parsedVals.slice(0, 4).join(', ')}]`;

        // Update holding registers state
        const updated: Record<number, number> = {};
        parsedVals.forEach((val, idx) => {
          updated[modbusStartAddr + idx] = val;
        });
        setHoldingRegisters(prev => ({ ...prev, ...updated }));
      }
    }

    // Push into traffic log
    setModbusTrafficLog(prev => [
      {
        id: `${Date.now()}-tx`,
        timestamp: now,
        direction: 'TX',
        hex: requestHex,
        description: `REQUEST -> ${description}`,
        fc: modbusFc,
        isError: false
      },
      {
        id: `${Date.now()}-rx`,
        timestamp: now,
        direction: 'RX',
        hex: responseHex,
        description: isError ? `RESPONSE <- ${description}` : `RESPONSE <- Server OK`,
        fc: modbusFc,
        isError: isError
      },
      ...prev.slice(0, 24)
    ]);

    addAuditLog(
      'SYSTEM',
      `Modbus TCP Poll: ${modbusFc} on Slave #${modbusSlaveId} (Addr: ${modbusStartAddr})`
    );
  };

  // Preset Shortcuts
  const applyPreset = (preset: {
    fc: typeof modbusFc;
    addr: number;
    qty?: number;
    writeVal?: number;
    coilState?: boolean;
    multiVals?: string;
  }) => {
    setModbusFc(preset.fc);
    setModbusStartAddr(preset.addr);
    if (preset.qty !== undefined) setModbusQuantity(preset.qty);
    if (preset.writeVal !== undefined) setModbusWriteVal(preset.writeVal);
    if (preset.coilState !== undefined) setModbusWriteCoilState(preset.coilState);
    if (preset.multiVals !== undefined) setModbusWriteMultiVals(preset.multiVals);
  };

  // Copy hex to clipboard
  const handleCopyHex = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  // ==========================================
  // IEC 60870-5-104 STATE & ACTIONS
  // ==========================================
  const [iecPort] = useState<number>(2404);
  const [iecCasdu, setIecCasdu] = useState<number>(1);
  const [iecIoa] = useState<number>(1001);
  const [iecCot] = useState<number>(3); // 3: Spontaneous, 20: General Interrogation
  const [iecNs, setIecNs] = useState<number>(12);
  const [iecNr] = useState<number>(12);
  const [t1Timer] = useState<number>(15); // s
  const [t2Timer] = useState<number>(10); // s
  const [t3Timer] = useState<number>(20); // s
  const [kParam] = useState<number>(12);
  const [wParam] = useState<number>(8);

  const [iecTrafficLog, setIecTrafficLog] = useState<Array<{
    id: string;
    timestamp: string;
    direction: 'TX' | 'RX';
    hex: string;
    asdu: string;
    cot: number;
    ioa: number;
    value: string;
  }>>([]);

  // Generate IEC 60870-5-104 ASDU Telegram
  const handleSendIec104 = (actionType: 'GI' | 'FLOAT_MEAS' | 'CMD') => {
    const now = new Date().toLocaleTimeString();
    let apduHex = '';
    let asduName = '';
    let cotVal = iecCot;
    let ioaVal = iecIoa;
    let valStr = '';

    const newNs = iecNs + 1;
    const nsHex = (newNs << 1).toString(16).padStart(4, '0').toUpperCase();
    const nrHex = (iecNr << 1).toString(16).padStart(4, '0').toUpperCase();
    setIecNs(newNs);

    if (actionType === 'GI') {
      asduName = 'C_IC_NA_1 (100) General Interrogation';
      cotVal = 6; // Activation
      ioaVal = 0;
      valStr = 'QOI=20 (Station Interrogation)';
      apduHex = `68 0E ${nsHex} ${nrHex} 64 01 06 00 ${iecCasdu.toString(16).padStart(2, '0')} 00 00 00 00 14`;
    } else if (actionType === 'FLOAT_MEAS') {
      asduName = 'M_ME_NC_1 (13) Measured Short Float';
      cotVal = 3; // Spontaneous
      ioaVal = 4001;
      const fVal = (tr1Telemetry?.activePower ?? 23800) / 1000; // MW
      valStr = `${fVal.toFixed(2)} MW (TR1 Active Power)`;
      apduHex = `68 12 ${nsHex} ${nrHex} 0D 01 03 00 ${iecCasdu.toString(16).padStart(2, '0')} 00 A1 0F 00 42 C8 00 00 00`;
    } else {
      asduName = 'C_SC_NA_1 (45) Single Command';
      cotVal = 6; // Activation
      ioaVal = 2001; // Breaker 52-1
      valStr = 'Select & Execute: TRIP 52-1';
      apduHex = `68 0E ${nsHex} ${nrHex} 2D 01 06 00 ${iecCasdu.toString(16).padStart(2, '0')} 00 D1 07 00 81`;
    }

    setIecTrafficLog(prev => [
      {
        id: `${Date.now()}`,
        timestamp: now,
        direction: 'TX',
        hex: apduHex,
        asdu: asduName,
        cot: cotVal,
        ioa: ioaVal,
        value: valStr
      },
      ...prev.slice(0, 18)
    ]);

    addAuditLog('SYSTEM', `IEC 60870-5-104 ASDU: ${asduName} to CASDU ${iecCasdu}`);
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Header */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-700/80 rounded-xl text-cyan-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-mono tracking-wide">
                {isAr ? 'خادم ومحاكي بروتوكولات Modbus TCP و IEC 60870-5-104' : 'Modbus TCP & IEC 60870-5-104 Gateway Emulator'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                SCADA GATEWAY
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAr
                ? 'محاكاة كاملة لبروتوكول Modbus TCP الصناعي مع دعم كامل لجميع رموز الوظائف (FC01-FC16) وخريطة الذاكرة الحية وفاحص الحزم'
                : 'Full-duplex Modbus TCP / IEC 104 gateway server emulator with dynamic memory registers, coils, frame builders & exception handling.'}
            </p>
          </div>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveProtocol('modbus')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeProtocol === 'modbus' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            Modbus TCP (Port {modbusPort})
          </button>
          <button
            onClick={() => setActiveProtocol('iec104')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeProtocol === 'iec104' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" />
            IEC 60870-5-104 (Port {iecPort})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODBUS TCP VIEW                                                           */}
      {/* ========================================================================= */}
      {activeProtocol === 'modbus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Controls & Client Request Generator (Left Column: 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {isAr ? 'مُرسل استعلامات Modbus TCP Master' : 'Modbus TCP Master Poll Dispatcher'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  PORT 502 ACTIVE
                </span>
              </div>

              {/* Unit ID & Function Code Select */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                    {isAr ? 'رقم الوحدة (Unit / Slave ID)' : 'Unit / Slave ID (1-247)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="247"
                    value={modbusSlaveId}
                    onChange={(e) => setModbusSlaveId(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                    {isAr ? 'رمز الوظيفة (Function Code)' : 'Function Code (FC)'}
                  </label>
                  <select
                    value={modbusFc}
                    onChange={(e) => handleFcChange(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="FC01">FC01 - Read Coils (0x)</option>
                    <option value="FC02">FC02 - Read Discrete Inputs (1x)</option>
                    <option value="FC03">FC03 - Read Holding Registers (4x)</option>
                    <option value="FC04">FC04 - Read Input Registers (3x)</option>
                    <option value="FC05">FC05 - Write Single Coil (0x)</option>
                    <option value="FC06">FC06 - Write Single Register (4x)</option>
                    <option value="FC16">FC16 (0x10) - Write Multiple Regs</option>
                  </select>
                </div>
              </div>

              {/* Address & Quantity / Values Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                    {isAr ? 'العنوان الأولي (Start Address)' : 'Starting Address'}
                  </label>
                  <input
                    type="number"
                    value={modbusStartAddr}
                    onChange={(e) => setModbusStartAddr(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                {/* Conditional Inputs depending on FC */}
                {(modbusFc === 'FC01' || modbusFc === 'FC02' || modbusFc === 'FC03' || modbusFc === 'FC04') && (
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                      {isAr ? 'الكمية (Quantity)' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={modbusFc === 'FC01' || modbusFc === 'FC02' ? 2000 : 125}
                      value={modbusQuantity}
                      onChange={(e) => setModbusQuantity(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                )}

                {modbusFc === 'FC05' && (
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                      {isAr ? 'حالة الـ Coil' : 'Coil State'}
                    </label>
                    <select
                      value={modbusWriteCoilState ? '1' : '0'}
                      onChange={(e) => setModbusWriteCoilState(e.target.value === '1')}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                    >
                      <option value="1">ON (0xFF00 - Force Energize)</option>
                      <option value="0">OFF (0x0000 - De-energize)</option>
                    </select>
                  </div>
                )}

                {modbusFc === 'FC06' && (
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                      {isAr ? 'القيمة للكتابة (16-bit)' : '16-bit Value (0-65535)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="65535"
                      value={modbusWriteVal}
                      onChange={(e) => setModbusWriteVal(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {modbusFc === 'FC16' && (
                <div className="text-xs font-mono">
                  <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                    {isAr ? 'قيم السجلات (مفصولة بفواصل)' : 'Register Values (Comma-separated words)'}
                  </label>
                  <input
                    type="text"
                    value={modbusWriteMultiVals}
                    onChange={(e) => setModbusWriteMultiVals(e.target.value)}
                    placeholder="13200, 1225, 238, 148"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              )}

              {/* Submit Poll Button */}
              <button
                onClick={handleSendModbus}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30 transition-all active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                {isAr ? 'إرسال استعلام وتحليل الإطار' : 'Send Modbus Poll & Decode MBAP Frame'}
              </button>

              {/* Quick Preset Buttons */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                  {isAr ? 'استعلامات سريعة جاهزة' : 'Quick SCADA Query Presets:'}
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  <button
                    onClick={() => {
                      applyPreset({ fc: 'FC03', addr: 40001, qty: 6 });
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-left text-cyan-300 transition"
                  >
                    ⚡ Poll TR1 Telemetry (FC03)
                  </button>
                  <button
                    onClick={() => {
                      applyPreset({ fc: 'FC01', addr: 1, qty: 8 });
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-left text-amber-300 transition"
                  >
                    🔌 Read Switchgear Coils (FC01)
                  </button>
                  <button
                    onClick={() => {
                      applyPreset({ fc: 'FC02', addr: 10001, qty: 7 });
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-left text-rose-300 transition"
                  >
                    🛡️ Read Protection Alarms (FC02)
                  </button>
                  <button
                    onClick={() => {
                      applyPreset({ fc: 'FC04', addr: 30001, qty: 6 });
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-left text-purple-300 transition"
                  >
                    📊 Read CT / Temp Inputs (FC04)
                  </button>
                  <button
                    onClick={() => {
                      applyPreset({ fc: 'FC05', addr: 7, coilState: !coils[7]?.state });
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-left text-emerald-300 transition"
                  >
                    🔄 Toggle Feeder 52-7 (FC05)
                  </button>
                  <button
                    onClick={() => {
                      applyPreset({ fc: 'FC06', addr: 40007, writeVal: 9 });
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-left text-blue-300 transition"
                  >
                    🎛️ Write Tap Pos #9 (FC06)
                  </button>
                </div>
              </div>
            </div>

            {/* MBAP Frame Anatomy Token Breakdown */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[11px]">
                  MBAP Header + PDU Protocol Anatomy
                </span>
                <span className="text-[10px] text-zinc-500">IEEE / Modbus.org RFC</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center">
                <div className="bg-cyan-950/60 border border-cyan-800/80 p-2 rounded-lg">
                  <div className="text-cyan-400 font-bold">Trans ID</div>
                  <div className="text-zinc-400 text-[9px] mt-0.5">2 Bytes</div>
                </div>
                <div className="bg-cyan-950/60 border border-cyan-800/80 p-2 rounded-lg">
                  <div className="text-cyan-400 font-bold">Proto (0)</div>
                  <div className="text-zinc-400 text-[9px] mt-0.5">2 Bytes</div>
                </div>
                <div className="bg-cyan-950/60 border border-cyan-800/80 p-2 rounded-lg">
                  <div className="text-cyan-400 font-bold">Length</div>
                  <div className="text-zinc-400 text-[9px] mt-0.5">2 Bytes</div>
                </div>
                <div className="bg-amber-950/60 border border-amber-800/80 p-2 rounded-lg">
                  <div className="text-amber-400 font-bold">Unit ID</div>
                  <div className="text-zinc-400 text-[9px] mt-0.5">1 Byte</div>
                </div>
                <div className="bg-emerald-950/60 border border-emerald-800/80 p-2 rounded-lg">
                  <div className="text-emerald-400 font-bold">PDU Data</div>
                  <div className="text-zinc-400 text-[9px] mt-0.5">N Bytes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Memory Maps & Hex Stream Traffic Inspector (Right Column: 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Register Memory Table with Sub-Tabs */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {isAr ? 'خريطة الذاكرة الحية لمحطة التحويل' : 'Substation Live Register Memory Map'}
                  </span>
                </div>

                {/* Sub-Tabs Selector */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg font-mono text-[11px]">
                  <button
                    onClick={() => setSelectedMemoryTable('HR')}
                    className={`px-2.5 py-1 rounded font-bold transition ${
                      selectedMemoryTable === 'HR' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Holding (4x)
                  </button>
                  <button
                    onClick={() => setSelectedMemoryTable('IR')}
                    className={`px-2.5 py-1 rounded font-bold transition ${
                      selectedMemoryTable === 'IR' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Input (3x)
                  </button>
                  <button
                    onClick={() => setSelectedMemoryTable('COIL')}
                    className={`px-2.5 py-1 rounded font-bold transition ${
                      selectedMemoryTable === 'COIL' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Coils (0x)
                  </button>
                  <button
                    onClick={() => setSelectedMemoryTable('DI')}
                    className={`px-2.5 py-1 rounded font-bold transition ${
                      selectedMemoryTable === 'DI' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Inputs (1x)
                  </button>
                </div>
              </div>

              {/* TABLE: Holding Registers (4x) */}
              {selectedMemoryTable === 'HR' && (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800">
                      <tr>
                        <th className="p-2">Address</th>
                        <th className="p-2">Parameter Description</th>
                        <th className="p-2">Raw (Dec)</th>
                        <th className="p-2">Hex</th>
                        <th className="p-2">Engineering Value</th>
                        <th className="p-2">Scale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {Object.entries(holdingRegisters).map(([addr, rawVal]) => {
                        const numVal = Number(rawVal);
                        let param = 'Custom Register';
                        let eng = `${numVal}`;
                        let scale = '1:1';
                        if (addr === '40001') { param = 'TR1 HV Voltage (kV)'; eng = `${(numVal / 100).toFixed(2)} kV`; scale = 'x100'; }
                        if (addr === '40002') { param = 'TR1 Load Current (A)'; eng = `${(numVal / 10).toFixed(1)} A`; scale = 'x10'; }
                        if (addr === '40003') { param = 'TR1 Active Power (MW)'; eng = `${(numVal / 10).toFixed(1)} MW`; scale = 'x10'; }
                        if (addr === '40004') { param = 'TR1 Reactive Power (MVAR)'; eng = `${(numVal / 10).toFixed(1)} MVAR`; scale = 'x10'; }
                        if (addr === '40005') { param = 'TR1 Top Oil Temp (°C)'; eng = `${(numVal / 10).toFixed(1)} °C`; scale = 'x10'; }
                        if (addr === '40006') { param = 'TR1 Hot Spot Winding Temp (°C)'; eng = `${(numVal / 10).toFixed(1)} °C`; scale = 'x10'; }
                        if (addr === '40007') { param = 'TR1 OLTC Tap Position'; eng = `Tap #${numVal}`; scale = '1:1'; }
                        if (addr === '40008') { param = 'TR2 HV Voltage (kV)'; eng = `${(numVal / 100).toFixed(2)} kV`; scale = 'x100'; }
                        if (addr === '40009') { param = 'TR2 Load Current (A)'; eng = `${(numVal / 10).toFixed(1)} A`; scale = 'x10'; }
                        if (addr === '40010') { param = 'Substation Grid Frequency (Hz)'; eng = `${(numVal / 100).toFixed(2)} Hz`; scale = 'x100'; }
                        if (addr === '40011') { param = 'TR1 Power Factor (cos φ)'; eng = `${(numVal / 1000).toFixed(3)}`; scale = 'x1000'; }
                        if (addr === '40012') { param = 'TR1 Voltage THD (%)'; eng = `${(numVal / 100).toFixed(2)} %`; scale = 'x100'; }
                        if (addr === '40013') { param = 'TR1 Energy Accumulator (High Word)'; eng = `${numVal}`; scale = '>>16'; }
                        if (addr === '40014') { param = 'TR1 Energy Accumulator (Low Word)'; eng = `${numVal}`; scale = '&0xFFFF'; }
                        if (addr === '40015') { param = 'Cooling Fans Operation Mode'; eng = numVal === 3 ? 'Stage 2 Peak' : numVal === 2 ? 'Stage 1 Auto' : 'OFF'; scale = 'Code'; }
                        if (addr === '40016') { param = 'Trip Reset Command Register'; eng = numVal === 1 ? 'RESET' : 'IDLE'; scale = 'Bitmask'; }

                        return (
                          <tr key={addr} className="hover:bg-zinc-900/50 transition">
                            <td className="p-2 font-bold text-cyan-400">{addr}</td>
                            <td className="p-2 text-zinc-300 font-sans text-[11px]">{param}</td>
                            <td className="p-2 text-zinc-400 font-mono">{numVal}</td>
                            <td className="p-2 text-amber-400 font-mono">0x{numVal.toString(16).padStart(4, '0').toUpperCase()}</td>
                            <td className="p-2 font-bold text-white">{eng}</td>
                            <td className="p-2 text-zinc-500 text-[10px]">{scale}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE: Input Registers (3x) */}
              {selectedMemoryTable === 'IR' && (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800">
                      <tr>
                        <th className="p-2">Address</th>
                        <th className="p-2">Telemetry Parameter</th>
                        <th className="p-2">Raw Value</th>
                        <th className="p-2">Hex</th>
                        <th className="p-2">Engineering Measurement</th>
                        <th className="p-2">Scaling</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {Object.entries(inputRegisters).map(([addr, item]) => (
                        <tr key={addr} className="hover:bg-zinc-900/50 transition">
                          <td className="p-2 font-bold text-purple-400">{addr}</td>
                          <td className="p-2 text-zinc-300 font-sans text-[11px]">{item.name}</td>
                          <td className="p-2 text-zinc-400 font-mono">{item.val}</td>
                          <td className="p-2 text-amber-400 font-mono">0x{item.val.toString(16).padStart(4, '0').toUpperCase()}</td>
                          <td className="p-2 font-bold text-white">{item.eng}</td>
                          <td className="p-2 text-zinc-500 text-[10px]">{item.scale}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE: Coils (0x) */}
              {selectedMemoryTable === 'COIL' && (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800">
                      <tr>
                        <th className="p-2">Address</th>
                        <th className="p-2">Device Tag</th>
                        <th className="p-2">Name / Functional Assignment</th>
                        <th className="p-2">State</th>
                        <th className="p-2">Hex Byte</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {Object.entries(coils).map(([addr, coil]) => (
                        <tr key={addr} className="hover:bg-zinc-900/50 transition">
                          <td className="p-2 font-bold text-amber-400">{addr.padStart(5, '0')}</td>
                          <td className="p-2 font-bold text-white">{coil.tag}</td>
                          <td className="p-2 text-zinc-300 font-sans text-[11px]">{coil.name}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              coil.state ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {coil.state ? 'CLOSED / ON (1)' : 'OPEN / OFF (0)'}
                            </span>
                          </td>
                          <td className="p-2 text-zinc-400 font-mono">0x{coil.state ? 'FF00' : '0000'}</td>
                          <td className="p-2">
                            {coil.switchKey && (
                              <button
                                onClick={() => toggleSwitch('TR-1', coil.switchKey!)}
                                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-bold transition"
                              >
                                Toggle
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE: Discrete Inputs (1x) */}
              {selectedMemoryTable === 'DI' && (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800">
                      <tr>
                        <th className="p-2">Address</th>
                        <th className="p-2">ANSI Tag</th>
                        <th className="p-2">Contact Description</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {Object.entries(discreteInputs).map(([addr, di]) => (
                        <tr key={addr} className="hover:bg-zinc-900/50 transition">
                          <td className="p-2 font-bold text-rose-400">{addr}</td>
                          <td className="p-2 font-bold text-white">{di.tag}</td>
                          <td className="p-2 text-zinc-300 font-sans text-[11px]">{di.name}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              di.state
                                ? (di.isAlarm ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {di.state ? (di.isAlarm ? 'ALARM / TRIP (1)' : 'HEALTHY / ARMED (1)') : 'NORMAL (0)'}
                            </span>
                          </td>
                          <td className="p-2 text-zinc-500 text-[10px]">{di.isAlarm ? 'PROTECTION' : 'SUPERVISORY'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modbus Traffic Hex Log Inspector */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {isAr ? 'سجل الحزم السداسي عشرية المباشر (Hex Packet Stream)' : 'Modbus TCP Live Hex Byte-Stream Inspector'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModbusTrafficLog([])}
                    className="text-[11px] text-zinc-400 hover:text-rose-400 font-mono flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto font-mono text-xs">
                {modbusTrafficLog.length === 0 ? (
                  <div className="text-zinc-600 text-center py-10 text-xs">
                    No Modbus frames captured. Click &quot;Send Modbus Poll&quot; or a quick preset above to generate traffic.
                  </div>
                ) : (
                  modbusTrafficLog.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                        log.isError
                          ? 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                          : log.direction === 'TX'
                          ? 'bg-cyan-950/20 border-cyan-800/50 text-cyan-300'
                          : 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${log.direction === 'TX' ? 'bg-cyan-900 text-cyan-200' : 'bg-emerald-900 text-emerald-200'}`}>
                            {log.direction}
                          </span>
                          <span>{log.timestamp}</span>
                          <span className="text-zinc-400 font-normal">({log.fc})</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 text-[10px] font-sans">{log.description}</span>
                          <button
                            onClick={() => handleCopyHex(log.id, log.hex)}
                            title="Copy Hex to clipboard"
                            className="text-zinc-400 hover:text-white transition"
                          >
                            {copiedLogId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-white bg-black/60 p-2 rounded-lg tracking-widest text-[11px] border border-zinc-800/80 overflow-x-auto select-all">
                        {log.hex}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IEC 60870-5-104 VIEW                                                      */}
      {/* ========================================================================= */}
      {activeProtocol === 'iec104' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* IEC-104 APDU & ASDU Controller */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  {isAr ? 'إرسال أوامر وبرقيات IEC 104' : 'IEC 104 ASDU Telegram Builder'}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Port 2404 / TCP</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1 font-bold">Common Address (CASDU)</label>
                  <input
                    type="number"
                    value={iecCasdu}
                    onChange={(e) => setIecCasdu(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1 font-bold">Sequence N(S) / N(R)</label>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-white text-xs">
                    N(S): {iecNs} | N(R): {iecNr}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">Quick ASDU Dispatch Actions:</span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleSendIec104('GI')}
                    className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-indigo-800/60 rounded-xl text-xs font-mono text-left flex items-center justify-between text-indigo-300 transition-all cursor-pointer"
                  >
                    <span><strong>ASDU 100:</strong> General Interrogation (C_IC_NA_1)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSendIec104('FLOAT_MEAS')}
                    className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-cyan-800/60 rounded-xl text-xs font-mono text-left flex items-center justify-between text-cyan-300 transition-all cursor-pointer"
                  >
                    <span><strong>ASDU 13:</strong> Measured Float (TR1 {((tr1Telemetry?.activePower ?? 23800)/1000).toFixed(1)} MW)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSendIec104('CMD')}
                    className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-amber-800/60 rounded-xl text-xs font-mono text-left flex items-center justify-between text-amber-300 transition-all cursor-pointer"
                  >
                    <span><strong>ASDU 45:</strong> Single Command (Trip CB 52-1)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Protocol Timers & Flow Parameters */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-2.5 text-[11px] font-mono">
                <div className="font-bold text-zinc-300 uppercase text-[10px]">Standard 104 Timers & Flow Windows:</div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-1.5 bg-zinc-950 rounded border border-zinc-800">
                    <div className="text-zinc-500">t1 (Ack)</div>
                    <div className="text-white font-bold">{t1Timer} s</div>
                  </div>
                  <div className="p-1.5 bg-zinc-950 rounded border border-zinc-800">
                    <div className="text-zinc-500">t2 (No-data)</div>
                    <div className="text-white font-bold">{t2Timer} s</div>
                  </div>
                  <div className="p-1.5 bg-zinc-950 rounded border border-zinc-800">
                    <div className="text-zinc-500">t3 (TestFR)</div>
                    <div className="text-white font-bold">{t3Timer} s</div>
                  </div>
                </div>
                <div className="flex justify-between text-zinc-400 text-[10px] pt-1">
                  <span>k-parameter (Max APDU unack): <strong>{kParam}</strong></span>
                  <span>w-parameter (Ack threshold): <strong>{wParam}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* IEC-104 Traffic Decoded Table */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  {isAr ? 'سجل برقيات IEC 60870-5-104 المفككة' : 'IEC 60870-5-104 Live APDU / ASDU Stream'}
                </span>
                <button
                  onClick={() => setIecTrafficLog([])}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono transition"
                >
                  Clear Log
                </button>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto font-mono text-xs">
                {iecTrafficLog.length === 0 ? (
                  <div className="text-zinc-600 text-center py-12 text-xs">
                    No IEC-104 telegrams recorded. Dispatch an ASDU action to inspect the protocol exchange.
                  </div>
                ) : (
                  iecTrafficLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-zinc-900/70 border border-indigo-900/50 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-400">{log.asdu}</span>
                        <span className="text-zinc-500">{log.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400">
                        <div>COT (Cause): <strong className="text-amber-400">{log.cot}</strong></div>
                        <div>IOA: <strong className="text-cyan-400">{log.ioa}</strong></div>
                        <div>Value: <strong className="text-white">{log.value}</strong></div>
                      </div>
                      <div className="font-mono text-white bg-black/50 p-2 rounded text-[10px] tracking-wider break-all">
                        {log.hex}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
