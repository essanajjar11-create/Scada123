/**
 * Canonical substation/system constants shared across all engineering engines.
 * The reference plant is a 132/13.8 kV, 50 Hz transmission substation.
 */

export const SYSTEM_FREQUENCY_HZ = 50;
export const NOMINAL_HV_KV = 132;
export const NOMINAL_MV_KV = 13.8;

/** Angular frequency omega = 2*pi*f [rad/s]. */
export const OMEGA_RAD_PER_S = 2 * Math.PI * SYSTEM_FREQUENCY_HZ;
