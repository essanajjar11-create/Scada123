/**
 * ISA-18.2 Alarm Engine Core (Pure Functions)
 * Deduplication, flooding prevention, ring-buffer capping, and
 * telemetry threshold evaluation for ANSI 27/50/59 + thermal watchdogs.
 */

import { AlarmItem, AlarmSeverity, AlarmThresholds } from '../../types/scada';

export const MAX_ALARMS = 500;

export type AlarmInput = Pick<AlarmItem, 'asset' | 'device' | 'message' | 'severity'>;

export function alarmDedupKey(asset: string, device: string, severity: AlarmSeverity): string {
  return `${asset}::${device}::${severity}`;
}

export interface RaiseAlarmResult {
  next: AlarmItem[];
  added: boolean;
}

/**
 * Inserts an alarm into the list with ISA-18.2 style suppression:
 * - One live alarm per (asset, device, severity); live = active_unacked/active_acked.
 * - A suppressed repeat refreshes message/timestamp without creating a new entry.
 * - New alarms are prepended; the buffer is capped at MAX_ALARMS.
 */
export function raiseAlarm(prev: AlarmItem[], incoming: AlarmInput, makeId: () => string, makeTimestamp: () => string): RaiseAlarmResult {
  const key = alarmDedupKey(incoming.asset, incoming.device, incoming.severity);
  let suppressed = false;

  const merged = prev.map((a) => {
    if (!suppressed && a.state !== 'archived' && a.state !== 'cleared_unacked' && alarmDedupKey(a.asset, a.device, a.severity) === key) {
      suppressed = true;
      return { ...a, message: incoming.message, timestamp: makeTimestamp() };
    }
    return a;
  });

  if (suppressed) {
    return { next: merged, added: false };
  }

  const newAlarm: AlarmItem = {
    id: makeId(),
    timestamp: makeTimestamp(),
    asset: incoming.asset,
    device: incoming.device,
    message: incoming.message,
    severity: incoming.severity,
    state: 'active_unacked',
  };

  return { next: [newAlarm, ...merged].slice(0, MAX_ALARMS), added: true };
}

export interface TelemetryAlarmSample {
  asset: string;
  gridVoltageKV: number;
  loadCurrentA: number;
  oilTempC: number;
  windingTempC?: number;
}

export interface TelemetryAlarmFinding {
  device: string;
  message: string;
  severity: AlarmSeverity;
}

export function evaluateTelemetryAlarms(sample: TelemetryAlarmSample, th: AlarmThresholds): TelemetryAlarmFinding[] {
  const findings: TelemetryAlarmFinding[] = [];

  if (sample.gridVoltageKV > th.overVoltageKV) {
    findings.push({
      device: 'ANSI 59 Relay',
      message: `High Voltage Exceeded! Grid Voltage: ${sample.gridVoltageKV.toFixed(1)} kV`,
      severity: 'major',
    });
  }
  if (sample.gridVoltageKV < th.underVoltageKV) {
    findings.push({
      device: 'ANSI 27 Relay',
      message: `Grid Undervoltage Warning! Grid Voltage: ${sample.gridVoltageKV.toFixed(1)} kV`,
      severity: 'major',
    });
  }
  if (sample.loadCurrentA > th.overCurrentA) {
    findings.push({
      device: 'ANSI 50 Overcurrent',
      message: `Overcurrent Warning! Load: ${sample.loadCurrentA.toFixed(0)} A`,
      severity: 'critical',
    });
  }
  if (sample.oilTempC > th.oilTempHighC) {
    findings.push({
      device: 'Thermal Watchdog',
      message: `Top Oil Temperature High: ${sample.oilTempC.toFixed(1)} °C`,
      severity: 'critical',
    });
  }
  if (sample.windingTempC !== undefined && sample.windingTempC > th.windingTempHighC) {
    findings.push({
      device: 'ANSI 49 Winding Temp Relay',
      message: `Winding Hotspot Temperature High: ${sample.windingTempC.toFixed(1)} °C`,
      severity: 'critical',
    });
  }

  return findings;
}
