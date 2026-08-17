import { beforeEach, describe, expect, it, vi } from 'vitest';

const { values } = vi.hoisted(() => ({
  values: new Map<string, string>(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      values.delete(key);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      keys.forEach((key) => values.delete(key));
    }),
  },
}));

import {
  DEFAULT_SETTINGS,
  getDriveSession,
  getSettings,
  getSnapshot,
} from '../storage';

describe('persisted-state validation', () => {
  beforeEach(() => values.clear());

  it('fails unsafe setting fields back to explicit defaults', async () => {
    values.set(
      '@roadlimit/settings/v1',
      JSON.stringify({
        detectionMode: 'cloud-auto',
        manualLimitKmh: '160',
        notificationsEnabled: 'yes',
        warningOffsetKmh: 99,
      }),
    );
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('bounds corrupted telemetry and preserves a restart-required error', async () => {
    values.set(
      '@roadlimit/snapshot/v1',
      JSON.stringify({
        active: false,
        currentSpeedKmh: 9_999,
        accuracyMetres: -1,
        resolution: { limitKmh: 500, observedAt: -1 },
        lastFixAt: Number.MAX_SAFE_INTEGER,
        status: 'error',
        alertBand: 'over-limit',
        restartRequired: true,
      }),
    );
    const snapshot = await getSnapshot();
    expect(snapshot).toMatchObject({
      active: false,
      currentSpeedKmh: null,
      accuracyMetres: null,
      status: 'error',
      alertBand: 'safe',
      restartRequired: true,
    });
    expect(snapshot.resolution.limitKmh).toBeNull();
    expect(snapshot.lastFixAt).toBeNull();
  });

  it('rejects incomplete active-session records', async () => {
    values.set(
      '@roadlimit/active-session/v1',
      JSON.stringify({ id: 'stale', startedAt: Date.now() }),
    );
    expect(await getDriveSession()).toBeNull();
  });
});
