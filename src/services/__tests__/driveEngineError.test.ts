import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  appendTrace: vi.fn(),
  deliverAlert: vi.fn(),
  deliverTrackingStoppedNotice: vi.fn(),
  endDriveSession: vi.fn(),
  getAlertState: vi.fn(),
  getDriveSession: vi.fn(),
  getSnapshot: vi.fn(),
  isDriveSessionCurrent: vi.fn(),
  resetDriveBuffers: vi.fn(),
  saveAlertState: vi.fn(),
  saveSnapshot: vi.fn(),
  stopAlertOutputs: vi.fn(),
  stopLocationUpdatesAsync: vi.fn(),
}));

vi.mock('expo-location', () => ({
  stopLocationUpdatesAsync: mocks.stopLocationUpdatesAsync,
}));

vi.mock('../../storage', () => ({
  appendTrace: mocks.appendTrace,
  endDriveSession: mocks.endDriveSession,
  getAlertState: mocks.getAlertState,
  getDriveSession: mocks.getDriveSession,
  getSnapshot: mocks.getSnapshot,
  isDriveSessionCurrent: mocks.isDriveSessionCurrent,
  resetDriveBuffers: mocks.resetDriveBuffers,
  saveAlertState: mocks.saveAlertState,
  saveSnapshot: mocks.saveSnapshot,
}));

vi.mock('../notifications', () => ({
  deliverAlert: mocks.deliverAlert,
  deliverTrackingStoppedNotice: mocks.deliverTrackingStoppedNotice,
  stopAlertOutputs: mocks.stopAlertOutputs,
}));

import { processLocationError } from '../driveEngine';

const activeSnapshot = {
  active: true,
  currentSpeedKmh: 80,
  accuracyMetres: 8,
  resolution: {
    limitKmh: 80,
    roadName: 'Manually confirmed limit',
    confidence: 'high',
    provider: 'manual',
    observedAt: 1,
  },
  lastFixAt: 1,
  status: 'tracking',
  alertBand: 'safe',
} as const;

describe('background location error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSnapshot.mockResolvedValue(activeSnapshot);
    mocks.isDriveSessionCurrent.mockResolvedValue(true);
    mocks.endDriveSession.mockResolvedValue(undefined);
    mocks.stopLocationUpdatesAsync.mockResolvedValue(undefined);
    mocks.stopAlertOutputs.mockResolvedValue(undefined);
    mocks.resetDriveBuffers.mockResolvedValue(undefined);
    mocks.deliverTrackingStoppedNotice.mockResolvedValue(true);
    mocks.saveSnapshot.mockResolvedValue(undefined);
  });

  it('invalidates, stops, notifies, and persists an inactive error', async () => {
    await processLocationError('Provider unavailable.', 'session-a');

    expect(mocks.endDriveSession).toHaveBeenCalledOnce();
    expect(mocks.stopLocationUpdatesAsync).toHaveBeenCalledOnce();
    expect(mocks.deliverTrackingStoppedNotice).toHaveBeenCalledOnce();
    expect(mocks.saveSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        active: false,
        currentSpeedKmh: null,
        status: 'error',
        alertBand: 'safe',
      }),
    );
  });

  it('requires a restart when native shutdown cannot be confirmed', async () => {
    mocks.stopLocationUpdatesAsync.mockRejectedValueOnce(new Error('bridge failed'));

    await processLocationError('Provider unavailable.', 'session-a');

    expect(mocks.saveSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ active: false, restartRequired: true }),
    );
  });

  it('stops a screen-open session without touching background registration', async () => {
    await processLocationError('Foreground provider unavailable.', 'session-a', false);

    expect(mocks.stopLocationUpdatesAsync).not.toHaveBeenCalled();
    expect(mocks.saveSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ active: false, status: 'error' }),
    );
  });
});
