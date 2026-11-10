import { describe, expect, it } from 'vitest';
import {
  buildYbus,
  runN1Contingencies,
  solveNewtonRaphson,
  PowerFlowBus,
  PowerFlowBranch,
} from '../lib/engineering/powerFlow';

const THREE_BUS: PowerFlowBus[] = [
  { id: 'S', type: 'SLACK', vSetPn: 1.0 },
  { id: 'L', type: 'PQ', pLoadPn: 0.5, qLoadPn: 0.2 },
];

const LINE: PowerFlowBranch = { id: 'BR1', fromBus: 'S', toBus: 'L', rPn: 0.01, xPn: 0.05 };

describe('Ybus assembly', () => {
  it('places series admittance on the diagonal and negative off-diagonal', () => {
    const { ybus } = buildYbus(['S', 'L'], [LINE]);
    // y_series = (r - jx)/(r^2 + x^2) = 3.846 - j19.23 ; Ybus_offdiag = -y_series
    expect(ybus[0][1].re).toBeCloseTo(-0.01 / (0.01 ** 2 + 0.05 ** 2), 8);
    expect(ybus[0][1].im).toBeCloseTo(0.05 / (0.01 ** 2 + 0.05 ** 2), 8);
    expect(ybus[0][0].re).toBeCloseTo(0.01 / (0.01 ** 2 + 0.05 ** 2), 8);
    expect(ybus[0][0].im).toBeCloseTo(-0.05 / (0.01 ** 2 + 0.05 ** 2), 8);
  });
});

describe('Newton-Raphson solver - two-bus radial case', () => {
  const sol = solveNewtonRaphson(THREE_BUS, [LINE]);

  it('converges to a tight mismatch within few iterations', () => {
    expect(sol.converged).toBe(true);
    expect(sol.iterations).toBeLessThanOrEqual(6);
    expect(sol.maxMismatchPn).toBeLessThan(1e-6);
  });

  it('delivers a plausible load-bus voltage below 1 pu', () => {
    const load = sol.buses.find((b) => b.id === 'L')!;
    expect(load.voltageMagPn).toBeGreaterThan(0.9);
    expect(load.voltageMagPn).toBeLessThan(1.0);
    // Small-angle estimate: dTheta ~ P*X/V^2
    expect(Math.abs(load.angleDeg)).toBeGreaterThan(0);
    expect(Math.abs(load.angleDeg)).toBeLessThan(5);
  });

  it('balances power: slack injection equals load plus losses', () => {
    const slackBranch = sol.branches[0];
    expect(slackBranch.pFromPn).toBeGreaterThan(0.5); // losses > 0
    expect(slackBranch.pFromPn).toBeLessThan(0.56);
    expect(sol.totalLossesPn).toBeCloseTo(slackBranch.lossesPn, 10);
    expect(sol.totalLossesPn).toBeGreaterThan(0);
  });
});

describe('PV bus handling & reactive limits', () => {
  const buses: PowerFlowBus[] = [
    { id: 'S', type: 'SLACK', vSetPn: 1.0 },
    { id: 'G', type: 'PV', vSetPn: 1.01, pGenPn: 0.4, qMaxPn: 0.6, qMinPn: -0.6 },
    { id: 'L', type: 'PQ', pLoadPn: 0.9, qLoadPn: 0.4 },
  ];
  const branches: PowerFlowBranch[] = [
    { id: 'A', fromBus: 'S', toBus: 'G', rPn: 0.01, xPn: 0.06 },
    { id: 'B', fromBus: 'S', toBus: 'L', rPn: 0.02, xPn: 0.08 },
  ];

  it('solves a PV case with generous limits without demotion', () => {
    const relaxed = solveNewtonRaphson(buses, branches);
    expect(relaxed.converged).toBe(true);
    const pv = relaxed.buses.find((b) => b.id === 'G')!;
    expect(pv.qLimited).toBe(false);
  });

  it('demotes the PV bus to PQ when its Q ceiling is hit', () => {
    const tight = solveNewtonRaphson(
      buses.map((b) => (b.id === 'G' ? { ...b, vSetPn: 1.05, qMaxPn: 0.08, qMinPn: -0.08 } : b)),
      branches
    );
    const pv = tight.buses.find((b) => b.id === 'G')!;
    expect(pv.qLimited).toBe(true);
    expect(tight.converged).toBe(true);
  });
});

describe('N-1 contingency ranking', () => {
  const buses: PowerFlowBus[] = [
    { id: 'S', type: 'SLACK', vSetPn: 1.0 },
    { id: 'L', type: 'PQ', pLoadPn: 0.6, qLoadPn: 0.2 },
  ];
  const parallel = ['T1', 'T2'].map<PowerFlowBranch>((id) => ({
    id,
    fromBus: 'S',
    toBus: 'L',
    rPn: 0.02,
    xPn: 0.1,
  }));

  it('flags every outage as more stressed than the base case', () => {
    const base = solveNewtonRaphson(buses, parallel);
    const n1 = runN1Contingencies(buses, parallel);
    expect(n1).toHaveLength(2);

    const baseLoading = base.branches.reduce((acc, b) => Math.max(acc, b.mvaLoadingPn), 0);
    for (const contingency of n1) {
      expect(contingency.worstLoadingPct).toBeGreaterThan(baseLoading * 100 * 0.99);
      expect(contingency.converged).toBe(true);
    }
    // Losing either parallel circuit doubles flow on the survivor.
    expect(n1[0].worstLoadingPct / n1[1].worstLoadingPct).toBeCloseTo(1, 1);
  });
});
