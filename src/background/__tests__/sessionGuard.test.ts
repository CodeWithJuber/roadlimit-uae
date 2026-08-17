import { describe, expect, it } from 'vitest';

import { EMPTY_SNAPSHOT } from '../../storage';
import type { ActiveDriveSession } from '../../storage';
import type { DriveSnapshot } from '../../domain/types';
import {
  canProcessBackgroundSession,
  MAX_BACKGROUND_SESSION_SILENCE_MS,
} from '../sessionGuard';

const now = 1_800_000_000_000;
const session: ActiveDriveSession = {
  id: 'drive-a',
  startedAt: now - 10_000,
  settings: {
    detectionMode: 'manual-limit',
    manualLimitKmh: 80,
    selectedRoadId: null,
    warningOffsetKmh: 5,
    notificationsEnabled: true,
    voiceEnabled: true,
    hapticsEnabled: true,
    backgroundEnabled: true,
  },
};

const activeSnapshot: DriveSnapshot = {
  ...EMPTY_SNAPSHOT,
  active: true,
  status: 'starting',
  resolution: {
    limitKmh: 80,
    roadName: 'Manually confirmed limit',
    confidence: 'high',
    provider: 'manual',
    observedAt: session.startedAt,
  },
};

describe('persisted background session freshness guard', () => {
  it('accepts fresh persisted evidence for the separate runtime-lease check', () => {
    expect(canProcessBackgroundSession(session, activeSnapshot, now)).toBe(true);
  });

  it('rejects missing, inactive, or restart-required sessions', () => {
    expect(canProcessBackgroundSession(null, activeSnapshot, now)).toBe(false);
    expect(
      canProcessBackgroundSession(session, EMPTY_SNAPSHOT, now),
    ).toBe(false);
    expect(
      canProcessBackgroundSession(
        session,
        { ...activeSnapshot, restartRequired: true },
        now,
      ),
    ).toBe(false);
  });

  it('fails closed after a long callback gap', () => {
    const staleStartedAt = now - MAX_BACKGROUND_SESSION_SILENCE_MS - 1;
    expect(
      canProcessBackgroundSession(
        { ...session, startedAt: staleStartedAt },
        {
          ...activeSnapshot,
          lastFixAt: staleStartedAt,
          resolution: {
            ...activeSnapshot.resolution,
            observedAt: staleStartedAt,
          },
        },
        now,
      ),
    ).toBe(false);
  });
});
