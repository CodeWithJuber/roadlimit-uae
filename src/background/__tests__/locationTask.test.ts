import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  defineTask: vi.fn(),
  endDriveSession: vi.fn(),
  getDriveSession: vi.fn(),
  getSnapshot: vi.fn(),
  isRuntimeSessionActive: vi.fn(),
  processLocationError: vi.fn(),
  processLocationSamples: vi.fn(),
  resetDriveBuffers: vi.fn(),
  saveSnapshot: vi.fn(),
  stopLocationUpdatesAsync: vi.fn(),
  task: null as null | ((body: { data?: unknown; error?: { message: string } }) => Promise<void>),
}));

vi.mock('expo-location', () => ({
  stopLocationUpdatesAsync: mocks.stopLocationUpdatesAsync,
}));

vi.mock('expo-task-manager', () => ({
  isTaskDefined: vi.fn(() => false),
  defineTask: mocks.defineTask,
}));

vi.mock('react-native', () => ({
  AppState: { currentState: 'background' },
}));

vi.mock('../../services/driveEngine', () => ({
  processLocationError: mocks.processLocationError,
  processLocationSamples: mocks.processLocationSamples,
}));

vi.mock('../../services/runtimeSession', () => ({
  isRuntimeSessionActive: mocks.isRuntimeSessionActive,
}));

const emptySnapshot = {
  active: false,
  currentSpeedKmh: null,
  accuracyMetres: null,
  resolution: {
    limitKmh: null,
    roadName: null,
    confidence: 'unknown',
    provider: 'none',
    observedAt: 0,
  },
  lastFixAt: null,
  status: 'idle',
  alertBand: 'safe',
} as const;

vi.mock('../../storage', () => ({
  EMPTY_SNAPSHOT: emptySnapshot,
  endDriveSession: mocks.endDriveSession,
  getDriveSession: mocks.getDriveSession,
  getSnapshot: mocks.getSnapshot,
  resetDriveBuffers: mocks.resetDriveBuffers,
  saveSnapshot: mocks.saveSnapshot,
}));

mocks.defineTask.mockImplementation((_name, handler) => {
  mocks.task = handler;
});
await import('../locationTask');

describe('registered background task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.endDriveSession.mockResolvedValue(undefined);
    mocks.resetDriveBuffers.mockResolvedValue(undefined);
    mocks.saveSnapshot.mockResolvedValue(undefined);
    mocks.stopLocationUpdatesAsync.mockResolvedValue(undefined);
  });

  it('registers one top-level executor', () => {
    // Registration occurs during module evaluation, before beforeEach clears
    // the spy. The captured handler itself proves that wiring remains present.
    expect(mocks.task).not.toBeNull();
  });

  it('fails closed when session storage cannot be read', async () => {
    mocks.getDriveSession.mockRejectedValueOnce(new Error('storage unavailable'));
    mocks.getSnapshot.mockResolvedValueOnce(emptySnapshot);

    await mocks.task?.({ data: { locations: [] } });

    expect(mocks.endDriveSession).toHaveBeenCalledOnce();
    expect(mocks.stopLocationUpdatesAsync).toHaveBeenCalledOnce();
    expect(mocks.resetDriveBuffers).toHaveBeenCalledOnce();
    expect(mocks.processLocationSamples).not.toHaveBeenCalled();
  });
});
