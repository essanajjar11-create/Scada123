import { BayMeasurements, SubstationState, TransformerData } from '../types/substation';
import { 
  stepAutotransformer125MVA, 
  ATDCTN_125MVA_PARAMS, 
  TransformerPhysicalState 
} from './autotransformer125MVA';

// High-Voltage Overhead Transmission Line Specifications: ACSR Zebra (400 mm²)
export const LINE_PARAMS = {
  R1_per_km: 0.083986, // Ohm/km at 75°C
  X1_per_km: 0.400000, // Ohm/km at 50Hz
  lengths: {
    'W1_1': 25, // km (Line W1 I)
    'W2': 40,   // km (Line W2)
    'W1_2': 18, // km (Line W1 II)
  }
};

/**
 * Exact Electrical Substation Load Flow & Multi-Physics Dynamic Calculation
 * 
 * Implements:
 * 1. Kirchhoff's Current Law (KCL) & Power Balance at Busbars
 * 2. Impedance-Weighted Parallel Power Flow Sharing
 * 3. Longitudinal & Transverse Voltage Drop (KVL) on Transmission Lines
 * 4. Bus Coupler Inter-Bus Power Flow Transfer
 * 5. Dynamic Non-Linear Transformer Losses (P_Fe(U) + P_Cu(K, Tw) + P_aux)
 * 6. Frequency Droop Characteristics
 * 7. IEC 60076-7 Dynamic Thermal Equations (Top-Oil, Hot-Spot, Aging Rate)
 */
export function calculateSubstationPhysics(
  state: SubstationState,
  baseGridKV: number,
  ambientTempC: number,
  lineLoads: Record<string, { pMW: number; qMVAr: number }>
): {
  measurements: Record<string, BayMeasurements>;
  transformers: Record<'T1' | 'T2', TransformerData>;
  bus1Energized: boolean;
  bus2Energized: boolean;
} {
  const { switchgears, transformers: prevTx, faultActive, faultType } = state;

  // =========================================================================
  // 1. TOPOLOGICAL CONNECTIVITY OF ALL SWITCHES
  // =========================================================================
  const w1_1_connected = switchgears['CB1']?.state === 'CLOSED' && 
                         switchgears['DS1']?.state === 'CLOSED' && 
                         switchgears['DS2']?.state === 'CLOSED';

  const w2_connected = switchgears['CB2']?.state === 'CLOSED' && 
                       switchgears['DS4']?.state === 'CLOSED' && 
                       switchgears['DS5']?.state === 'CLOSED';

  const busCouplerClosed = switchgears['CB4']?.state === 'CLOSED' &&
                           switchgears['DS7']?.state === 'CLOSED' &&
                           switchgears['DS8']?.state === 'CLOSED';

  const w1_2_connected = switchgears['CB3']?.state === 'CLOSED' && 
                         switchgears['DS3']?.state === 'CLOSED' && 
                         switchgears['DS6']?.state === 'CLOSED';

  const t1_connected = switchgears['CB5']?.state === 'CLOSED' &&
                       switchgears['DS9']?.state === 'CLOSED' &&
                       switchgears['DS10']?.state === 'CLOSED';

  const t2_connected = switchgears['CB6']?.state === 'CLOSED' &&
                       switchgears['DS11']?.state === 'CLOSED' &&
                       switchgears['DS12']?.state === 'CLOSED';

  // =========================================================================
  // 2. BUSBAR ENERGIZATION & ISLANDING
  // =========================================================================
  const bus1HasDirectSource = w1_1_connected || w2_connected;
  const bus2HasDirectSource = w1_2_connected;

  let bus1Energized = bus1HasDirectSource;
  let bus2Energized = bus2HasDirectSource;

  if (busCouplerClosed) {
    if (bus1HasDirectSource || bus2HasDirectSource) {
      bus1Energized = true;
      bus2Energized = true;
    }
  }

  // =========================================================================
  // 3. TRANSFORMER 110 kV CONSUMER DEMANDS
  // =========================================================================
  const t1LoadSetting = lineLoads['BAY_T1'] || { pMW: 70.0, qMVAr: 33.9 };
  const t2LoadSetting = lineLoads['BAY_T2'] || { pMW: 65.0, qMVAr: 31.48 };

  const p_load_T1 = (t1_connected && bus1Energized) ? t1LoadSetting.pMW : 0.0;
  const q_load_T1 = (t1_connected && bus1Energized) ? (t1LoadSetting.qMVAr ?? p_load_T1 * 0.484) : 0.0;

  const p_load_T2 = (t2_connected && bus2Energized) ? t2LoadSetting.pMW : 0.0;
  const q_load_T2 = (t2_connected && bus2Energized) ? (t2LoadSetting.qMVAr ?? p_load_T2 * 0.484) : 0.0;

  // =========================================================================
  // 4. LINE IMPEDANCES & ADMITTANCE WEIGHTS
  // =========================================================================
  // Z = R + jX
  const r1 = LINE_PARAMS.R1_per_km * LINE_PARAMS.lengths['W1_1']; // 2.10 Ohm
  const x1 = LINE_PARAMS.X1_per_km * LINE_PARAMS.lengths['W1_1']; // 10.0 Ohm
  const z1_mag = Math.sqrt(r1 * r1 + x1 * x1);                   // 10.22 Ohm
  const y1 = 1 / z1_mag;                                         // 0.0978 mho

  const r2 = LINE_PARAMS.R1_per_km * LINE_PARAMS.lengths['W2'];   // 3.36 Ohm
  const x2 = LINE_PARAMS.X1_per_km * LINE_PARAMS.lengths['W2'];   // 16.0 Ohm
  const z2_mag = Math.sqrt(r2 * r2 + x2 * x2);                   // 16.35 Ohm
  const y2 = 1 / z2_mag;                                         // 0.0612 mho

  const r3 = LINE_PARAMS.R1_per_km * LINE_PARAMS.lengths['W1_2']; // 1.51 Ohm
  const x3 = LINE_PARAMS.X1_per_km * LINE_PARAMS.lengths['W1_2']; // 7.20 Ohm
  const z3_mag = Math.sqrt(r3 * r3 + x3 * x3);                   // 7.36 Ohm
  const y3 = 1 / z3_mag;                                         // 0.1359 mho

  // =========================================================================
  // 5. ITERATIVE LOAD FLOW (Solves Bus Voltages, Losses, and Powers iteratively)
  // =========================================================================
  let v_bus1 = bus1Energized ? baseGridKV : 0.0;
  let v_bus2 = bus2Energized ? baseGridKV : 0.0;

  let p_W1 = 0, q_W1 = 0;
  let p_W2 = 0, q_W2 = 0;
  let p_W12 = 0, q_W12 = 0;
  let p_coupler = 0, q_coupler = 0;

  let nextPhysT1: TransformerPhysicalState | null = null;
  let nextPhysT2: TransformerPhysicalState | null = null;

  // Run 3 rapid iterations for high-precision convergence between voltage drops & losses
  for (let iter = 0; iter < 3; iter++) {
    // 5.1 Simulate Transformers at current bus voltages
    const prevPhysT1: TransformerPhysicalState = {
      tapPosition: prevTx.T1.tapPosition || 10,
      topOilTempC: prevTx.T1.topOilTempC ?? 48.0,
      windingTempC: prevTx.T1.windingTempC ?? 55.0,
      hotSpotTempC: prevTx.T1.hotSpotTempC ?? (prevTx.T1.topOilTempC + 10.0),
      deltaHotSpotRiseK: prevTx.T1.deltaHotSpotRiseK ?? 10.0,
      loadingPercent: prevTx.T1.loadingPercent || 0,
      hvVoltageKV: v_bus1,
      mvVoltageKV: prevTx.T1.mvVoltageKV || 0,
      lvVoltageKV: 11.0,
      currentHV_A: 0,
      currentMV_A: 0,
      activeLossKW: prevTx.T1.activeLossKW || 0,
      coreLossKW: prevTx.T1.coreLossKW || 55.0,
      copperLossKW: prevTx.T1.copperLossKW || 0,
      auxLossKW: prevTx.T1.auxLossKW || 0,
      efficiencyPercent: prevTx.T1.efficiencyPercent || 99.8,
      agingRate: prevTx.T1.agingRate || 0.01,
      coolingStatus: prevTx.T1.coolingStatus || 'ONAN',
      protectionStatus: prevTx.T1.protectionStatus || { otiAlarm: false, otiTrip: false, wtiAlarm: false, wtiTrip: false },
    };

    let coolingT1Override = prevTx.T1.coolingModeOverride;
    if (faultActive && faultType === 'TX_OVERHEAT') {
      coolingT1Override = 'FORCE_ONAN';
    }

    nextPhysT1 = stepAutotransformer125MVA(
      prevPhysT1,
      v_bus1,
      t1_connected && bus1Energized,
      p_load_T1,
      q_load_T1,
      ambientTempC,
      6.0,
      coolingT1Override
    );

    const prevPhysT2: TransformerPhysicalState = {
      tapPosition: prevTx.T2.tapPosition || 10,
      topOilTempC: prevTx.T2.topOilTempC ?? 47.0,
      windingTempC: prevTx.T2.windingTempC ?? 54.0,
      hotSpotTempC: prevTx.T2.hotSpotTempC ?? (prevTx.T2.topOilTempC + 10.0),
      deltaHotSpotRiseK: prevTx.T2.deltaHotSpotRiseK ?? 10.0,
      loadingPercent: prevTx.T2.loadingPercent || 0,
      hvVoltageKV: v_bus2,
      mvVoltageKV: prevTx.T2.mvVoltageKV || 0,
      lvVoltageKV: 11.0,
      currentHV_A: 0,
      currentMV_A: 0,
      activeLossKW: prevTx.T2.activeLossKW || 0,
      coreLossKW: prevTx.T2.coreLossKW || 55.0,
      copperLossKW: prevTx.T2.copperLossKW || 0,
      auxLossKW: prevTx.T2.auxLossKW || 0,
      efficiencyPercent: prevTx.T2.efficiencyPercent || 99.8,
      agingRate: prevTx.T2.agingRate || 0.01,
      coolingStatus: prevTx.T2.coolingStatus || 'ONAN',
      protectionStatus: prevTx.T2.protectionStatus || { otiAlarm: false, otiTrip: false, wtiAlarm: false, wtiTrip: false },
    };

    nextPhysT2 = stepAutotransformer125MVA(
      prevPhysT2,
      v_bus2,
      t2_connected && bus2Energized,
      p_load_T2,
      q_load_T2,
      ambientTempC,
      6.0,
      prevTx.T2.coolingModeOverride
    );

    // Apply overheat temperature surge if fault is active
    if (faultActive && faultType === 'TX_OVERHEAT') {
      nextPhysT1.topOilTempC = Math.min(130, Number((nextPhysT1.topOilTempC + 0.4).toFixed(2)));
      nextPhysT1.hotSpotTempC = Math.min(150, Number((nextPhysT1.topOilTempC + 25.0).toFixed(2)));
      nextPhysT1.windingTempC = Number((nextPhysT1.topOilTempC + 16.0).toFixed(2));
      nextPhysT1.agingRate = Math.min(256, Number(Math.pow(2, (nextPhysT1.hotSpotTempC - 98) / 6).toFixed(2)));
      nextPhysT1.protectionStatus.otiAlarm = nextPhysT1.topOilTempC >= 85;
      nextPhysT1.protectionStatus.otiTrip = nextPhysT1.topOilTempC >= 100;
      nextPhysT1.protectionStatus.wtiAlarm = nextPhysT1.hotSpotTempC >= 100;
      nextPhysT1.protectionStatus.wtiTrip = nextPhysT1.hotSpotTempC >= 120;
    }

    // 5.2 Total HV Power Demands (including internal losses & reactive magnetization)
    const q_loss_T1 = (t1_connected && bus1Energized) 
      ? 0.375 + 15.0 * Math.pow(nextPhysT1.loadingPercent / 100, 2) 
      : 0;
    const p_T1_HV = (t1_connected && bus1Energized) ? (p_load_T1 + nextPhysT1.activeLossKW / 1000) : 0;
    const q_T1_HV = (t1_connected && bus1Energized) ? (q_load_T1 + q_loss_T1) : 0;

    const q_loss_T2 = (t2_connected && bus2Energized) 
      ? 0.375 + 15.0 * Math.pow(nextPhysT2.loadingPercent / 100, 2) 
      : 0;
    const p_T2_HV = (t2_connected && bus2Energized) ? (p_load_T2 + nextPhysT2.activeLossKW / 1000) : 0;
    const q_T2_HV = (t2_connected && bus2Energized) ? (q_load_T2 + q_loss_T2) : 0;

    // 5.3 Network Power Flow & Kirchhoff's Current Law (KCL)
    if (busCouplerClosed && (bus1Energized || bus2Energized)) {
      // Solidly Coupled Bus 1 and Bus 2
      const p_total_sub = p_T1_HV + p_T2_HV;
      const q_total_sub = q_T1_HV + q_T2_HV;

      const y_active_sum = (w1_1_connected ? y1 : 0) + 
                           (w2_connected ? y2 : 0) + 
                           (w1_2_connected ? y3 : 0);

      if (y_active_sum > 0) {
        p_W1 = w1_1_connected ? (y1 / y_active_sum) * p_total_sub : 0;
        q_W1 = w1_1_connected ? (y1 / y_active_sum) * q_total_sub : 0;

        p_W2 = w2_connected ? (y2 / y_active_sum) * p_total_sub : 0;
        q_W2 = w2_connected ? (y2 / y_active_sum) * q_total_sub : 0;

        p_W12 = w1_2_connected ? (y3 / y_active_sum) * p_total_sub : 0;
        q_W12 = w1_2_connected ? (y3 / y_active_sum) * q_total_sub : 0;
      } else {
        p_W1 = 0; q_W1 = 0; p_W2 = 0; q_W2 = 0; p_W12 = 0; q_W12 = 0;
      }

      // Bus Coupler Net Inter-Bus Power Flow (from Bus 1 to Bus 2)
      // KCL at Bus 1: Sum(In) - Sum(Out) = Coupler Flow
      p_coupler = (p_W1 + p_W2) - p_T1_HV;
      q_coupler = (q_W1 + q_W2) - q_T1_HV;

    } else {
      // Isolated Busbars (Bus Coupler Open)
      p_coupler = 0;
      q_coupler = 0;

      // Bus 1 Sub-network
      const y_bus1_sum = (w1_1_connected ? y1 : 0) + (w2_connected ? y2 : 0);
      if (y_bus1_sum > 0 && bus1Energized) {
        p_W1 = w1_1_connected ? (y1 / y_bus1_sum) * p_T1_HV : 0;
        q_W1 = w1_1_connected ? (y1 / y_bus1_sum) * q_T1_HV : 0;

        p_W2 = w2_connected ? (y2 / y_bus1_sum) * p_T1_HV : 0;
        q_W2 = w2_connected ? (y2 / y_bus1_sum) * q_T1_HV : 0;
      } else {
        p_W1 = 0; q_W1 = 0; p_W2 = 0; q_W2 = 0;
      }

      // Bus 2 Sub-network
      if (w1_2_connected && bus2Energized) {
        p_W12 = p_T2_HV;
        q_W12 = q_T2_HV;
      } else {
        p_W12 = 0; q_W12 = 0;
      }
    }

    // 5.4 Transmission Line Voltage Drop (Longitudinal + Transverse dV)
    const calcDrop = (p: number, q: number, r: number, x: number) => {
      if (baseGridKV <= 10) return 0;
      const dV_lin = (p * r + q * x) / baseGridKV;
      const dV_quad = Math.pow(p * x - q * r, 2) / (2 * Math.pow(baseGridKV, 3));
      return dV_lin + dV_quad;
    };

    const dV1 = w1_1_connected ? calcDrop(p_W1, q_W1, r1, x1) : 0;
    const dV2 = w2_connected ? calcDrop(p_W2, q_W2, r2, x2) : 0;
    const dV3 = w1_2_connected ? calcDrop(p_W12, q_W12, r3, x3) : 0;

    const v_term1 = w1_1_connected ? Math.max(0, baseGridKV - dV1) : 0;
    const v_term2 = w2_connected ? Math.max(0, baseGridKV - dV2) : 0;
    const v_term3 = w1_2_connected ? Math.max(0, baseGridKV - dV3) : 0;

    // 5.5 Update Busbar Voltages for next iteration
    if (busCouplerClosed) {
      const activeTerminals = [
        ...(w1_1_connected ? [{ v: v_term1, y: y1 }] : []),
        ...(w2_connected ? [{ v: v_term2, y: y2 }] : []),
        ...(w1_2_connected ? [{ v: v_term3, y: y3 }] : []),
      ];
      if (activeTerminals.length > 0) {
        const sumVy = activeTerminals.reduce((acc, t) => acc + t.v * t.y, 0);
        const sumY = activeTerminals.reduce((acc, t) => acc + t.y, 0);
        const v_coupled = sumVy / sumY;
        v_bus1 = v_coupled;
        v_bus2 = v_coupled;
      } else {
        v_bus1 = 0; v_bus2 = 0;
      }
    } else {
      // Bus 1
      const b1Terms = [
        ...(w1_1_connected ? [{ v: v_term1, y: y1 }] : []),
        ...(w2_connected ? [{ v: v_term2, y: y2 }] : []),
      ];
      if (b1Terms.length > 0) {
        v_bus1 = b1Terms.reduce((acc, t) => acc + t.v * t.y, 0) / b1Terms.reduce((acc, t) => acc + t.y, 0);
      } else {
        v_bus1 = 0;
      }

      // Bus 2
      v_bus2 = w1_2_connected ? v_term3 : 0;
    }
  }

  // =========================================================================
  // 6. FREQUENCY DROOP DYNAMICS
  // =========================================================================
  const p_total_system = p_W1 + p_W2 + p_W12;
  // Standard power system droop: ~0.0012 Hz per MW deviation from nominal
  const deltaF = -(p_total_system - 135.0) * 0.0012;
  const gridFrequencyHz = Number((50.000 + deltaF + Math.sin(Date.now() / 4000) * 0.012).toFixed(3));

  // =========================================================================
  // 7. BAY MEASUREMENTS CREATION
  // =========================================================================
  const measurements: Record<string, BayMeasurements> = {};

  const makeMeasurement = (
    bayId: string,
    voltageLL: number,
    pMW: number,
    qMVAr: number,
    flowDirection?: 'BUS1_TO_BUS2' | 'BUS2_TO_BUS1' | 'NONE'
  ): BayMeasurements => {
    if (voltageLL <= 0.5) {
      return {
        voltageL1N_kV: 0,
        voltageL2N_kV: 0,
        voltageL3N_kV: 0,
        voltageLL_kV: 0,
        currentL1_A: 0,
        currentL2_A: 0,
        currentL3_A: 0,
        activePowerMW: 0,
        reactivePowerMVAr: 0,
        apparentPowerMVA: 0,
        frequencyHz: 50.0,
        powerFactor: 1.0,
        energyImportMWh: state.measurements[bayId]?.energyImportMWh || 12450.0,
        ...(flowDirection !== undefined ? { flowDirection: 'NONE' } : {}),
      };
    }

    // 3-Phase fault on Bay W1'
    if (faultActive && faultType === '3PH_FAULT' && bayId === 'BAY_W1_1') {
      const faultCurrent = 38500;
      return {
        voltageL1N_kV: 12.2,
        voltageL2N_kV: 12.1,
        voltageL3N_kV: 12.4,
        voltageLL_kV: 21.3,
        currentL1_A: faultCurrent,
        currentL2_A: faultCurrent * 0.99,
        currentL3_A: faultCurrent * 1.01,
        activePowerMW: 14.5,
        reactivePowerMVAr: 820.0,
        apparentPowerMVA: 820.5,
        frequencyHz: 49.62,
        powerFactor: 0.12,
        energyImportMWh: (state.measurements[bayId]?.energyImportMWh || 12450.0) + 0.1,
      };
    }

    const sMVA = Math.sqrt(pMW * pMW + qMVAr * qMVAr);
    const iA = (sMVA * 1000) / (Math.sqrt(3) * voltageLL);
    const pf = sMVA > 0 ? Math.min(1.0, Math.max(0.1, Math.abs(pMW) / sMVA)) : 1.0;
    const vLN = voltageLL / Math.sqrt(3);

    const prevEnergy = state.measurements[bayId]?.energyImportMWh || 14500.0;
    const newEnergy = prevEnergy + (Math.abs(pMW) * (1 / 3600));

    return {
      voltageL1N_kV: Number((vLN * 1.002).toFixed(2)),
      voltageL2N_kV: Number((vLN * 0.998).toFixed(2)),
      voltageL3N_kV: Number(vLN.toFixed(2)),
      voltageLL_kV: Number(voltageLL.toFixed(2)),
      currentL1_A: Number((iA * 1.003).toFixed(1)),
      currentL2_A: Number((iA * 0.997).toFixed(1)),
      currentL3_A: Number(iA.toFixed(1)),
      activePowerMW: Number(pMW.toFixed(2)),
      reactivePowerMVAr: Number(qMVAr.toFixed(2)),
      apparentPowerMVA: Number(sMVA.toFixed(2)),
      frequencyHz: gridFrequencyHz,
      powerFactor: Number(pf.toFixed(3)),
      energyImportMWh: Number(newEnergy.toFixed(3)),
      ...(flowDirection !== undefined ? { flowDirection } : {}),
    };
  };

  // Line Measurements
  measurements['BAY_W1_1'] = makeMeasurement('BAY_W1_1', w1_1_connected ? v_bus1 : 0, p_W1, q_W1);
  measurements['BAY_W2'] = makeMeasurement('BAY_W2', w2_connected ? v_bus1 : 0, p_W2, q_W2);
  measurements['BAY_W1_2'] = makeMeasurement('BAY_W1_2', w1_2_connected ? v_bus2 : 0, p_W12, q_W12);

  // Bus Coupler Measurements (preserve directional sign for inter-bus power transfer animation)
  const couplerFlowS = Math.sqrt(p_coupler * p_coupler + q_coupler * q_coupler);
  const couplerVoltage = busCouplerClosed ? Math.max(v_bus1, v_bus2) : 0;
  const couplerDir: 'BUS1_TO_BUS2' | 'BUS2_TO_BUS1' | 'NONE' =
    !busCouplerClosed || couplerFlowS <= 0.2
      ? 'NONE'
      : Math.abs(p_coupler) >= 0.05
      ? p_coupler >= 0
        ? 'BUS1_TO_BUS2'
        : 'BUS2_TO_BUS1'
      : q_coupler >= 0
      ? 'BUS1_TO_BUS2'
      : 'BUS2_TO_BUS1';

  measurements['BAY_COUPLER'] = makeMeasurement(
    'BAY_COUPLER',
    couplerVoltage,
    busCouplerClosed ? Math.abs(p_coupler) : 0,
    busCouplerClosed ? Math.abs(q_coupler) : 0,
    couplerDir
  );

  // Busbar VT Measurements
  measurements['BUS1'] = makeMeasurement('BUS1', v_bus1, 0, 0);
  measurements['BUS2'] = makeMeasurement('BUS2', v_bus2, 0, 0);

  // Transformer Outgoing 110 kV Measurements
  measurements['BAY_T1'] = makeMeasurement(
    'BAY_T1', 
    (t1_connected && bus1Energized) ? (nextPhysT1?.mvVoltageKV ?? 121.0) : 0, 
    p_load_T1, 
    q_load_T1
  );

  measurements['BAY_T2'] = makeMeasurement(
    'BAY_T2', 
    (t2_connected && bus2Energized) ? (nextPhysT2?.mvVoltageKV ?? 121.0) : 0, 
    p_load_T2, 
    q_load_T2
  );

  // =========================================================================
  // 8. UPDATE TRANSFORMER DATA RECORDS
  // =========================================================================
  const updatedTransformers: Record<'T1' | 'T2', TransformerData> = {
    T1: {
      ...prevTx.T1,
      model: ATDCTN_125MVA_PARAMS.model,
      mvaRating: ATDCTN_125MVA_PARAMS.ratedMVA,
      hvVoltageKV: nextPhysT1?.hvVoltageKV ?? v_bus1,
      mvVoltageKV: nextPhysT1?.mvVoltageKV ?? 0,
      lvVoltageKV: nextPhysT1?.lvVoltageKV ?? 0,
      tapPosition: nextPhysT1?.tapPosition ?? prevTx.T1.tapPosition,
      topOilTempC: nextPhysT1?.topOilTempC ?? prevTx.T1.topOilTempC,
      windingTempC: nextPhysT1?.windingTempC ?? prevTx.T1.windingTempC,
      hotSpotTempC: nextPhysT1?.hotSpotTempC,
      deltaHotSpotRiseK: nextPhysT1?.deltaHotSpotRiseK,
      loadingPercent: nextPhysT1?.loadingPercent ?? 0,
      activeLossKW: nextPhysT1?.activeLossKW ?? 0,
      coreLossKW: nextPhysT1?.coreLossKW,
      copperLossKW: nextPhysT1?.copperLossKW,
      auxLossKW: nextPhysT1?.auxLossKW,
      efficiencyPercent: nextPhysT1?.efficiencyPercent,
      agingRate: nextPhysT1?.agingRate,
      coolingStatus: nextPhysT1?.coolingStatus ?? 'ONAN',
      protectionStatus: nextPhysT1?.protectionStatus,
    },
    T2: {
      ...prevTx.T2,
      model: ATDCTN_125MVA_PARAMS.model,
      mvaRating: ATDCTN_125MVA_PARAMS.ratedMVA,
      hvVoltageKV: nextPhysT2?.hvVoltageKV ?? v_bus2,
      mvVoltageKV: nextPhysT2?.mvVoltageKV ?? 0,
      lvVoltageKV: nextPhysT2?.lvVoltageKV ?? 0,
      tapPosition: nextPhysT2?.tapPosition ?? prevTx.T2.tapPosition,
      topOilTempC: nextPhysT2?.topOilTempC ?? prevTx.T2.topOilTempC,
      windingTempC: nextPhysT2?.windingTempC ?? prevTx.T2.windingTempC,
      hotSpotTempC: nextPhysT2?.hotSpotTempC,
      deltaHotSpotRiseK: nextPhysT2?.deltaHotSpotRiseK,
      loadingPercent: nextPhysT2?.loadingPercent ?? 0,
      activeLossKW: nextPhysT2?.activeLossKW ?? 0,
      coreLossKW: nextPhysT2?.coreLossKW,
      copperLossKW: nextPhysT2?.copperLossKW,
      auxLossKW: nextPhysT2?.auxLossKW,
      efficiencyPercent: nextPhysT2?.efficiencyPercent,
      agingRate: nextPhysT2?.agingRate,
      coolingStatus: nextPhysT2?.coolingStatus ?? 'ONAN',
      protectionStatus: nextPhysT2?.protectionStatus,
    },
  };

  return {
    measurements,
    transformers: updatedTransformers,
    bus1Energized,
    bus2Energized,
  };
}
