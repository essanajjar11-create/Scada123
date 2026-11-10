/**
 * IEEE C57.91 / IEC 60076-7 Transformer Thermal & Insulation Aging Model
 * (Pure Functions) - Top-oil rise, winding hot-spot, Arrhenius aging
 * acceleration factor (F_AA), loss-of-life and paper DP estimation.
 */

export type CoolingMode = 'ONAN' | 'ONAF' | 'OFAF';

export const REFERENCE_HOTSPOT_C = 110;
export const BASE_INSULATION_LIFE_HOURS = 180_000;

interface CoolingConstants {
  deltaTopOilRated: number;
  xExp: number;
  yExp: number;
  windingGradientRated: number;
  oilDiff: number;
}

const COOLING_CONSTANTS: Record<CoolingMode, CoolingConstants> = {
  ONAN: { deltaTopOilRated: 45, xExp: 0.8, yExp: 1.6, windingGradientRated: 22, oilDiff: 18 },
  ONAF: { deltaTopOilRated: 38, xExp: 0.9, yExp: 1.6, windingGradientRated: 18, oilDiff: 14 },
  OFAF: { deltaTopOilRated: 32, xExp: 1.0, yExp: 2.0, windingGradientRated: 14, oilDiff: 10 },
};

/** Loss ratio = (1 + R*K^2) / (1 + R) with R = load-loss / no-load loss ratio. */
export function lossRatio(loadRatioK: number, rRatio: number = 5.2): number {
  const k = Math.max(0, loadRatioK);
  return (1 + rRatio * k * k) / (1 + rRatio);
}

/** Aging acceleration factor relative to 110 C reference hot-spot (IEEE C57.91). */
export function agingAccelerationFactor(hotSpotTempC: number): number {
  if (!Number.isFinite(hotSpotTempC)) return 0.01;
  const exponent = 15000 / 383.15 - 15000 / (hotSpotTempC + 273.15);
  return Math.max(0.01, Math.exp(exponent));
}

/** Daily loss of insulation life in percent for a constant F_AA over 24 h. */
export function dailyLossOfLifePct(faa: number, baseLifeHours: number = BASE_INSULATION_LIFE_HOURS): number {
  return ((faa * 24) / baseLifeHours) * 100;
}

/** Remaining insulation hours at constant aging factor faa. */
export function remainingInsulationHours(consumedHours: number, faa: number, baseLifeHours: number = BASE_INSULATION_LIFE_HOURS): number {
  return (baseLifeHours - consumedHours) / (faa || 1);
}

/** Kraft-paper degree of polymerization estimate clamped to [200, 1200]. */
export function degreeOfPolymerization(faa: number, baselineDp: number = 780): number {
  const dpWear = (faa - 1.0) * 45;
  return Math.max(200, Math.min(1200, Math.round(baselineDp - dpWear)));
}

export interface ThermalProfileInput {
  ambientTempC: number;
  loadRatioK: number;
  coolingMode: CoolingMode;
  rRatio?: number;
  hotSpotFactorH?: number;
}

export interface ThermalProfile {
  topOilTempC: number;
  bottomOilTempC: number;
  hotSpotTempC: number;
  agingFactorFaa: number;
  dailyLolPct: number;
  dp: number;
}

/** IEEE C57.91 steady-state thermal profile: Theta_TO + H*g_r*K^y hot-spot model. */
export function computeThermalProfile(input: ThermalProfileInput): ThermalProfile {
  const c = COOLING_CONSTANTS[input.coolingMode];
  const r = input.rRatio ?? 5.2;
  const h = input.hotSpotFactorH ?? 1.3;
  const k = Math.max(0, input.loadRatioK);

  const deltaTopOil = c.deltaTopOilRated * Math.pow(lossRatio(k, r), c.xExp);
  const topOilTempC = input.ambientTempC + deltaTopOil;
  const bottomOilTempC = Math.max(input.ambientTempC + 5, topOilTempC - c.oilDiff);
  const hotSpotTempC = topOilTempC + h * c.windingGradientRated * Math.pow(k, c.yExp);
  const faa = agingAccelerationFactor(hotSpotTempC);

  return {
    topOilTempC,
    bottomOilTempC,
    hotSpotTempC,
    agingFactorFaa: faa,
    dailyLolPct: dailyLossOfLifePct(faa),
    dp: degreeOfPolymerization(faa),
  };
}
