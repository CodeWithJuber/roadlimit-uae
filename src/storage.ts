import AsyncStorage from '@react-native-async-storage/async-storage';

import { INITIAL_ALERT_STATE } from './core/alertPolicy';
import { MAX_FIX_AGE_MS } from './core/speed';
import type {
  AlertState,
  DriveSettings,
  DriveSnapshot,
  LocationSample,
  SpeedSample,
} from './domain/types';

const SETTINGS_KEY = '@roadlimit/settings/v1';
const SNAPSHOT_KEY = '@roadlimit/snapshot/v1';
const ALERT_STATE_KEY = '@roadlimit/alert-state/v1';
const SESSION_KEY = '@roadlimit/active-session/v1';
const SPEED_TRACE_KEY = '@roadlimit/speed-trace/v1';

export const DEFAULT_SETTINGS: DriveSettings = {
  detectionMode: 'manual-limit',
  manualLimitKmh: 80,
  selectedRoadId: null,
  warningOffsetKmh: 5,
  notificationsEnabled: true,
  voiceEnabled: true,
  hapticsEnabled: true,
  backgroundEnabled: true,
};

export const EMPTY_SNAPSHOT: DriveSnapshot = {
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
};

const parseJson = (value: string | null): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNumberOrNull = (
  value: unknown,
  minimum: number,
  maximum: number,
): number | null =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= minimum &&
  value <= maximum
    ? value
    : null;

const normalizeSettings = (value: unknown): DriveSettings => {
  const stored = isRecord(value) ? value : {};
  const manualLimitKmh = finiteNumberOrNull(stored.manualLimitKmh, 20, 160);
  const warningOffsetKmh =
    stored.warningOffsetKmh === 3 ||
    stored.warningOffsetKmh === 5 ||
    stored.warningOffsetKmh === 10
      ? stored.warningOffsetKmh
      : DEFAULT_SETTINGS.warningOffsetKmh;
  return {
    detectionMode:
      stored.detectionMode === 'manual-road' ? 'manual-road' : 'manual-limit',
    manualLimitKmh: manualLimitKmh ?? DEFAULT_SETTINGS.manualLimitKmh,
    selectedRoadId:
      typeof stored.selectedRoadId === 'string'
        ? stored.selectedRoadId.slice(0, 120)
        : null,
    warningOffsetKmh,
    notificationsEnabled:
      typeof stored.notificationsEnabled === 'boolean'
        ? stored.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,
    voiceEnabled:
      typeof stored.voiceEnabled === 'boolean'
        ? stored.voiceEnabled
        : DEFAULT_SETTINGS.voiceEnabled,
    hapticsEnabled:
      typeof stored.hapticsEnabled === 'boolean'
        ? stored.hapticsEnabled
        : DEFAULT_SETTINGS.hapticsEnabled,
    backgroundEnabled:
      typeof stored.backgroundEnabled === 'boolean'
        ? stored.backgroundEnabled
        : DEFAULT_SETTINGS.backgroundEnabled,
  };
};

const normalizeSnapshot = (value: unknown): DriveSnapshot => {
  if (!isRecord(value)) return EMPTY_SNAPSHOT;
  const rawResolution = isRecord(value.resolution) ? value.resolution : {};
  const provider =
    rawResolution.provider === 'manual' || rawResolution.provider === 'catalog'
      ? rawResolution.provider
      : 'none';
  const confidence =
    rawResolution.confidence === 'high' ||
    rawResolution.confidence === 'medium' ||
    rawResolution.confidence === 'low'
      ? rawResolution.confidence
      : 'unknown';
  const status =
    value.status === 'starting' ||
    value.status === 'tracking' ||
    value.status === 'degraded' ||
    value.status === 'error'
      ? value.status
      : 'idle';
  const alertBand =
    value.alertBand === 'approaching' || value.alertBand === 'over-limit'
      ? value.alertBand
      : 'safe';
  const snapshot: DriveSnapshot = {
    active: value.active === true,
    currentSpeedKmh: finiteNumberOrNull(value.currentSpeedKmh, 0, 252),
    accuracyMetres: finiteNumberOrNull(value.accuracyMetres, 0, 10_000),
    resolution: {
      limitKmh: finiteNumberOrNull(rawResolution.limitKmh, 20, 160),
      roadName:
        typeof rawResolution.roadName === 'string'
          ? rawResolution.roadName.slice(0, 160)
          : null,
      confidence,
      provider,
      ...(typeof rawResolution.advisory === 'string'
        ? { advisory: rawResolution.advisory.slice(0, 500) }
        : {}),
      observedAt: finiteNumberOrNull(
        rawResolution.observedAt,
        0,
        Date.now() + 60_000,
      ) ?? 0,
    },
    lastFixAt: finiteNumberOrNull(value.lastFixAt, 0, Date.now() + 60_000),
    status,
    alertBand,
    ...(value.restartRequired === true ? { restartRequired: true } : {}),
    ...(typeof value.message === 'string'
      ? { message: value.message.slice(0, 500) }
      : {}),
    ...(typeof value.sessionWarning === 'string'
      ? { sessionWarning: value.sessionWarning.slice(0, 500) }
      : {}),
  };
  if (!snapshot.active) {
    return {
      ...snapshot,
      currentSpeedKmh: null,
      alertBand: 'safe',
      status: snapshot.status === 'error' ? 'error' : 'idle',
    };
  }
  return snapshot;
};

const normalizeAlertState = (value: unknown): AlertState => {
  if (!isRecord(value)) return INITIAL_ALERT_STATE;
  const rawLastAlertAt = isRecord(value.lastAlertAt) ? value.lastAlertAt : {};
  const approaching = finiteNumberOrNull(
    rawLastAlertAt.approaching,
    0,
    Date.now() + 60_000,
  );
  const overLimit = finiteNumberOrNull(
    rawLastAlertAt['over-limit'],
    0,
    Date.now() + 60_000,
  );
  return {
    band:
      value.band === 'approaching' || value.band === 'over-limit'
        ? value.band
        : 'safe',
    lastAlertAt: {
      ...(approaching === null ? {} : { approaching }),
      ...(overLimit === null ? {} : { 'over-limit': overLimit }),
    },
  };
};

const normalizeSpeedTrace = (value: unknown): SpeedSample[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((sample): SpeedSample[] => {
    if (!isRecord(sample)) return [];
    const speedMps =
      sample.speedMps === null
        ? null
        : finiteNumberOrNull(sample.speedMps, 0, 70);
    const timestamp = finiteNumberOrNull(
      sample.timestamp,
      Date.now() - MAX_FIX_AGE_MS,
      Date.now() + 1_000,
    );
    const accuracyMetres =
      sample.accuracyMetres === null
        ? null
        : finiteNumberOrNull(sample.accuracyMetres, 0, 50);
    if (timestamp === null || accuracyMetres === null) return [];
    return [{ speedMps, accuracyMetres, timestamp }];
  });
};

export const getSettings = async (): Promise<DriveSettings> => {
  return normalizeSettings(parseJson(await AsyncStorage.getItem(SETTINGS_KEY)));
};

export const saveSettings = async (settings: DriveSettings): Promise<void> =>
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

export const getSnapshot = async (): Promise<DriveSnapshot> =>
  normalizeSnapshot(parseJson(await AsyncStorage.getItem(SNAPSHOT_KEY)));

export const saveSnapshot = async (snapshot: DriveSnapshot): Promise<void> =>
  AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));

export const getAlertState = async (): Promise<AlertState> =>
  normalizeAlertState(parseJson(await AsyncStorage.getItem(ALERT_STATE_KEY)));

export const saveAlertState = async (state: AlertState): Promise<void> =>
  AsyncStorage.setItem(ALERT_STATE_KEY, JSON.stringify(state));

export const appendTrace = async (incoming: LocationSample[]): Promise<SpeedSample[]> => {
  const current = normalizeSpeedTrace(
    parseJson(await AsyncStorage.getItem(SPEED_TRACE_KEY)),
  );
  const uniqueByTimestamp = new Map<number, SpeedSample>();
  const now = Date.now();
  [
    ...current,
    ...incoming.map(({ speedMps, accuracyMetres, timestamp }) => ({
      speedMps:
        speedMps !== null &&
        Number.isFinite(speedMps) &&
        speedMps >= 0 &&
        speedMps <= 70
          ? speedMps
          : null,
      accuracyMetres,
      timestamp,
    })),
  ]
    .filter((sample) => {
      const ageMs = now - sample.timestamp;
      const accuracy = sample.accuracyMetres ?? Number.POSITIVE_INFINITY;
      return (
        ageMs >= 0 &&
        ageMs <= MAX_FIX_AGE_MS &&
        accuracy <= 50 &&
        (sample.speedMps === null ||
          (Number.isFinite(sample.speedMps) &&
            sample.speedMps >= 0 &&
            sample.speedMps <= 70))
      );
    })
    .forEach((sample) => uniqueByTimestamp.set(sample.timestamp, sample));
  const speedTrace = [...uniqueByTimestamp.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-8);
  await AsyncStorage.setItem(SPEED_TRACE_KEY, JSON.stringify(speedTrace));
  return speedTrace;
};

export const resetDriveBuffers = async (): Promise<void> => {
  await AsyncStorage.multiRemove([ALERT_STATE_KEY, SPEED_TRACE_KEY]);
};

export type ActiveDriveSession = {
  id: string;
  startedAt: number;
  settings: DriveSettings;
};

export const beginDriveSession = async (
  settings: DriveSettings,
): Promise<ActiveDriveSession> => {
  const startedAt = Date.now();
  const session = {
    id: `${startedAt}-${Math.random().toString(36).slice(2)}`,
    startedAt,
    settings,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getDriveSession = async (): Promise<ActiveDriveSession | null> => {
  const session = parseJson(await AsyncStorage.getItem(SESSION_KEY));
  if (!isRecord(session) || !isRecord(session.settings)) return null;
  const startedAt = finiteNumberOrNull(
    session.startedAt,
    Date.now() - 24 * 60 * 60 * 1_000,
    Date.now() + 60_000,
  );
  if (typeof session.id !== 'string' || !session.id || startedAt === null) {
    return null;
  }
  return {
    id: session.id.slice(0, 160),
    startedAt,
    settings: normalizeSettings(session.settings),
  };
};

export const isDriveSessionCurrent = async (id: string): Promise<boolean> =>
  (await getDriveSession())?.id === id;

export const endDriveSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
