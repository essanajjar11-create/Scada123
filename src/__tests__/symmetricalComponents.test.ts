import { describe, expect, it } from 'vitest';
import {
  fortescueTransform,
  inverseFortescue,
  solveShuntFault,
} from '../lib/engineering/symmetricalComponents';

const balancedSet = [
  { mag: 1.0, angDeg: 0 },
  { mag: 1.0, angDeg: -120 },
  { mag: 1.0, angDeg: 120 },
] as const;

describe('Fortescue transform', () => {
  it('yields only positive sequence for a balanced system', () => {
    const seq = fortescueTransform(balancedSet[0], balancedSet[1], balancedSet[2]);
    expect(seq.positive.mag).toBeCloseTo(1.0, 6);
    expect(seq.negative.mag).toBeCloseTo(0, 8);
    expect(seq.zero.mag).toBeCloseTo(0, 8);
  });

  it('extracts zero sequence from an in-phase unbalanced set', () => {
    const seq = fortescueTransform(
      { mag: 1, angDeg: 0 },
      { mag: 1, angDeg: 0 },
      { mag: 1, angDeg: 0 }
    );
    expect(seq.zero.mag).toBeCloseTo(1, 6);
    expect(seq.positive.mag).toBeCloseTo(0, 8);
    expect(seq.negative.mag).toBeCloseTo(0, 8);
  });

  it('round-trips through the inverse transform', () => {
    const original = [
      { mag: 1.2, angDeg: 5 },
      { mag: 0.9, angDeg: -115 },
      { mag: 1.05, angDeg: 130 },
    ];
    const seq = fortescueTransform(original[0], original[1], original[2]);
    const [a, b, c] = inverseFortescue(seq);
    expect(a.mag).toBeCloseTo(original[0].mag, 6);
    expect(b.angDeg).toBeCloseTo(original[1].angDeg, 4);
    expect(c.mag).toBeCloseTo(original[2].mag, 6);
  });
});

describe('shunt fault solutions (sequence networks)', () => {
  const networks = {
    z1: { re: 0, im: 0.1 },
    z2: { re: 0, im: 0.1 },
    z0: { re: 0, im: 0.3 },
  };

  it('three-phase fault draws only positive-sequence current V/Z1', () => {
    const sol = solveShuntFault('THREE_PHASE', networks);
    expect(sol.i1.mag).toBeCloseTo(10, 4); // 1 / j0.1
    expect(sol.i2.mag).toBeCloseTo(0, 8);
    expect(sol.i0.mag).toBeCloseTo(0, 8);
    expect(sol.worstPhaseKaEquivalent).toBeCloseTo(10, 4);
  });

  it('SLG fault satisfies If = 3*V/(Z1+Z2+Z0) on the faulted phase only', () => {
    const sol = solveShuntFault('SLG', networks);
    expect(sol.phaseA.mag).toBeCloseTo(6, 6); // 3 / j0.5 -> 3*2 = 6
    expect(sol.phaseB.mag).toBeCloseTo(0, 8);
    expect(sol.phaseC.mag).toBeCloseTo(0, 8);
    expect(sol.i1.mag).toBeCloseTo(sol.i0.mag, 8);
  });

  it('LL fault produces sqrt(3)-scaled currents with no zero sequence', () => {
    const sol = solveShuntFault('LINE_LINE', networks);
    expect(sol.i0.mag).toBeCloseTo(0, 8);
    expect(sol.i1.mag).toBeCloseTo(5, 6); // 1 / j0.2
    expect(sol.worstPhaseKaEquivalent).toBeCloseTo(Math.sqrt(3) * 5, 5);
    expect(sol.phaseA.mag).toBeCloseTo(0, 6);
  });

  it('LLG fault uses the parallel combination Z2||Z0', () => {
    const sol = solveShuntFault('LLG', networks);
    // Z2||Z0 = j0.075 ; I1 = 1/(j0.175)
    expect(sol.i1.mag).toBeCloseTo(1 / 0.175, 5);
    expect(sol.i0.mag).toBeGreaterThan(0);
    expect(sol.worstPhaseKaEquivalent).toBeGreaterThan(0);
  });
});
