import { describe, expect, it } from 'vitest';
import {
  MAX_ALARMS,
  alarmDedupKey,
  evaluateTelemetryAlarms,
  raiseAlarm,
} from '../lib/engineering/alarmEngine';
import { AlarmItem, AlarmThresholds } from '../types/scada';

const makeId = (() => {
  let n = 0;
  return () => `id-${++n}`;
})();
const ts = () => '12:00:00';

function item(partial: Partial<AlarmItem>): AlarmItem {
  return {
    id: makeId(),
    timestamp: '11:00:00',
    asset: 'TR-1',
    device: 'ANSI 59 Relay',
    message: 'msg',
    severity: 'major',
    state: 'active_unacked',
    ...partial,
  };
}

const THRESHOLDS: AlarmThresholds = {
  overVoltageKV: 140,
  underVoltageKV: 120,
  overCurrentA: 550,
  oilTempHighC: 85,
  windingTempHighC: 105,
};

describe('alarmDedupKey', () => {
  it('distinguishes by asset, device and severity', () => {
    expect(alarmDedupKey('TR-1', 'A', 'major')).not.toBe(alarmDedupKey('TR-2', 'A', 'major'));
    expect(alarmDedupKey('TR-1', 'A', 'major')).not.toBe(alarmDedupKey('TR-1', 'B', 'major'));
    expect(alarmDedupKey('TR-1', 'A', 'major')).not.toBe(alarmDedupKey('TR-1', 'A', 'critical'));
  });
});

describe('raiseAlarm', () => {
  it('prepends a new alarm in active_unacked state', () => {
    const existing = [item({})];
    const { next, added } = raiseAlarm(
      existing,
      { asset: 'TR-1', device: 'Thermal Watchdog', message: 'Hot: 92.0 °C', severity: 'critical' },
      makeId,
      ts
    );
    expect(added).toBe(true);
    expect(next).toHaveLength(2);
    expect(next[0].state).toBe('active_unacked');
    expect(next[0].device).toBe('Thermal Watchdog');
  });

  it('suppresses repeats with drifting live-value messages for the same condition', () => {
    const existing = [
      item({ asset: 'TR-1', device: 'ANSI 59 Relay', message: 'High Voltage! Grid Voltage: 141.2 kV', severity: 'major' }),
    ];
    const { next, added } = raiseAlarm(
      existing,
      { asset: 'TR-1', device: 'ANSI 59 Relay', message: 'High Voltage! Grid Voltage: 142.7 kV', severity: 'major' },
      makeId,
      ts
    );
    expect(added).toBe(false);
    expect(next).toHaveLength(1);
    expect(next[0].message).toBe('High Voltage! Grid Voltage: 142.7 kV');
    expect(next[0].timestamp).toBe('12:00:00');
  });

  it('does not suppress across different assets or severities', () => {
    const base = { asset: 'TR-1', device: 'ANSI 50 Overcurrent', message: 'x', severity: 'critical' as const };
    const a = raiseAlarm([item({ ...base })], { ...base, asset: 'TR-2' }, makeId, ts);
    expect(a.added).toBe(true);
    const b = raiseAlarm([item({ ...base })], { ...base, severity: 'major' }, makeId, ts);
    expect(b.added).toBe(true);
  });

  it('creates a fresh entry when the previous one is archived or cleared', () => {
    for (const state of ['archived', 'cleared_unacked'] as const) {
      const existing = [item({ state })];
      const { next, added } = raiseAlarm(
        existing,
        { asset: 'TR-1', device: 'ANSI 59 Relay', message: 'again', severity: 'major' },
        makeId,
        ts
      );
      expect(added).toBe(true);
      expect(next[0].state).toBe('active_unacked');
    }
  });

  it('caps the buffer at MAX_ALARMS keeping newest entries', () => {
    let prev: AlarmItem[] = [];
    for (let i = 0; i < MAX_ALARMS + 50; i++) {
      prev = raiseAlarm(prev, { asset: `TR-${i}`, device: 'X', message: `m${i}`, severity: 'info' }, makeId, ts).next;
    }
    expect(prev).toHaveLength(MAX_ALARMS);
    expect(prev[0].message).toBe(`m${MAX_ALARMS + 49}`);
  });
});

describe('evaluateTelemetryAlarms', () => {
  it('returns no findings inside the deadband', () => {
    const findings = evaluateTelemetryAlarms(
      { asset: 'TR-1', gridVoltageKV: 132, loadCurrentA: 400, oilTempC: 70 },
      THRESHOLDS
    );
    expect(findings).toEqual([]);
  });

  it('flags overvoltage, undervoltage, overcurrent and oil temperature', () => {
    const findings = evaluateTelemetryAlarms(
      { asset: 'TR-1', gridVoltageKV: 145, loadCurrentA: 580, oilTempC: 90 },
      THRESHOLDS
    );
    const devices = findings.map((f) => f.device);
    expect(devices).toContain('ANSI 59 Relay');
    expect(devices).toContain('ANSI 50 Overcurrent');
    expect(devices).toContain('Thermal Watchdog');
    expect(devices).not.toContain('ANSI 27 Relay');
    expect(findings.find((f) => f.device === 'ANSI 59 Relay')?.message).toContain('145.0 kV');
  });

  it('flags undervoltage and checks winding hotspot when provided', () => {
    const under = evaluateTelemetryAlarms({ asset: 'TR-1', gridVoltageKV: 115, loadCurrentA: 100, oilTempC: 60 }, THRESHOLDS);
    expect(under.map((f) => f.device)).toContain('ANSI 27 Relay');

    const windOk = evaluateTelemetryAlarms(
      { asset: 'TR-1', gridVoltageKV: 132, loadCurrentA: 100, oilTempC: 60, windingTempC: 104 },
      THRESHOLDS
    );
    expect(windOk.map((f) => f.device)).not.toContain('ANSI 49 Winding Temp Relay');

    const windHot = evaluateTelemetryAlarms(
      { asset: 'TR-1', gridVoltageKV: 132, loadCurrentA: 100, oilTempC: 60, windingTempC: 108 },
      THRESHOLDS
    );
    expect(windHot.map((f) => f.device)).toContain('ANSI 49 Winding Temp Relay');
  });
});
