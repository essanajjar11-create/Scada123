import { describe, expect, it } from 'vitest';
import {
  criticalClearingAngleEqualArea,
  criticalClearingTime,
  initialRotorAngle,
  simulateSwing,
  unstableEquilibriumAngle,
} from '../lib/engineering/transientStability';

const STABLE_CASE = {
  hSeconds: 5,
  pMechPn: 0.5,
  pMaxPn: 1.5,
  clearTimeSec: 0.08,
  simTimeSec: 3,
  dtSec: 0.001,
};

describe('rotor angle equilibria', () => {
  it('satisfies the pre-fault power balance sin(d0) = Pm/Pmax', () => {
    const d0 = initialRotorAngle(0.5, 1.5);
    expect(Math.sin(d0)).toBeCloseTo(0.5 / 1.5, 9);
  });

  it('places the unstable equilibrium at pi - d0', () => {
    const d0 = initialRotorAngle(0.5, 1.5);
    expect(unstableEquilibriumAngle(0.5, 1.5)).toBeCloseTo(Math.PI - d0, 9);
  });
});

describe('equal-area criterion', () => {
  it('matches the textbook closed form for the classical case', () => {
    // H = 5, Pm = 0.5, Pmax = 1.5 -> d0 = asin(1/3) ~= 0.3398 rad
    const dcr = criticalClearingAngleEqualArea(0.5, 1.5);
    expect(dcr).not.toBeNull();
    // Hand check: cos(dcr) = -cos(d0) + k(pi - 2 d0)
    const d0 = Math.asin(1 / 3);
    const expected = Math.acos(-Math.cos(d0) + (1 / 3) * (Math.PI - 2 * d0));
    expect(dcr!).toBeCloseTo(expected, 9);
    // Must lie between the two equilibria
    expect(dcr!).toBeGreaterThan(d0);
    expect(dcr!).toBeLessThan(Math.PI - d0);
  });

  it('keeps the critical angle between the two equilibria under heavy loading', () => {
    const dcrHeavy = criticalClearingAngleEqualArea(0.9, 1.0);
    expect(dcrHeavy).not.toBeNull();
    const d0Heavy = Math.asin(0.9);
    const dUHeavy = Math.PI - d0Heavy;
    expect(dcrHeavy!).toBeGreaterThan(d0Heavy);
    expect(dcrHeavy!).toBeLessThan(dUHeavy);
    // Heavier pre-fault loading leaves less deceleration margin
    const d0Light = Math.asin(0.3);
    const dcrLight = criticalClearingAngleEqualArea(0.3, 1.0)!;
    expect(dUHeavy - dcrHeavy!).toBeLessThan(Math.PI - d0Light - dcrLight);
  });
});

describe('time-domain swing simulation', () => {
  it('stays stable for a fast clearing time', () => {
    const res = simulateSwing(STABLE_CASE);
    expect(res.stable).toBe(true);
    const dUdeg = (unstableEquilibriumAngle(0.5, 1.5) * 180) / Math.PI;
    expect(res.maxDeltaDeg).toBeLessThan(dUdeg);
  });

  it('swings around the new equilibrium and settles with damping', () => {
    const res = simulateSwing({ ...STABLE_CASE, dampingD: 12, simTimeSec: 6 });
    expect(res.stable).toBe(true);
    // Final angle must sit near the post-fault equilibrium sin(d)=Pm/Pmax
    const expectedDeg = (Math.asin(0.5 / 1.5) * 180) / Math.PI;
    expect(Math.abs(res.finalDeltaDeg - expectedDeg)).toBeLessThan(3);
  });

  it('loses synchronism when the fault clears after the CCT', () => {
    const slowClear = simulateSwing({ ...STABLE_CASE, clearTimeSec: 0.6 });
    expect(slowClear.stable).toBe(false);
  });

  it('reduces the transfer capability post-fault and still recovers when area exists', () => {
    const degraded = simulateSwing({
      ...STABLE_CASE,
      postFaultPmaxPn: 1.2,
      clearTimeSec: 0.05,
      simTimeSec: 4,
    });
    expect(degraded.stable).toBe(true);
  });

  it('produces a monotone accelerating angle during a sustained (uncleared) fault', () => {
    const stuck = simulateSwing({ ...STABLE_CASE, clearTimeSec: 10, simTimeSec: 1 });
    const firstHalf = stuck.samples.filter((smpl) => smpl.tSec < 0.5).map((smpl) => smpl.deltaDeg);
    for (let i = 1; i < firstHalf.length; i++) {
      expect(firstHalf[i]).toBeGreaterThanOrEqual(firstHalf[i - 1] - 1e-6);
    }
  });
});

describe('critical clearing time (bisection)', () => {
  it('finds the stability boundary consistently with the simulator', () => {
    const cct = criticalClearingTime({
      hSeconds: 5,
      pMechPn: 0.5,
      pMaxPn: 1.5,
      simTimeSec: 3,
      dtSec: 0.001,
    });
    expect(cct).not.toBeNull();
    expect(cct!).toBeGreaterThan(0.05);

    // Just below CCT: stable; just above: unstable
    const below = simulateSwing({ ...STABLE_CASE, clearTimeSec: cct! - 0.01 });
    const above = simulateSwing({ ...STABLE_CASE, clearTimeSec: cct! + 0.02 });
    expect(below.stable).toBe(true);
    expect(above.stable).toBe(false);
  });

  it('grows with inertia constant (heavier machines tolerate longer faults)', () => {
    const cctH2 = criticalClearingTime({ hSeconds: 2, pMechPn: 0.5, pMaxPn: 1.5, simTimeSec: 3 }, 1);
    const cctH8 = criticalClearingTime({ hSeconds: 8, pMechPn: 0.5, pMaxPn: 1.5, simTimeSec: 3 }, 2);
    expect(cctH2).not.toBeNull();
    expect(cctH8).not.toBeNull();
    expect(cctH8!).toBeGreaterThan(cctH2!);
  });
});
