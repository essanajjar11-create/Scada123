/**
 * High-Fidelity Mathematical & Physical Model for 125 MVA Autotransformer
 * Model: ATDCTN-125000/220/110/10
 * Standard: IEC 60076-1, IEC 60076-2, IEC 60076-7, IEC 60214-1
 */

export interface AutotransformerParams {
  model: string;
  standard: string;
  ratedMVA: number; // 125 MVA
  ratedHV_kV: number; // 230 kV
  ratedMV_kV: number; // 121 kV
  ratedLV_kV: number; // 11 kV
  tertiaryMVA: number; // 41.7 MVA
  seriesWindingMVA: number; // 59.24 MVA
  commonWindingMVA: number; // 125 MVA
  ukHM_percent: number; // 12%
  ukHL_percent: number; // 30%
  ukML_percent: number; // 20%
  noLoadLossKW: number; // P0 = 55 kW
  loadLossKW: number; // Pk = 260 kW at 75°C
  noLoadCurrentPercent: number; // I0 = 0.3%
  zeroSeqImpedancePercent: number; // Z0 = 8%
  tapPositionsCount: number; // 19 positions (-9 to +9)
  tapStepPercent: number; // 1.78%
  oilWeightTons: number; // 30 t
  activePartWeightTons: number; // 70 t
  totalMassTons: number; // 135 t
  ratedTopOilRiseK: number; // 60 K
  ratedHotspotRiseK: number; // 78 K
  windingGradientK: number; // 18 K (78 - 60)
  hotspotFactorH: number; // 1.3
  oilTimeConstantSec: number; // 11520 s (~3.2 h)
  windingTimeConstantSec: number; // 360 s (6 min)
}

export const ATDCTN_125MVA_PARAMS: AutotransformerParams = {
  model: 'ATDCTN-125000/220/110/10',
  standard: 'IEC 60076-1 ... 60076-10',
  ratedMVA: 125,
  ratedHV_kV: 230,
  ratedMV_kV: 121,
  ratedLV_kV: 11,
  tertiaryMVA: 41.7,
  seriesWindingMVA: 59.24,
  commonWindingMVA: 125,
  ukHM_percent: 12.0,
  ukHL_percent: 30.0,
  ukML_percent: 20.0,
  noLoadLossKW: 55.0,
  loadLossKW: 260.0,
  noLoadCurrentPercent: 0.3,
  zeroSeqImpedancePercent: 8.0,
  tapPositionsCount: 19,
  tapStepPercent: 1.78,
  oilWeightTons: 30,
  activePartWeightTons: 70,
  totalMassTons: 135,
  ratedTopOilRiseK: 60.0,
  ratedHotspotRiseK: 78.0,
  windingGradientK: 18.0,
  hotspotFactorH: 1.3,
  oilTimeConstantSec: 11520, // 3.2 hours
  windingTimeConstantSec: 360, // 6 minutes
};

export interface TransformerPhysicalState {
  tapPosition: number; // 1 to 19 (10 is center nominal = 0)
  topOilTempC: number;
  windingTempC: number;
  hotSpotTempC: number;
  deltaHotSpotRiseK: number;
  loadingPercent: number;
  hvVoltageKV: number;
  mvVoltageKV: number;
  lvVoltageKV: number;
  currentHV_A: number;
  currentMV_A: number;
  activeLossKW: number;
  coreLossKW: number;
  copperLossKW: number;
  auxLossKW: number;
  efficiencyPercent: number;
  agingRate: number; // Relative aging rate V (1.0 at 98°C)
  coolingStatus: 'ONAN' | 'ONAF_STAGE_1' | 'ONAF_STAGE_2' | 'STANDBY';
  protectionStatus: {
    otiAlarm: boolean; // Oil temp > 85°C
    otiTrip: boolean;  // Oil temp > 100°C
    wtiAlarm: boolean; // Hot spot > 100°C
    wtiTrip: boolean;  // Hot spot > 120°C
  };
}

/**
 * 3-Winding Star Equivalent Branch Impedances on 125 MVA Base
 */
export function calculateStarImpedances(params = ATDCTN_125MVA_PARAMS) {
  const { ukHM_percent: uHM, ukHL_percent: uHL, ukML_percent: uML } = params;
  const zH_percent = 0.5 * (uHM + uHL - uML); // (12 + 30 - 20) / 2 = 11.0%
  const zM_percent = 0.5 * (uHM + uML - uHL); // (12 + 20 - 30) / 2 = 1.0%
  const zL_percent = 0.5 * (uHL + uML - uHM); // (30 + 20 - 12) / 2 = 19.0%

  // Base impedance referred to 121 kV
  const zBaseMV = (params.ratedMV_kV * params.ratedMV_kV) / params.ratedMVA; // 117.128 Ohm
  const rHM_percent = (params.loadLossKW / (params.ratedMVA * 1000)) * 100; // 0.208%
  const xHM_percent = Math.sqrt(Math.max(0, uHM * uHM - rHM_percent * rHM_percent)); // 11.998%

  return {
    zH_percent,
    zM_percent,
    zL_percent,
    zBaseMV_Ohm: zBaseMV,
    rHM_Ohm_75C: (rHM_percent / 100) * zBaseMV, // 0.2436 Ohm
    xHM_Ohm: (xHM_percent / 100) * zBaseMV, // 14.053 Ohm
  };
}

/**
 * Full Dynamic Simulation Step for ATDCTN-125000/220/110/10
 * 
 * @param prevState Previous physical state of the transformer
 * @param fedHV_kV Actual bus voltage on HV side (kV)
 * @param isEnergized Whether the transformer breaker/isolators are closed
 * @param pMW Load active power (MW) on 110 kV feeder
 * @param qMVAr Load reactive power (MVAr) on 110 kV feeder
 * @param ambientTempC Real-time ambient environment temperature (°C)
 * @param dtSec Simulation time step (default ~10 seconds for smooth differential integration)
 * @param coolingOverride Optional manual override for cooling fans
 */
export function stepAutotransformer125MVA(
  prevState: TransformerPhysicalState,
  fedHV_kV: number,
  isEnergized: boolean,
  pMW: number,
  qMVAr: number,
  ambientTempC: number,
  dtSec: number = 10,
  coolingOverride?: 'AUTO' | 'FORCE_ONAN' | 'FORCE_ONAF1' | 'FORCE_ONAF2'
): TransformerPhysicalState {
  const params = ATDCTN_125MVA_PARAMS;
  const star = calculateStarImpedances(params);

  // If not energized, cool down gradually towards ambient temperature
  if (!isEnergized || fedHV_kV < 10) {
    const coolRate = Math.exp(-dtSec / (params.oilTimeConstantSec * 1.5));
    const newOilTemp = ambientTempC + (prevState.topOilTempC - ambientTempC) * coolRate;
    const newWindingTemp = ambientTempC + (prevState.windingTempC - ambientTempC) * Math.exp(-dtSec / 600);
    const newHotSpot = newOilTemp;

    return {
      tapPosition: prevState.tapPosition,
      topOilTempC: Number(Math.max(ambientTempC, newOilTemp).toFixed(2)),
      windingTempC: Number(Math.max(ambientTempC, newWindingTemp).toFixed(2)),
      hotSpotTempC: Number(Math.max(ambientTempC, newHotSpot).toFixed(2)),
      deltaHotSpotRiseK: 0,
      loadingPercent: 0,
      hvVoltageKV: 0,
      mvVoltageKV: 0,
      lvVoltageKV: 0,
      currentHV_A: 0,
      currentMV_A: 0,
      activeLossKW: 0,
      coreLossKW: 0,
      copperLossKW: 0,
      auxLossKW: 0,
      efficiencyPercent: 100,
      agingRate: 0.01,
      coolingStatus: 'STANDBY',
      protectionStatus: {
        otiAlarm: false,
        otiTrip: false,
        wtiAlarm: false,
        wtiTrip: false,
      },
    };
  }

  // 1. OLTC Voltage Calculation
  // Tap index k_tap in [-9, +9] where tapPosition is 1..19 (10 is nominal = 0)
  const tapOffset = Math.min(9, Math.max(-9, prevState.tapPosition - 10));
  const nominalRatioAtTap = (params.ratedHV_kV) / (params.ratedMV_kV * (1 + tapOffset * (params.tapStepPercent / 100)));
  const ratedMVAtTap = params.ratedMV_kV * (1 + tapOffset * (params.tapStepPercent / 100));

  // 2. Copper Resistance Temperature Correction (T_w in °C)
  const tw = prevState.windingTempC || 75;
  const rActualOhm = star.rHM_Ohm_75C * ((235 + tw) / 310);
  const xActualOhm = star.xHM_Ohm;

  // 3. Voltage Drop under Load
  // Delta_U = (P * R + Q * X) / V_nom + ((P * X - Q * R)^2) / (2 * V_nom^3)
  const vNom = Math.max(10, ratedMVAtTap);
  const dropLinear = (pMW * rActualOhm + qMVAr * xActualOhm) / vNom;
  const dropQuadratic = Math.pow(pMW * xActualOhm - qMVAr * rActualOhm, 2) / (2 * Math.pow(vNom, 3));
  const deltaU = dropLinear + dropQuadratic;
  
  // No-load MV voltage is determined by actual fed HV voltage ratio
  const actualNoLoadMV = fedHV_kV / nominalRatioAtTap;
  const actualMV = Math.max(0, actualNoLoadMV - deltaU);

  // 4. Loading Ratio and Currents
  const sMVA = Math.sqrt(pMW * pMW + qMVAr * qMVAr);
  const loadingRatio = sMVA / params.ratedMVA;
  const loadingPercent = Number((loadingRatio * 100).toFixed(1));

  // Currents: I = S / (sqrt(3) * V) * 1000
  const currentHV = (sMVA * 1000) / (Math.sqrt(3) * Math.max(1, fedHV_kV));
  const currentMV = (sMVA * 1000) / (Math.sqrt(3) * Math.max(1, actualMV));

  // 5. Losses Calculations
  // Core loss depends on applied HV voltage (P0 ~ (U / Un)^1.9)
  const coreLossKW = params.noLoadLossKW * Math.pow(fedHV_kV / params.ratedHV_kV, 1.9);

  // Copper losses split into DC ohmic and stray/eddy losses
  const pDc75 = 0.80 * params.loadLossKW; // 208 kW
  const pStray75 = 0.20 * params.loadLossKW; // 52 kW
  const copperLossKW = Math.pow(loadingRatio, 2) * (
    pDc75 * ((235 + tw) / 310) +
    pStray75 * (310 / (235 + tw))
  );

  // 6. Cooling Controls & Auxiliary Power
  let coolingStatus: 'ONAN' | 'ONAF_STAGE_1' | 'ONAF_STAGE_2' | 'STANDBY' = 'ONAN';
  let auxLossKW = 0;

  if (coolingOverride === 'FORCE_ONAF2') {
    coolingStatus = 'ONAF_STAGE_2';
    auxLossKW = 7.5;
  } else if (coolingOverride === 'FORCE_ONAF1') {
    coolingStatus = 'ONAF_STAGE_1';
    auxLossKW = 3.6;
  } else if (coolingOverride === 'FORCE_ONAN') {
    coolingStatus = 'ONAN';
    auxLossKW = 0;
  } else {
    // Auto Cooling Staging based on temperature & loading thresholds
    if (prevState.topOilTempC >= 75 || prevState.hotSpotTempC >= 85 || loadingPercent > 90) {
      coolingStatus = 'ONAF_STAGE_2';
      auxLossKW = 7.5; // All fans running
    } else if (prevState.topOilTempC >= 55 || prevState.hotSpotTempC >= 65 || loadingPercent > 65) {
      coolingStatus = 'ONAF_STAGE_1';
      auxLossKW = 3.6; // Stage 1 fans running
    } else {
      coolingStatus = 'ONAN';
      auxLossKW = 0;
    }
  }

  const activeLossKW = coreLossKW + copperLossKW + auxLossKW;

  // Efficiency
  const totalPowerOutKW = pMW * 1000;
  const efficiencyPercent = totalPowerOutKW > 0 
    ? (totalPowerOutKW / (totalPowerOutKW + activeLossKW)) * 100 
    : 99.8;

  // 7. Dynamic Thermal Differential Equations (IEC 60076-7)
  // Top Oil Exponent x: 0.8 for ONAN, 0.85 for ONAF
  const oilExponentX = coolingStatus === 'ONAN' ? 0.8 : 0.85;
  const lossRatioR = params.loadLossKW / params.noLoadLossKW; // 4.727

  // Ultimate steady-state top-oil temperature rise (Delta_theta_or = 60 K)
  const lossFactor = (1 + lossRatioR * Math.pow(loadingRatio, 2)) / (1 + lossRatioR);
  const deltaThetaO_ultimate = params.ratedTopOilRiseK * Math.pow(Math.max(0.01, lossFactor), oilExponentX);

  // Time constant adjustment for active cooling
  let tauO = params.oilTimeConstantSec;
  if (coolingStatus === 'ONAF_STAGE_2') tauO *= 0.75;
  else if (coolingStatus === 'ONAF_STAGE_1') tauO *= 0.88;

  // Numerical Euler integration for Top Oil:
  // dTheta_o / dt = (deltaThetaO_ultimate - (theta_o - theta_a)) / tau_o
  const currentOilRise = Math.max(0, prevState.topOilTempC - ambientTempC);
  const dOilRise = (deltaThetaO_ultimate - currentOilRise) / tauO;
  const newOilTemp = prevState.topOilTempC + dOilRise * dtSec;

  // Hot-spot temperature gradient (Delta_theta_h)
  // Steady state: Delta_theta_h_ultimate = H * g_r * K^y
  const windingExponentY = 1.3;
  const deltaHotspot_ultimate = params.hotspotFactorH * params.windingGradientK * Math.pow(loadingRatio, windingExponentY);
  
  // Numerical integration for Hot-spot:
  // dDelta_theta_h / dt = (deltaHotspot_ultimate - Delta_theta_h) / tau_w
  const prevDeltaH = prevState.deltaHotSpotRiseK ?? (prevState.hotSpotTempC - prevState.topOilTempC);
  const dDeltaH = (deltaHotspot_ultimate - prevDeltaH) / params.windingTimeConstantSec;
  const newDeltaH = Math.max(0, prevDeltaH + dDeltaH * dtSec);

  // Total hot-spot temperature: theta_h = theta_o + Delta_theta_h
  const newHotSpot = newOilTemp + newDeltaH;
  // Average winding temperature: approx theta_o + 0.65 * Delta_theta_h
  const newWindingTemp = newOilTemp + 0.65 * newDeltaH;

  // 8. Relative Aging Rate (IEC 60076-7)
  // V = 2 ^ ((theta_h - 98) / 6)
  const agingExponent = (newHotSpot - 98.0) / 6.0;
  const agingRate = Math.min(256.0, Math.max(0.01, Math.pow(2, agingExponent)));

  // Tertiary 11 kV terminal voltage tracks actual HV busbar voltage ratio when energized
  const actualLV = Number((params.ratedLV_kV * (fedHV_kV / params.ratedHV_kV)).toFixed(2));

  // 9. Protection Relays / Alarms
  const otiAlarm = newOilTemp >= 85.0;
  const otiTrip = newOilTemp >= 100.0;
  const wtiAlarm = newHotSpot >= 100.0;
  const wtiTrip = newHotSpot >= 120.0;

  return {
    tapPosition: prevState.tapPosition,
    topOilTempC: Number(newOilTemp.toFixed(2)),
    windingTempC: Number(newWindingTemp.toFixed(2)),
    hotSpotTempC: Number(newHotSpot.toFixed(2)),
    deltaHotSpotRiseK: Number(newDeltaH.toFixed(2)),
    loadingPercent: Number(loadingPercent.toFixed(1)),
    hvVoltageKV: Number(fedHV_kV.toFixed(2)),
    mvVoltageKV: Number(actualMV.toFixed(2)),
    lvVoltageKV: actualLV,
    currentHV_A: Number(currentHV.toFixed(1)),
    currentMV_A: Number(currentMV.toFixed(1)),
    activeLossKW: Number(activeLossKW.toFixed(1)),
    coreLossKW: Number(coreLossKW.toFixed(1)),
    copperLossKW: Number(copperLossKW.toFixed(1)),
    auxLossKW: Number(auxLossKW.toFixed(1)),
    efficiencyPercent: Number(efficiencyPercent.toFixed(2)),
    agingRate: Number(agingRate.toFixed(2)),
    coolingStatus,
    protectionStatus: {
      otiAlarm,
      otiTrip,
      wtiAlarm,
      wtiTrip,
    },
  };
}
