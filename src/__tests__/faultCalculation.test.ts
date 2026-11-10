import { describe, expect, it } from 'vitest';
import {
  calculateShortCircuit,
  dcTimeConstant,
  networkFeederImpedance,
  peakFactor,
  transformerCorrectionFactor,
  voltageFactors,
} from '../lib/engineering/faultCalculation';

describe('IEC 60909 voltage factors (Table 1)', () => {
  it('uses 1.10 / 1.00 for HV systems', () => {
    expect(voltageFactors(132)).toEqual({ cMax: 1.1, cMin: 1.0 });
    expect(voltageFactors(13.8)).toEqual({ cMax: 1.1, cMin: 1.0 });
  });

  it('uses 1.05 / 0.95 for LV systems', () => {
    expect(voltageFactors(0.4)).toEqual({ cMax: 1.05, cMin: 0.95 });
  });
});

describe("network feeder impedance", () => {
  it("computes Z_Q from Sk'' with c = 1.0 convention", () => {
    const z = networkFeederImpedance(2500, 132, 10);
    // |Z| = 132^2 / 2500 = 6.9696 ohm
    expect(Math.hypot(z.re, z.im)).toBeCloseTo(6.9696, 3);
    expect(z.im / z.re).toBeCloseTo(10, 1);
  });
});

describe('transformer correction factor', () => {
  it('reduces impedance per K_T = 0.95*c_max/(1+0.6*xT)', () => {
    const kt = transformerCorrectionFactor(0.12, 1.1);
    expect(kt).toBeCloseTo((0.95 * 1.1) / (1 + 0.6 * 0.12), 6);
    expect(kt).toBeLessThan(1);
  });
});

describe('peak factor kappa', () => {
  it('matches kappa = 1.02 + 0.98*exp(-3R/X)', () => {
    const kappa = peakFactor({ re: 0.0696, im: 0.696 });
    expect(kappa).toBeCloseTo(1.02 + 0.98 * Math.exp(-0.3), 5);
    expect(kappa).toBeGreaterThan(1.02);
    expect(kappa).toBeLessThan(2);
  });

  it('derives the DC time constant Ta = X/(wR)', () => {
    const ta = dcTimeConstant({ re: 0.0696, im: 0.696 }, 50);
    expect(ta).toBeCloseTo(0.696 / (2 * Math.PI * 50 * 0.0696), 6);
  });
});

describe('calculateShortCircuit - pure grid infeed', () => {
  const result = calculateShortCircuit({
    unKv: 132,
    gridSkMva: 2500,
    gridRxRatio: 10,
    zeroSequenceRatio: 3.0,
  });

  it("produces the textbook Ik''max for a 2500 MVA source", () => {
    const z = Math.hypot(result.z1.re, result.z1.im);
    const expectedKa = ((1.1 * 132) / (Math.sqrt(3) * z)) ;
    expect(result.ik3phMaxKa).toBeCloseTo(expectedKa, 3);
    expect(result.ik3phMaxKa).toBeGreaterThan(11);
    expect(result.ik3phMaxKa).toBeLessThan(13);
  });

  it("scales Ik''min by c_min/c_max", () => {
    expect(result.ik3phMinKa).toBeCloseTo((result.ik3phMaxKa * 1.0) / 1.1, 6);
  });

  it('SLG current equals 3/5 of three-phase when Z0 = 3*Z1', () => {
    // |Z1+Z2+Z0| = 5|Z1| -> Ik1/Ik3 = (sqrt(3)*sqrt(3))/5 = 0.6
    expect(result.ik1phMaxKa).toBeCloseTo(result.ik3phMaxKa * 0.6, 6);
  });

  it("applies ip = kappa * sqrt(2) * Ik''", () => {
    expect(result.ipPeakKa).toBeCloseTo(result.kappa * Math.sqrt(2) * result.ik3phMaxKa, 6);
  });

  it("reports fault-level power consistent with Ik''", () => {
    expect(result.skMva).toBeCloseTo(Math.sqrt(3) * 132 * result.ik3phMaxKa, 3);
  });
});

describe('calculateShortCircuit - grid + transformer chain', () => {
  it('adds transformer impedance in series and de-risks the busbar level', () => {
    const withTx = calculateShortCircuit({
      unKv: 33,
      gridSkMva: 2500,
      transformer: { ratedPowerMva: 40, shortCircuitVoltagePct: 12.35, xrRatio: 15 },
    });
    const bareGrid = calculateShortCircuit({ unKv: 33, gridSkMva: 2500 });
    expect(withTx.ik3phMaxKa).toBeLessThan(bareGrid.ik3phMaxKa);
    expect(withTx.cMax).toBe(1.1);
  });
});
