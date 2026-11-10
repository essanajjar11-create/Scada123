/**
 * Symmetrical Components Engine (Fortescue Transformation)
 * Pure complex-math implementation of sequence-network decoupling and the
 * classical fault-type current solutions (3PH, SLG, LL, LLG).
 */

import { ComplexImpedance, impedanceMagnitude } from './faultCalculation';

export interface Phasor {
  mag: number;
  angDeg: number;
}

interface Cx {
  re: number;
  im: number;
}

const cx = (re: number, im: number): Cx => ({ re, im });
const cAdd = (a: Cx, b: Cx): Cx => cx(a.re + b.re, a.im + b.im);
const cSub = (a: Cx, b: Cx): Cx => cx(a.re - b.re, a.im - b.im);
const cMul = (a: Cx, b: Cx): Cx => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cDiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im || 1e-12;
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const cMag = (a: Cx): number => Math.hypot(a.re, a.im);

/** a-operator: 1∠120° */
const A_OP = cx(-0.5, Math.sqrt(3) / 2);
const A_OP_SQ = cx(-0.5, -Math.sqrt(3) / 2);

function toComplex(p: Phasor): Cx {
  const rad = (p.angDeg * Math.PI) / 180;
  return cx(p.mag * Math.cos(rad), p.mag * Math.sin(rad));
}

function toPhasor(z: Cx): Phasor {
  return { mag: cMag(z), angDeg: (Math.atan2(z.im, z.re) * 180) / Math.PI };
}

export interface SequenceSet<T> {
  zero: T;
  positive: T;
  negative: T;
}

/** Forward Fortescue transform: phase phasors -> symmetrical components. */
export function fortescueTransform(a: Phasor, b: Phasor, c: Phasor): SequenceSet<Phasor> {
  const ca = toComplex(a);
  const cb = toComplex(b);
  const cc = toComplex(c);

  const scale = (z: Cx): Cx => cx(z.re / 3, z.im / 3);

  const zero = scale(cAdd(cAdd(ca, cb), cc));
  const positive = scale(cAdd(cAdd(ca, cMul(A_OP, cb)), cMul(A_OP_SQ, cc)));
  const negative = scale(cAdd(cAdd(ca, cMul(A_OP_SQ, cb)), cMul(A_OP, cc)));

  return { zero: toPhasor(zero), positive: toPhasor(positive), negative: toPhasor(negative) };
}

/** Inverse Fortescue transform: symmetrical components -> phase phasors. */
export function inverseFortescue(seq: SequenceSet<Phasor>): [Phasor, Phasor, Phasor] {
  const z0 = toComplex(seq.zero);
  const z1 = toComplex(seq.positive);
  const z2 = toComplex(seq.negative);

  const a = cAdd(cAdd(z0, z1), z2);
  const b = cAdd(cAdd(z0, cMul(A_OP_SQ, z1)), cMul(A_OP, z2));
  const c = cAdd(cAdd(z0, cMul(A_OP, z1)), cMul(A_OP_SQ, z2));

  return [toPhasor(a), toPhasor(b), toPhasor(c)];
}

export type FaultType = 'THREE_PHASE' | 'SLG' | 'LINE_LINE' | 'LLG';

export interface SequenceNetworks {
  z1: ComplexImpedance;
  /** Defaults to z1 when omitted (static plant assumption). */
  z2?: ComplexImpedance;
  z0: ComplexImpedance;
  /** Pre-fault internal voltage (line-to-neutral, per unit or volts). Default 1.0 ∠0°. */
  preFaultVoltagePn?: Phasor;
}

export interface FaultCurrentSolution {
  i1: Phasor;
  i2: Phasor;
  i0: Phasor;
  /** Current in each phase at the fault point [same base as inputs]. */
  phaseA: Phasor;
  phaseB: Phasor;
  phaseC: Phasor;
  /** Largest phase-fault magnitude [same base as inputs]. */
  worstPhaseKaEquivalent: number;
}

/**
 * Solve the classical shunt-fault boundary conditions using sequence networks.
 * All impedances on a common base; returned currents share the pre-fault
 * voltage base.
 */
export function solveShuntFault(type: FaultType, n: SequenceNetworks): FaultCurrentSolution {
  const z2 = n.z2 ?? n.z1;
  const v = toComplex(n.preFaultVoltagePn ?? { mag: 1.0, angDeg: 0 });

  const Z1 = cx(n.z1.re, n.z1.im);
  const Z2 = cx(z2.re, z2.im);
  const Z0 = cx(n.z0.re, n.z0.im);

  let i1: Cx;
  let i2: Cx = cx(0, 0);
  let i0: Cx = cx(0, 0);

  if (type === 'THREE_PHASE') {
    i1 = cDiv(v, Z1);
  } else if (type === 'SLG') {
    // I1 = I2 = I0 = V / (Z1 + Z2 + Z0); If_a = 3*I0
    const total = cAdd(cAdd(Z1, Z2), Z0);
    i1 = cDiv(v, total);
    i2 = i1;
    i0 = i1;
  } else if (type === 'LINE_LINE') {
    // I1 = V / (Z1 + Z2), I2 = -I1, I0 = 0; If_b = -j*sqrt(3)*I1 (magnitude sqrt(3))
    i1 = cDiv(v, cAdd(Z1, Z2));
    i2 = cx(-i1.re, -i1.im);
    i0 = cx(0, 0);
  } else {
    // LLG: I1 = V / (Z1 + Z2 || Z0); I2 = -I1 * Z0/(Z2+Z0); I0 = -I1 * Z2/(Z2+Z0)
    const zPar = cMul(Z2, Z0);
    const zSum = cAdd(Z2, Z0);
    const z2p0 = cDiv(zPar, zSum);
    i1 = cDiv(v, cAdd(Z1, z2p0));
    const ratio20 = cDiv(Z0, zSum);
    const ratio02 = cDiv(Z2, zSum);
    i2 = cMul(i1, { re: -ratio20.re, im: -ratio20.im });
    i0 = cMul(i1, { re: -ratio02.re, im: -ratio02.im });
  }

  const [phaseA, phaseB, phaseC] = inverseFortescue({
    zero: toPhasor(i0),
    positive: toPhasor(i1),
    negative: toPhasor(i2),
  });

  return {
    i1: toPhasor(i1),
    i2: toPhasor(i2),
    i0: toPhasor(i0),
    phaseA,
    phaseB,
    phaseC,
    worstPhaseKaEquivalent: Math.max(phaseA.mag, phaseB.mag, phaseC.mag),
  };
}

/** Convenience: magnitude of a sequence impedance. */
export function seqMagnitude(z: ComplexImpedance): number {
  return impedanceMagnitude(z);
}
