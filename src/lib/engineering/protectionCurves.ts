/**
 * IEC 60255-151 Overcurrent Relay Time-Characteristic Curves (Pure Functions)
 * Standard Inverse (SI), Very Inverse (VI), Extremely Inverse (EI),
 * Long-Time Inverse (LTI) plus downstream grading-margin validation.
 */

export type IecCurveType = 'SI' | 'VI' | 'EI' | 'LTI';

const CURVE_CONSTANTS: Record<IecCurveType, { a: number; p: number }> = {
  SI: { a: 0.14, p: 0.02 },
  VI: { a: 13.5, p: 1 },
  EI: { a: 80, p: 2 },
  LTI: { a: 120, p: 1 },
};

export const NO_TRIP_SENTINEL_S = 999;
export const MIN_TRIP_TIME_S = 0.02;

/**
 * Relay operating time in seconds.
 * t = TMS * ( A / ((I/Is)^p - 1) )
 * Returns NO_TRIP_SENTINEL_S below pickup or for degenerate inputs.
 */
export function iecOperatingTimeSeconds(
  faultCurrentA: number,
  pickupCurrentA: number,
  tms: number,
  curveType: IecCurveType = 'SI',
  opts?: { minTimeS?: number; noTripS?: number }
): number {
  const minTimeS = opts?.minTimeS ?? MIN_TRIP_TIME_S;
  const noTripS = opts?.noTripS ?? NO_TRIP_SENTINEL_S;
  if (!Number.isFinite(faultCurrentA) || !Number.isFinite(pickupCurrentA) || !Number.isFinite(tms)) return noTripS;
  if (faultCurrentA <= pickupCurrentA || pickupCurrentA <= 0 || tms <= 0) return noTripS;
  const ratio = faultCurrentA / pickupCurrentA;
  if (ratio <= 1.001) return noTripS;
  const denominator = Math.pow(ratio, CURVE_CONSTANTS[curveType].p) - 1;
  if (denominator <= 0) return noTripS;
  const time = tms * (CURVE_CONSTANTS[curveType].a / denominator);
  if (!Number.isFinite(time)) return noTripS;
  return Math.max(minTimeS, parseFloat(time.toFixed(3)));
}

/** Coordination check: upstream must clear at least `minMarginS` after downstream. */
export function gradingMarginValid(upperTimeS: number, lowerTimeS: number, minMarginS: number = 0.3): boolean {
  return upperTimeS - lowerTimeS >= minMarginS;
}
