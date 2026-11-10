/**
 * IEC 60909-0 Short-Circuit Current Calculation (Pure Functions)
 *
 * Implements the standardized equivalent voltage source method for
 * far-from-generator faults:
 *  - Voltage factors c_max / c_min (Table 1)
 *  - Network feeder impedance from Sk'' (c = 1.0 convention)
 *  - Two-winding transformer correction factor K_T (clause 3.3.3)
 *  - Initial symmetrical short-circuit current Ik''
 *  - Peak short-circuit current ip via kappa = 1.02 + 0.98*exp(-3R/X)
 *  - Single-phase-to-earth current via the Z1+Z2+Z0 loop
 */

import { SYSTEM_FREQUENCY_HZ } from './systemConstants';

/** IEC 60909-0 Table 1 voltage factors. */
export function voltageFactors(unKV: number): { cMax: number; cMin: number } {
  if (!Number.isFinite(unKV) || unKV <= 0) return { cMax: 1.1, cMin: 1.0 };
  if (unKV <= 1.0) {
    return { cMax: 1.05, cMin: 0.95 };
  }
  return { cMax: 1.1, cMin: 1.0 };
}

export interface ComplexImpedance {
  re: number; // R [ohm]
  im: number; // X [ohm]
}

export function impedanceMagnitude(z: ComplexImpedance): number {
  return Math.hypot(z.re, z.im);
}

/** Upstream network feeder impedance: Z_Q = c * Un^2 / Sk'' with c = 1.0. */
export function networkFeederImpedance(skMva: number, unKv: number, rxRatio: number = 10): ComplexImpedance {
  if (skMva <= 0 || unKv <= 0) return { re: 0, im: 0 };
  const magnitude = (unKv * unKv) / skMva; // ohm (three-phase: Z = Un^2 / Sk)
  const x = magnitude / Math.sqrt(1 + 1 / (rxRatio * rxRatio));
  const r = x / rxRatio;
  return { re: r, im: x };
}

/**
 * Corrected transformer impedance (two-winding).
 * K_T = 0.95 * c_max / (1 + 0.6 * x_T_pu), applied per IEC 60909 clause 3.3.3.
 */
export function transformerCorrectionFactor(xTPu: number, cMax: number = 1.1): number {
  if (!Number.isFinite(xTPu) || xTPu <= 0) return 1.0;
  return (0.95 * cMax) / (1 + 0.6 * xTPu);
}

export interface TransformerImpedanceInput {
  ratedPowerMva: number;
  shortCircuitVoltagePct: number; // uk (%)
  xrRatio?: number;
  cMax?: number;
  applyCorrection?: boolean;
}

/** Transformer positive-sequence impedance referred to the MV/LV side chosen via unKV. */
export function transformerImpedance(t: TransformerImpedanceInput, unKv: number): ComplexImpedance {
  if (t.ratedPowerMva <= 0 || unKv <= 0) return { re: 0, im: 0 };
  const xr = t.xrRatio ?? 15;
  const zTMag = ((t.shortCircuitVoltagePct / 100) * (unKv * unKv)) / t.ratedPowerMva; // ohm
  const xT = zTMag / Math.sqrt(1 + 1 / (xr * xr));
  const rT = xT / xr;
  let z: ComplexImpedance = { re: rT, im: xT };

  if (t.applyCorrection !== false) {
    const xTPu = (t.shortCircuitVoltagePct / 100) * (1 / Math.sqrt(1 + 1 / (xr * xr)));
    const kt = transformerCorrectionFactor(xTPu, t.cMax ?? voltageFactors(unKv).cMax);
    z = { re: z.re * kt, im: z.im * kt };
  }
  return z;
}

/** Line impedance from specific values. */
export function lineImpedance(rPerKmOhm: number, xPerKmOhm: number, lengthKm: number): ComplexImpedance {
  return { re: rPerKmOhm * lengthKm, im: xPerKmOhm * lengthKm };
}

export function addImpedance(...parts: ComplexImpedance[]): ComplexImpedance {
  return parts.reduce((acc, p) => ({ re: acc.re + p.re, im: acc.im + p.im }), { re: 0, im: 0 });
}

/** DC-component time constant T_a = X / (omega * R) [seconds]. */
export function dcTimeConstant(z: ComplexImpedance, frequencyHz: number = SYSTEM_FREQUENCY_HZ): number {
  if (z.re <= 0) return Infinity;
  return z.im / (2 * Math.PI * frequencyHz * z.re);
}

/** IEC 60909 peak factor: kappa = 1.02 + 0.98 * exp(-3R/X). */
export function peakFactor(z: ComplexImpedance): number {
  if (z.re === 0 && z.im === 0) return 1.02;
  if (z.re < 0) return 1.02;
  return 1.02 + 0.98 * Math.exp((-3 * z.re) / z.im);
}

export interface ShortCircuitNetworkInput {
  /** Nominal line-to-line voltage at the short-circuit location [kV]. */
  unKv: number;
  /** Initial symmetrical short-circuit power of the upstream network Sk'' [MVA]. */
  gridSkMva: number;
  /** Upstream network X/R ratio (typical HV: 8-15). */
  gridRxRatio?: number;
  /** Interposed transformer between grid and fault point (omit for busbar-fed directly). */
  transformer?: TransformerImpedanceInput;
  /** Line section between source and fault point (specific ohmic values per km). */
  line?: { rPerKmOhm: number; xPerKmOhm: number; lengthKm: number };
  /**
   * Zero-sequence to positive-sequence impedance ratio Z0/Z1 at the fault point
   * (typical HV overhead lines: 2.0 - 3.5, cables near 1.0-2.0).
   */
  zeroSequenceRatio?: number;
}

export interface ShortCircuitResult {
  unKv: number;
  cMax: number;
  cMin: number;
  z1: ComplexImpedance;
  z1MagnitudeOhm: number;
  z0: ComplexImpedance;
  kappa: number;
  taMs: number;
  /** Initial symmetrical current, maximum excitation [kA]. */
  ik3phMaxKa: number;
  /** Initial symmetrical current, minimum excitation [kA]. */
  ik3phMinKa: number;
  /** Single-phase-to-earth initial symmetrical current, max excitation [kA]. */
  ik1phMaxKa: number;
  /** Peak short-circuit current ip = kappa * sqrt(2) * Ik'' [kA]. */
  ipPeakKa: number;
  /** Thermal equivalent short-time current, far-from-generator (m=0, n=1) [kA]. */
  ithKa: number;
  /** Fault-point short-circuit power Sk'' = sqrt(3)*Un*Ik'' [MVA]. */
  skMva: number;
}

/**
 * Full IEC 60909 evaluation at the defined short-circuit location.
 * Far-from-generator assumptions: mu = 1, n = 1, m = 0 (conservative).
 */
export function calculateShortCircuit(input: ShortCircuitNetworkInput): ShortCircuitResult {
  const { cMax, cMin } = voltageFactors(input.unKv);

  const zq = networkFeederImpedance(input.gridSkMva, input.unKv, input.gridRxRatio ?? 10);
  const parts: ComplexImpedance[] = [zq];
  if (input.transformer) {
    parts.push(transformerImpedance(input.transformer, input.unKv));
  }
  if (input.line) {
    parts.push(lineImpedance(input.line.rPerKmOhm, input.line.xPerKmOhm, input.line.lengthKm));
  }

  const z1 = addImpedance(...parts);
  const z1Mag = impedanceMagnitude(z1) || 1e-9;

  // Zero-sequence approximation: Z0 = k0 * Z1 (static network, Z2 = Z1).
  const k0 = input.zeroSequenceRatio ?? 3.0;
  const z0: ComplexImpedance = { re: z1.re * k0, im: z1.im * k0 };

  // Un[kV] / Z[ohm] yields kA directly.
  const ik3Max = (cMax * input.unKv) / (Math.sqrt(3) * z1Mag);
  const ik3Min = (cMin * input.unKv) / (Math.sqrt(3) * z1Mag);

  const zLoop = addImpedance(z1, z1, z0);
  const ik1Max = (Math.sqrt(3) * cMax * input.unKv) / impedanceMagnitude(zLoop);

  const kappa = peakFactor(z1);
  const ipPeak = kappa * Math.sqrt(2) * ik3Max;
  const ta = dcTimeConstant(z1);

  return {
    unKv: input.unKv,
    cMax,
    cMin,
    z1,
    z1MagnitudeOhm: z1Mag,
    z0,
    kappa,
    taMs: Number.isFinite(ta) ? ta * 1000 : Infinity,
    ik3phMaxKa: ik3Max,
    ik3phMinKa: ik3Min,
    ik1phMaxKa: ik1Max,
    ipPeakKa: ipPeak,
    ithKa: ik3Max,
    skMva: Math.sqrt(3) * input.unKv * ik3Max,
  };
}
