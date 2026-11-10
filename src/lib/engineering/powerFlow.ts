/**
 * AC Power Flow Engine - Full Newton-Raphson in polar coordinates.
 * Pure functions: complex Ybus assembly (pi-model branches), dense linear
 * solve with partial pivoting, PV->PQ reactive-limit switching, branch flows,
 * I^2R losses, and systematic N-1 contingency ranking.
 *
 * All quantities are per-unit on a common system MVA base unless stated.
 */

export type BusType = 'SLACK' | 'PV' | 'PQ';

export interface PowerFlowBus {
  id: string;
  type: BusType;
  /** Voltage setpoint for SLACK/PV buses [pu]. */
  vSetPn?: number;
  pGenPn?: number;
  qGenPn?: number;
  pLoadPn?: number;
  qLoadPn?: number;
  /** Reactive limits for PV buses [pu]; demotion to PQ occurs on violation. */
  qMaxPn?: number;
  qMinPn?: number;
}

export interface PowerFlowBranch {
  id: string;
  fromBus: string;
  toBus: string;
  rPn: number;
  xPn: number;
  /** Total line-charging susceptance [pu] (split evenly across the pi model). */
  bChargingPn?: number;
  outOfService?: boolean;
}

interface Cx {
  re: number;
  im: number;
}

const cx = (re: number, im: number): Cx => ({ re, im });
const cAdd = (a: Cx, b: Cx): Cx => cx(a.re + b.re, a.im + b.im);
const cSub = (a: Cx, b: Cx): Cx => cx(a.re - b.re, a.im - b.im);
const cMul = (a: Cx, b: Cx): Cx => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cConj = (a: Cx): Cx => cx(a.re, -a.im);
const cDiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im || 1e-15;
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};

/** Dense linear solver with partial pivoting (Gaussian elimination). */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const m = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivotRow][col])) pivotRow = r;
    }
    if (Math.abs(m[pivotRow][col]) < 1e-12) continue;
    [m[col], m[pivotRow]] = [m[pivotRow], m[col]];

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      if (factor === 0) continue;
      for (let cIdx = col; cIdx <= n; cIdx++) {
        m[r][cIdx] -= factor * m[col][cIdx];
      }
    }
  }

  return m.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

interface YbusModel {
  busIndex: Record<string, number>;
  ybus: Cx[][];
}

/** Assemble the complex bus admittance matrix from pi-model branches. */
export function buildYbus(busIds: string[], branches: PowerFlowBranch[]): YbusModel {
  const busIndex: Record<string, number> = {};
  busIds.forEach((id, i) => {
    busIndex[id] = i;
  });

  const n = busIds.length;
  const ybus: Cx[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => cx(0, 0)));

  for (const br of branches) {
    if (br.outOfService) continue;
    const i = busIndex[br.fromBus];
    const j = busIndex[br.toBus];
    if (i === undefined || j === undefined) continue;

    const ySeries = cDiv(cx(1, 0), cx(br.rPn, br.xPn));
    const bHalf = cx(0, (br.bChargingPn ?? 0) / 2);

    ybus[i][i] = cAdd(ybus[i][i], cAdd(ySeries, bHalf));
    ybus[j][j] = cAdd(ybus[j][j], cAdd(ySeries, bHalf));
    ybus[i][j] = cSub(ybus[i][j], ySeries);
    ybus[j][i] = cSub(ybus[j][i], ySeries);
  }

  return { busIndex, ybus };
}

export interface BusSolution {
  id: string;
  voltageMagPn: number;
  angleDeg: number;
  /** Solved net active power injection at the bus [pu] (equals slack generation). */
  pInjectionPn: number;
  /** Net scheduled P used during the solve [pu]. */
  pSpecifiedPn: number;
  /** Solved reactive injection [pu]. */
  qInjectionPn: number;
  /** True when a PV bus was demoted to PQ due to a reactive limit. */
  qLimited: boolean;
  isolated: boolean;
}

export interface BranchSolution {
  id: string;
  fromBus: string;
  toBus: string;
  /** Sending-end flow [pu] (positive = export from -> to). */
  pFromPn: number;
  qFromPn: number;
  /** Receiving-end flow [pu] (positive = import at to-bus). */
  pToPn: number;
  qToPn: number;
  lossesPn: number;
  mvaLoadingPn: number;
  outOfService: boolean;
}

export interface PowerFlowSolution {
  converged: boolean;
  iterations: number;
  maxMismatchPn: number;
  buses: BusSolution[];
  branches: BranchSolution[];
  totalLossesPn: number;
}

interface InnerState {
  vMag: number[];
  angRad: number[];
  converged: boolean;
  iterations: number;
  mismatch: number;
}

export interface SolverOptions {
  maxIterations?: number;
  tolerancePn?: number;
  baseMva?: number;
}

/**
 * Newton-Raphson power flow: full polar Jacobian (H, N, J, L blocks),
 * tolerance-controlled iteration and PV->PQ switching outer loop.
 */
export function solveNewtonRaphson(
  busesInput: PowerFlowBus[],
  branches: PowerFlowBranch[],
  opts?: SolverOptions
): PowerFlowSolution {
  const maxIter = opts?.maxIterations ?? 30;
  const tol = opts?.tolerancePn ?? 1e-8;

  const buses: PowerFlowBus[] = busesInput.map((b) => ({ ...b }));
  const busIds = buses.map((b) => b.id);
  const { busIndex, ybus } = buildYbus(busIds, branches);
  const n = busIds.length;

  // Effective type after any PV->PQ demotion.
  const effectiveType: BusType[] = buses.map((b) => b.type);

  const vMagInit = buses.map((b) => b.vSetPn ?? 1.0);

  const runOnce = (): InnerState => {
    // Unknowns are rebuilt on every pass so PV->PQ demotions take effect.
    const thetaUnknown: number[] = [];
    const vmUnknownPqOnly: number[] = [];

    buses.forEach((b, i) => {
      if (b.type === 'SLACK') return;
      thetaUnknown.push(i);
      if (effectiveType[i] === 'PQ') vmUnknownPqOnly.push(i);
    });

    const pSpecified = buses.map((b) => (b.pGenPn ?? 0) - (b.pLoadPn ?? 0));
    const qSpecified = buses.map((b) => (b.qGenPn ?? 0) - (b.qLoadPn ?? 0));

    const vMag = [...vMagInit];
    const angRad = new Array<number>(n).fill(0);

    const calcP = (i: number): number =>
      vMag[i] * ybus[i].reduce((acc, yij, j) => {
        const th = angRad[i] - angRad[j];
        return acc + vMag[j] * (yij.re * Math.cos(th) + yij.im * Math.sin(th));
      }, 0);

    const calcQ = (i: number): number =>
      vMag[i] * ybus[i].reduce((acc, yij, j) => {
        const th = angRad[i] - angRad[j];
        return acc + vMag[j] * (yij.re * Math.sin(th) - yij.im * Math.cos(th));
      }, 0);

    let iterations = 0;
    let mismatch = Infinity;
    let converged = false;

    for (let iter = 0; iter < maxIter; iter++) {
      iterations = iter + 1;

      const mismatches: number[] = [];
      for (const i of thetaUnknown) mismatches.push(pSpecified[i] - calcP(i));
      for (const i of vmUnknownPqOnly) mismatches.push(qSpecified[i] - calcQ(i));

      mismatch = mismatches.reduce((acc, mv) => Math.max(acc, Math.abs(mv)), 0);
      if (mismatch < tol) {
        converged = true;
        break;
      }

      const m = mismatches.length;
      const J: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));

      for (let r = 0; r < m; r++) {
        const eqBus = r < thetaUnknown.length ? thetaUnknown[r] : vmUnknownPqOnly[r - thetaUnknown.length];

        for (let cIdx = 0; cIdx < m; cIdx++) {
          const isThetaCol = cIdx < thetaUnknown.length;
          const varBus = isThetaCol ? thetaUnknown[cIdx] : vmUnknownPqOnly[cIdx - thetaUnknown.length];
          const vi = vMag[eqBus];
          const vj = vMag[varBus];
          const th = angRad[eqBus] - angRad[varBus];
          const g = ybus[eqBus][varBus].re;
          const bi = ybus[eqBus][varBus].im;

          if (r < thetaUnknown.length) {
            if (isThetaCol) {
              if (eqBus === varBus) {
                let acc = 0;
                for (let k = 0; k < n; k++) {
                  if (k === eqBus) continue;
                  const tk = angRad[eqBus] - angRad[k];
                  acc += vi * vMag[k] * (ybus[eqBus][k].re * Math.sin(tk) - ybus[eqBus][k].im * Math.cos(tk));
                }
                J[r][cIdx] = -acc;
              } else {
                J[r][cIdx] = vi * vj * (g * Math.sin(th) - bi * Math.cos(th));
              }
            } else {
              if (eqBus === varBus) {
                J[r][cIdx] = (calcP(eqBus) + vMag[eqBus] ** 2 * ybus[eqBus][eqBus].re) / vMag[eqBus];
              } else {
                J[r][cIdx] = vi * (g * Math.cos(th) + bi * Math.sin(th));
              }
            }
          } else {
            if (isThetaCol) {
              if (eqBus === varBus) {
                J[r][cIdx] = calcP(eqBus) - vMag[eqBus] ** 2 * ybus[eqBus][eqBus].re;
              } else {
                J[r][cIdx] = -vi * vj * (g * Math.sin(th) - bi * Math.cos(th));
              }
            } else {
              if (eqBus === varBus) {
                J[r][cIdx] = (calcQ(eqBus) - vMag[eqBus] ** 2 * ybus[eqBus][eqBus].im) / vMag[eqBus];
              } else {
                J[r][cIdx] = vi * (g * Math.cos(th) + bi * Math.sin(th));
              }
            }
          }
        }
      }

      const deltas = solveLinearSystem(J, mismatches);

      for (let idx = 0; idx < thetaUnknown.length; idx++) angRad[thetaUnknown[idx]] += deltas[idx];
      for (let idx = 0; idx < vmUnknownPqOnly.length; idx++) vMag[vmUnknownPqOnly[idx]] += deltas[thetaUnknown.length + idx];
    }

    return { vMag, angRad, converged, iterations, mismatch };
  };

  // Outer loop: PV->PQ switching on reactive limit violations.
  const qLimited = new Set<string>();
  let state = runOnce();

  for (let pass = 0; pass < 3; pass++) {
    let switched = false;
    for (let bi = 0; bi < buses.length; bi++) {
      if (effectiveType[bi] !== 'PV' || qLimited.has(buses[bi].id)) continue;
      const b = buses[bi];
      const i = bi;
      const qOut = state.vMag[i] * ybus[i].reduce((acc, yij, j) => {
        const th = state.angRad[i] - state.angRad[j];
        return acc + state.vMag[j] * (yij.re * Math.sin(th) - yij.im * Math.cos(th));
      }, 0);

      const qMax = b.qMaxPn ?? Infinity;
      const qMin = b.qMinPn ?? -Infinity;
      if (qOut > qMax || qOut < qMin) {
        qLimited.add(b.id);
        buses[i].qGenPn = qOut > qMax ? qMax : qMin;
        effectiveType[i] = 'PQ';
        switched = true;
      }
    }
    if (!switched) break;
    state = runOnce();
  }

  // Package results
  const calcS = (i: number): { p: number; q: number } => {
    let sum = cx(0, 0);
    for (let j = 0; j < n; j++)
      sum = cAdd(sum, cMul(ybus[i][j], cx(state.vMag[j] * Math.cos(state.angRad[j]), state.vMag[j] * Math.sin(state.angRad[j]))));
    const vi = cx(state.vMag[i] * Math.cos(state.angRad[i]), state.vMag[i] * Math.sin(state.angRad[i]));
    const s = cMul(vi, cConj(sum));
    return { p: s.re, q: s.im };
  };

  const isolatedFlags = buses.map((b) => {
    if (b.type === 'SLACK') return false;
    return !branches.some(
      (br) => !br.outOfService && (br.fromBus === b.id || br.toBus === b.id)
    );
  });

  const busSolutions: BusSolution[] = buses.map((b, i) => {
    const s = calcS(i);
    return {
      id: b.id,
      voltageMagPn: isolatedFlags[i] ? 0 : state.vMag[i],
      angleDeg: isolatedFlags[i] ? 0 : (state.angRad[i] * 180) / Math.PI,
      pInjectionPn: s.p,
      pSpecifiedPn: (buses[i].pGenPn ?? 0) - (buses[i].pLoadPn ?? 0),
      qInjectionPn: s.q,
      qLimited: qLimited.has(b.id),
      isolated: isolatedFlags[i],
    };
  });

  const branchSolutions: BranchSolution[] = branches.map((br) => {
    if (br.outOfService) {
      return {
        id: br.id,
        fromBus: br.fromBus,
        toBus: br.toBus,
        pFromPn: 0,
        qFromPn: 0,
        pToPn: 0,
        qToPn: 0,
        lossesPn: 0,
        mvaLoadingPn: 0,
        outOfService: true,
      };
    }
    const i = busIndex[br.fromBus];
    const j = busIndex[br.toBus];
    const vi = cx(state.vMag[i] * Math.cos(state.angRad[i]), state.vMag[i] * Math.sin(state.angRad[i]));
    const vj = cx(state.vMag[j] * Math.cos(state.angRad[j]), state.vMag[j] * Math.sin(state.angRad[j]));
    const ySer = cDiv(cx(1, 0), cx(br.rPn, br.xPn));
    const bHalf = cx(0, (br.bChargingPn ?? 0) / 2);

    const iFrom = cAdd(cMul(ySer, cSub(vi, vj)), cMul(bHalf, vi));
    const iTo = cAdd(cMul(ySer, cSub(vj, vi)), cMul(bHalf, vj));
    const sFrom = cMul(vi, cConj(iFrom));
    const sTo = cMul(vj, cConj(iTo));

    return {
      id: br.id,
      fromBus: br.fromBus,
      toBus: br.toBus,
      pFromPn: sFrom.re,
      qFromPn: sFrom.im,
      pToPn: sTo.re,
      qToPn: sTo.im,
      lossesPn: sFrom.re + sTo.re,
      mvaLoadingPn: Math.max(Math.hypot(sFrom.re, sFrom.im), Math.hypot(sTo.re, sTo.im)),
      outOfService: false,
    };
  });

  const totalLosses = branchSolutions.reduce((acc, bsol) => acc + bsol.lossesPn, 0);

  return {
    converged: state.converged,
    iterations: state.iterations,
    maxMismatchPn: state.mismatch,
    buses: busSolutions,
    branches: branchSolutions,
    totalLossesPn: totalLosses,
  };
}

/** Convenience wrapper: run every single-line outage and rank by impact. */
export function runN1Contingencies(
  buses: PowerFlowBus[],
  branches: PowerFlowBranch[],
  capacityPn?: Record<string, number>
): Array<{
  outagedBranchId: string;
  converged: boolean;
  minVoltagePn: number;
  worstLoadingPct: number;
  totalLossesPn: number;
}> {
  const results = [];

  for (const br of branches) {
    if (br.outOfService) continue;
    const stressed = branches.map((b) => (b.id === br.id ? { ...b, outOfService: true } : b));
    const sol = solveNewtonRaphson(buses, stressed);
    const liveBranches = sol.branches.filter((bsol) => !bsol.outOfService);
    const minVoltage = sol.buses
      .filter((bsol) => bsol.id !== buses.find((bb) => bb.type === 'SLACK')?.id && !bsol.isolated)
      .reduce((acc, bsol) => Math.min(acc, bsol.voltageMagPn), Infinity);
    const worstLoading = liveBranches.reduce((acc, bsol) => {
      const cap = capacityPn?.[bsol.id];
      const loading = cap ? (bsol.mvaLoadingPn / cap) * 100 : bsol.mvaLoadingPn * 100;
      return Math.max(acc, loading);
    }, 0);

    results.push({
      outagedBranchId: br.id,
      converged: sol.converged,
      minVoltagePn: Number.isFinite(minVoltage) ? minVoltage : 0,
      worstLoadingPct: worstLoading,
      totalLossesPn: sol.totalLossesPn,
    });
  }

  return results.sort((a, b) => b.worstLoadingPct - a.worstLoadingPct);
}
