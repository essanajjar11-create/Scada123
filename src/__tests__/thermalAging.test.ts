import { describe, expect, it } from 'vitest';
import {
  agingAccelerationFactor,
  agingAccelerationFactor as faa,
  computeThermalProfile,
  dailyLossOfLifePct,
  degreeOfPolymerization,
  remainingInsulationHours,
} from '../lib/engineering/thermalAging';

describe('agingAccelerationFactor (IEEE C57.91)', () => {
  it('equals 1.0 at the 110 C reference hot-spot', () => {
    expect(faa(110)).toBeCloseTo(1.0, 6);
  });

  it('accelerates above and decelerates below the reference', () => {
    expect(faa(140)).toBeGreaterThan(1);
    expect(faa(80)).toBeLessThan(1);
    expect(faa(140)).toBeGreaterThan(faa(120));
  });

  it('never returns less than 0.01 even for absurd inputs', () => {
    expect(faa(-273.15)).toBeGreaterThanOrEqual(0.01);
    expect(faa(NaN)).toBe(0.01);
  });
});

describe('loss of life helpers', () => {
  it('computes daily LOL percent from F_AA', () => {
    expect(dailyLossOfLifePct(1)).toBeCloseTo((24 / 180000) * 100, 9);
    expect(dailyLossOfLifePct(2)).toBeCloseTo(dailyLossOfLifePct(1) * 2, 9);
  });

  it('computes remaining insulation hours', () => {
    expect(remainingInsulationHours(22450, 2)).toBe(78775);
    expect(remainingInsulationHours(0, 0)).toBe(180000);
  });
});

describe('degreeOfPolymerization', () => {
  it('clamps to the [200, 1200] band around the baseline', () => {
    expect(degreeOfPolymerization(100)).toBe(200);
    expect(degreeOfPolymerization(0.01)).toBe(Math.min(1200, Math.round(780 + 0.99 * 45)));
  });
});

describe('computeThermalProfile', () => {
  it('matches rated-condition hand calculation for ONAN at K=1', () => {
    const p = computeThermalProfile({ ambientTempC: 30, loadRatioK: 1, coolingMode: 'ONAN' });
    expect(p.topOilTempC).toBeCloseTo(75, 6);
    expect(p.bottomOilTempC).toBeCloseTo(57, 6);
    expect(p.hotSpotTempC).toBeCloseTo(30 + 45 + 1.3 * 22, 6);
    expect(p.hotSpotTempC).toBeLessThan(110);
    expect(p.agingFactorFaa).toBeLessThan(1);
    expect(p.dailyLolPct).toBeGreaterThan(0);
  });

  it('hot-spot rises with load ratio and cooling mode aggressiveness', () => {
    const onan = computeThermalProfile({ ambientTempC: 40, loadRatioK: 1.08, coolingMode: 'ONAN' });
    const ofaf = computeThermalProfile({ ambientTempC: 40, loadRatioK: 1.08, coolingMode: 'OFAF' });
    expect(ofaf.hotSpotTempC).toBeLessThan(onan.hotSpotTempC);

    const halfLoad = computeThermalProfile({ ambientTempC: 40, loadRatioK: 0.5, coolingMode: 'ONAN' });
    expect(halfLoad.hotSpotTempC).toBeLessThan(onan.hotSpotTempC);
  });

  it('keeps DP consistent with the aging factor', () => {
    const p = computeThermalProfile({ ambientTempC: 25, loadRatioK: 0.7, coolingMode: 'ONAF' });
    expect(p.dp).toBe(degreeOfPolymerization(p.agingFactorFaa));
    expect(agingAccelerationFactor(110)).toBeDefined();
  });
});
