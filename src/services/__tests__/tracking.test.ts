import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  appState: {
    currentState: 'active',
    addEventListener: vi.fn(),
  },
  configureAlerts: vi.fn(),
  hasServicesEnabledAsync: vi.fn(),
  hasStartedLocationUpdatesAsync: vi.fn(),
  isTaskManagerAvailableAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  requestBackgroundPermissionsAsync: vi.fn(),
  startLocationUpdatesAsync: vi.fn(),
  stopLocationUpdatesAsync: vi.fn(),
  platform: { OS: 'android' },
}));

vi.mock('expo-constants', () => ({
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

vi.mock('expo-location', () => ({
  Accuracy: { BestForNavigation: 6 },
  ActivityType: { AutomotiveNavigation: 4 },
  hasServicesEnabledAsync: mocks.hasServicesEnabledAsync,
  hasStartedLocationUpdatesAsync: mocks.hasStartedLocationUpdatesAsync,
  requestForegroundPermissionsAsync: mocks.requestForegroundPermissionsAsync,
  requestBackgroundPermissionsAsync: mocks.requestBackgroundPermissionsAsync,
  startLocationUpdatesAsync: mocks.startLocationUpdatesAsync,
  stopLocationUpdatesAsync: mocks.stopLocationUpdatesAsync,
}));

vi.mock('expo-task-manager', () => ({
  isAvailableAsync: mocks.isTaskManagerAvailableAsync,
}));

vi.mock('react-native', () => ({
  AppState: mocks.appState,
  Platform: mocks.platform,
}));

vi.mock('../notifications', () => ({
  configureAlerts: mocks.configureAlerts,
}));

import type { DriveSettings } from '../../domain/types';
import { prepareTracking, startPreparedTracking } from '../tracking';

const settings: DriveSettings = {
  detectionMode: 'manual-limit',
  manualLimitKmh: 80,
  selectedRoadId: null,
  warningOffsetKmh: 5,
  notificationsEnabled: true,
  voiceEnabled: true,
  hapticsEnabled: true,
  backgroundEnabled: true,
};

describe('Android tracking startup phases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.platform.OS = 'android';
    mocks.appState.currentState = 'active';
    mocks.appState.addEventListener.mockReturnValue({ remove: vi.fn() });
    mocks.hasServicesEnabledAsync.mockResolvedValue(true);
    mocks.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
      android: { accuracy: 'fine' },
      ios: { accuracy: 'full' },
    });
    mocks.requestBackgroundPermissionsAsync.mockResolvedValue({
      granted: true,
      ios: { scope: 'always' },
    });
    mocks.configureAlerts.mockResolvedValue(true);
    mocks.isTaskManagerAvailableAsync.mockResolvedValue(true);
    mocks.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
    mocks.startLocationUpdatesAsync.mockResolvedValue(undefined);
    mocks.stopLocationUpdatesAsync.mockResolvedValue(undefined);
  });

  it('forces the Android beta into screen-on mode without registering TaskManager location', async () => {
    const preparation = await prepareTracking(settings);

    expect(preparation.mode).toBe('foreground');
    expect(preparation.warning).toContain('screen-on tracking');
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
    expect(mocks.hasStartedLocationUpdatesAsync).not.toHaveBeenCalled();

    await startPreparedTracking(preparation);

    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('uses screen-open mode without registering a background task when alerts are unavailable', async () => {
    mocks.configureAlerts.mockResolvedValue(false);

    const preparation = await prepareTracking(settings);
    await startPreparedTracking(preparation);

    expect(preparation.mode).toBe('foreground');
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('degrades safely when notification setup throws', async () => {
    mocks.configureAlerts.mockRejectedValueOnce(new Error('channel unavailable'));

    const preparation = await prepareTracking(settings);

    expect(preparation.mode).toBe('foreground');
    expect(preparation.warning).toContain('visual alerts');
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('defensively rejects a malformed Android background preparation', async () => {
    await expect(
      startPreparedTracking({ mode: 'background', warning: null }),
    ).rejects.toThrow('Android background tracking is disabled');
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('rechecks app visibility immediately before iOS background registration', async () => {
    mocks.platform.OS = 'ios';
    const preparation = await prepareTracking(settings);
    expect(preparation.mode).toBe('background');

    let resume: ((state: string) => void) | undefined;
    mocks.appState.currentState = 'background';
    mocks.appState.addEventListener.mockImplementation(
      (_event: string, listener: (state: string) => void) => {
        resume = listener;
        return { remove: vi.fn() };
      },
    );

    const starting = startPreparedTracking(preparation);
    await Promise.resolve();
    await Promise.resolve();
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();

    mocks.appState.currentState = 'active';
    resume?.('active');
    await starting;

    expect(mocks.startLocationUpdatesAsync).toHaveBeenCalledOnce();
  });

  it('does not touch native tracking when precise location is denied', async () => {
    mocks.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
      android: { accuracy: 'coarse' },
    });

    await expect(prepareTracking(settings)).rejects.toThrow(
      'Enable Precise Location',
    );
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});
