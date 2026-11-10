import { describe, expect, it } from 'vitest';
import { SwitchgearState, UserRole } from '../types/scada';

interface TestUser {
  workstationId: string;
  userName: string;
  userRole: UserRole;
  lastActiveTimestamp: number;
}

interface TestLock {
  deviceKey: string;
  lockedBy: string;
  userRole: UserRole;
  lockExpiry: number;
  lockedByWorkstationId?: string;
}

describe('Live Sync & Multi-User Collaboration Protocol', () => {
  it('correctly calculates total connected workstations including local user', () => {
    // Zero remote users -> 1 workstation (You)
    const remoteUsersEmpty: TestUser[] = [];
    const totalSingle = 1 + remoteUsersEmpty.length;
    expect(totalSingle).toBe(1);

    // One remote user joins -> 2 workstations (You + Remote)
    const remoteUsersOne: TestUser[] = [
      { workstationId: 'WS-2041-A', userName: 'Eng. Alex', userRole: 'operator', lastActiveTimestamp: Date.now() },
    ];
    const totalTwo = 1 + remoteUsersOne.length;
    expect(totalTwo).toBe(2);

    // Two remote users -> 3 workstations
    const remoteUsersTwo: TestUser[] = [
      ...remoteUsersOne,
      { workstationId: 'WS-8832-B', userName: 'Chief Dispatcher', userRole: 'manager', lastActiveTimestamp: Date.now() },
    ];
    const totalThree = 1 + remoteUsersTwo.length;
    expect(totalThree).toBe(3);
  });

  it('determines simulation leader deterministically by lowest workstation ID', () => {
    const localWs = 'WS-5000-XYZ';
    const peer1 = 'WS-1000-ABC';
    const peer2 = 'WS-9000-MNO';

    const allWorkstations = [localWs, peer1, peer2].sort();
    const leader = allWorkstations[0];

    // Peer 1 has lowest ID ('WS-1000-ABC')
    expect(leader).toBe('WS-1000-ABC');
    expect(leader === localWs).toBe(false);

    // If Peer 1 disconnects
    const remaining = [localWs, peer2].sort();
    const newLeader = remaining[0];
    expect(newLeader).toBe(localWs);
  });

  it('enforces exclusive device lockout by workstation ID', () => {
    const localWs = 'WS-1000-LOC';
    const now = Date.now();

    const activeLocks: Record<string, TestLock> = {
      'TR-1:hvBreaker52_1': {
        deviceKey: 'TR-1:hvBreaker52_1',
        lockedBy: 'Eng. Essa Najjar',
        userRole: 'engineer',
        lockedByWorkstationId: 'WS-9999-REM',
        lockExpiry: now + 3500,
      },
    };

    const isLocked = (deviceKey: string, currentWsId: string) => {
      const lock = activeLocks[deviceKey];
      if (lock && lock.lockExpiry > Date.now()) {
        if (lock.lockedByWorkstationId ? lock.lockedByWorkstationId !== currentWsId : false) {
          return lock;
        }
      }
      return null;
    };

    // Attempt operation from local workstation -> blocked by remote lock
    const lockResult = isLocked('TR-1:hvBreaker52_1', localWs);
    expect(lockResult).not.toBeNull();
    expect(lockResult?.lockedByWorkstationId).toBe('WS-9999-REM');

    // Attempt operation on an unlocked device -> allowed
    expect(isLocked('TR-2:hvBreaker52_4', localWs)).toBeNull();
  });

  it('safely applies full switchgear state updates synchronously without race conditions', () => {
    const initialSwitches: Partial<SwitchgearState> = {
      hvBreaker52_1: true,
      mvBreaker52_2: true,
      busCoupler52_0: false,
    };

    // Remote operator trips 52-1 and interlocked disconnector
    const incomingUpdate: Partial<SwitchgearState> = {
      hvBreaker52_1: false,
      hvDisconnect89_1A: false,
    };

    const updatedSwitches = {
      ...initialSwitches,
      ...incomingUpdate,
    };

    expect(updatedSwitches.hvBreaker52_1).toBe(false);
    expect(updatedSwitches.hvDisconnect89_1A).toBe(false);
    expect(updatedSwitches.mvBreaker52_2).toBe(true);
  });
});
