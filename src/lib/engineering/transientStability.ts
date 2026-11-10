/**
 * Transient Stability Engine - Classical Model (Pure Functions)
 *
 * Swing equation for a synchronous machine connected to an infinite bus:
 *   (2H / ws) * d2(delta)/dt2 = Pm - Pe - D*d(delta)/dt,   ws = 2*pi*f
 *
 * State-space integration (RK4) of the fault-on and post-fault networks,
 * equal-area critical clearing angle, and bisection-based critical
 * clearing time (CCT). All powers in per-unit on the machine MVA base.
 */

import { SYSTEM_FREQUENCY_HZ } from './systemConstants';

export interface SwingCaseInput {
  /** Inertia constant H [seconds] (machine MVA base). */
  hSeconds: number;
  /** System frequency [Hz]. */
  fHz?: number;
  /** Mechanical power input [pu]. */
  pMechPn: number;
  /** Pre-fault transfer capability Pmax = E'*V/Xeq [pu]. */
  pMaxPn: number;
  /** Electrical power during the fault [pu]. Default 0 (bolted 3-phase at the HV terminals). */
  faultPePn?: number;
  /** Post-fault Pmax (lower when a parallel circuit is lost). Default = pMaxPn. */
  postFaultPmaxPn?: number;
  /** Fault clearing time [s]. */
  clearTimeSec: number;
  /** Simulation horizon [s]. */
  simTimeSec?: number;
  /** Integration step [s]. Default 0.001 s. */
  dtSec?: number;
  /** Damping coefficient D [pu torque / pu speed deviation]. Default 0 (conservative). */
  dampingD?: number;
}

export interface SwingSample {
  tSec: number;
  deltaDeg: number;
  /** Rotor speed deviation from synchronous [pu]. */
  dOmegaPn: number;
  pePn: number;
}

export interface SwingResult {
  samples: SwingSample[];
  stable: boolean;
  maxDeltaDeg: number;
  finalDeltaDeg: number;
  /** Rotor angle of the pre-fault equilibrium [rad]. */
  initialDeltaRad: number;
  /** Unstable equilibrium angle pi - asin(Pm/PmaxPost) [rad]. */
  unstableEquilibriumRad: number;
}

/** Pre-fault rotor angle from the power balance: delta0 = asin(Pm/Pmax). */
export function initialRotorAngle(pMechPn: number, pMaxPn: number): number {
  const ratio = Math.min(0.999, Math.max(0.001, pMechPn / Math.max(pMaxPn, 1e-9)));
  return Math.asin(ratio);
}

/** Unstable equilibrium of the post-fault power-angle curve. */
export function unstableEquilibriumAngle(pMechPn: number, pMaxPn: number): number {
  return Math.PI - initialRotorAngle(pMechPn, pMaxPn);
}

interface DeltaState {
  delta: number; // rad
  dOmega: number; // rad/s (deviation from synchronous)
}

/**
 * Time-domain swing simulation using RK4 with automatic switching of the
 * electrical-power curve at the clearing instant.
 */
export function simulateSwing(input: SwingCaseInput): SwingResult {
  const f = input.fHz ?? SYSTEM_FREQUENCY_HZ;
  const ws = 2 * Math.PI * f;
  const H = Math.max(0.05, input.hSeconds);
  const dt = Math.min(Math.max(input.dtSec ?? 0.001, 1e-5), 0.05);
  const tEnd = Math.max(input.clearTimeSec + 0.5, input.simTimeSec ?? 5);
  const D = input.dampingD ?? 0;

  const pm = input.pMechPn;
  const pFault = input.faultPePn ?? 0;
  const pMaxPost = input.postFaultPmaxPn ?? input.pMaxPn;

  const delta0 = initialRotorAngle(pm, input.pMaxPn);
  let state: DeltaState = { delta: delta0, dOmega: 0 };

  const peOf = (delta: number, tSec: number): number =>
    tSec < input.clearTimeSec ? pFault * Math.sin(delta) : pMaxPost * Math.sin(delta);

  const deriv = (s: DeltaState, tSec: number): DeltaState => ({
    delta: s.dOmega,
    dOmega: (ws / (2 * H)) * (pm - peOf(s.delta, tSec) - (D / ws) * s.dOmega),
  });

  const addScaled = (s: DeltaState, k: DeltaState, h: number): DeltaState => ({
    delta: s.delta + k.delta * h,
    dOmega: s.dOmega + k.dOmega * h,
  });

  const samples: SwingSample[] = [];
  let t = 0;
  let steps = Math.ceil(tEnd / dt);
  if (!Number.isFinite(steps) || steps > 2_000_000) steps = 2_000_000;

  for (let i = 0; i <= steps; i++) {
    samples.push({
      tSec: Number(t.toFixed(4)),
      deltaDeg: (state.delta * 180) / Math.PI,
      dOmegaPn: state.dOmega / ws,
      pePn: peOf(state.delta, t),
    });

    // RK4 step
    const k1 = deriv(state, t);
    const k2 = deriv(addScaled(state, k1, dt / 2), t + dt / 2);
    const k3 = deriv(addScaled(state, k2, dt / 2), t + dt / 2);
    const k4 = deriv(addScaled(state, k3, dt), t + dt);

    state = {
      delta: state.delta + ((k1.delta + 2 * k2.delta + 2 * k3.delta + k4.delta) * dt) / 6,
      dOmega: state.dOmega + ((k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega) * dt) / 6,
    };

    t += dt;
    if (Math.abs(state.delta) > 10 * Math.PI) break; // pole slipped far away
  }

  const deltaU = unstableEquilibriumAngle(pm, pMaxPost);
  const maxDelta = samples.reduce((acc, smpl) => Math.max(acc, smpl.deltaDeg), 0) * (Math.PI / 180);

  // First-swing criterion: pole slip occurs once delta passes the post-fault
  // unstable equilibrium with positive speed.
  const crossedUnstable = samples.some(
    (smpl) => smpl.deltaDeg * (Math.PI / 180) > deltaU && (smpl.dOmegaPn * ws) > 0
  );

  return {
    samples,
    stable: !crossedUnstable,
    maxDeltaDeg: (maxDelta * 180) / Math.PI,
    finalDeltaDeg: samples[samples.length - 1]?.deltaDeg ?? 0,
    initialDeltaRad: delta0,
    unstableEquilibriumRad: deltaU,
  };
}

/**
 * Equal-area critical clearing angle for the classical case
 * (Pe_fault = 0, post-fault Pmax equal to pre-fault):
 *   cos(dc_cr) = cos(pi - d0) + (Pm/Pmax) * (pi - 2*d0)
 */
export function criticalClearingAngleEqualArea(pMechPn: number, pMaxPn: number): number | null {
  const d0 = initialRotorAngle(pMechPn, pMaxPn);
  const k = pMechPn / pMaxPn;
  const cosDcr = -Math.cos(d0) + k * (Math.PI - 2 * d0);
  if (cosDcr < -1 || cosDcr > 1) return null;
  return Math.acos(cosDcr);
}

/**
 * Numerical critical clearing time via bisection on the time-domain model.
 * Returns the largest cleared time (within tolerance) that remains stable.
 */
export function criticalClearingTime(
  input: Omit<SwingCaseInput, 'clearTimeSec'> & { clearTimeSec?: never },
  tMaxSearchSec: number = 2,
  tolSec: number = 0.001
): number | null {
  const base: Omit<SwingCaseInput, 'clearTimeSec'> = { ...input };

  const isStableAt = (tc: number): boolean => simulateSwing({ ...base, clearTimeSec: tc }).stable;

  if (!isStableAt(0)) return null;
  if (isStableAt(tMaxSearchSec)) return tMaxSearchSec;

  let lo = 0;
  let hi = tMaxSearchSec;
  while (hi - lo > tolSec) {
    const mid = (lo + hi) / 2;
    if (isStableAt(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}
