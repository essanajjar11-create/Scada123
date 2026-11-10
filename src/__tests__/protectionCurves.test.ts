import { describe, expect, it } from 'vitest';
import {
  NO_TRIP_SENTINEL_S,
  gradingMarginValid,
  iecOperatingTimeSeconds,
} from '../lib/engineering/protectionCurves';

describe('iecOperatingTimeSeconds', () => {
  it('computes the IEC Standard Inverse reference point (M=2, TMS=1)', () => {
    // t = 0.14 / (2^0.02 - 1) ~= 10.029 s
    expect(iecOperatingTimeSeconds(2 * 300, 300, 1, 'SI')).toBeCloseTo(10.029, 2);
  });

  it('computes VI, EI and LTI families at M=2, TMS=1', () => {
    expect(iecOperatingTimeSeconds(800, 400, 1, 'VI')).toBeCloseTo(13.5, 2);
    expect(iecOperatingTimeSeconds(800, 400, 1, 'EI')).toBeCloseTo(80 / 3, 2);
    expect(iecOperatingTimeSeconds(800, 400, 1, 'LTI')).toBeCloseTo(120, 2);
  });

  it('scales linearly with TMS', () => {
    const m5 = 0.14 / (Math.pow(5, 0.02) - 1);
    expect(iecOperatingTimeSeconds(1500, 300, 0.15, 'SI')).toBeCloseTo(parseFloat((0.15 * m5).toFixed(3)), 3);
  });

  it('refuses to trip at or below pickup current', () => {
    expect(iecOperatingTimeSeconds(299, 300, 0.5)).toBe(NO_TRIP_SENTINEL_S);
    expect(iecOperatingTimeSeconds(300, 300, 0.5)).toBe(NO_TRIP_SENTINEL_S);
    expect(iecOperatingTimeSeconds(0, 300, 0.5)).toBe(NO_TRIP_SENTINEL_S);
  });

  it('is monotonically decreasing with fault current', () => {
    let previous = Infinity;
    for (const mult of [1.2, 1.5, 2, 3, 5, 10]) {
      const time = iecOperatingTimeSeconds(mult * 300, 300, 0.3, 'EI');
      expect(time).toBeLessThan(previous);
      previous = time;
    }
  });
});

describe('gradingMarginValid', () => {
  it('requires at least the standard 300 ms CTI', () => {
    expect(gradingMarginValid(1.0, 0.7)).toBe(true);
    expect(gradingMarginValid(1.0, 0.71)).toBe(false);
    expect(gradingMarginValid(1.0, 0.7, 0.5)).toBe(false);
  });
});
