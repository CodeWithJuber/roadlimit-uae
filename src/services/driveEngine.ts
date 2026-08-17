import * as Location from 'expo-location';

import { LOCATION_TASK_NAME } from '../background/locationTaskConfig';
import { evaluateSpeedAlert } from '../core/alertPolicy';
import {
  isUsableLocation,
  metresPerSecondToKmh,
  smoothedSpeedKmh,
} from '../core/speed';
import { getRoadById } from '../data/demoRoads';
import type {
  DriveSettings,
  DriveSnapshot,
  LimitResolution,
  LocationSample,
} from '../domain/types';
import {
  appendTrace,
  endDriveSession,
  getAlertState,
  getDriveSession,
  getSnapshot,
  isDriveSessionCurrent,
  resetDriveBuffers,
  saveAlertState,
  saveSnapshot,
} from '../storage';
import {
  deliverAlert,
  deliverTrackingStoppedNotice,
  stopAlertOutputs,
} from './notifications';
import { clearRuntimeSession } from './runtimeSession';

const shutdownBackgroundSession = async (
  stopBackgroundRegistration = true,
): Promise<boolean> => {
  clearRuntimeSession();
  await endDriveSession().catch(() => undefined);
  const nativeStopFailed = stopBackgroundRegistration
    ? await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).then(
        () => false,
        () => true,
      )
    : false;
  await stopAlertOutputs().catch(() => undefined);
  await resetDriveBuffers().catch(() => undefined);
  return nativeStopFailed;
};

export const buildSessionResolution = (
  settings: DriveSettings,
  confirmedAt: number,
): LimitResolution => {
  if (settings.detectionMode === 'manual-limit') {
    return {
      limitKmh: settings.manualLimitKmh,
      roadName: 'Manually confirmed limit',
      confidence: 'high',
      provider: 'manual',
      advisory: 'Static session value. Follow posted and temporary signs and authority instructions; stop and reconfirm while parked.',
      observedAt: confirmedAt,
    };
  }

  if (settings.detectionMode === 'manual-road') {
    const road = getRoadById(settings.selectedRoadId);
    if (!road) {
      return {
        limitKmh: null,
        roadName: null,
        confidence: 'unknown',
        provider: 'none',
        advisory: 'Choose a road and confirm its posted limit before starting.',
        observedAt: confirmedAt,
      };
    }
    return {
      limitKmh: settings.manualLimitKmh,
      roadName: road.canonicalName,
      confidence: 'high',
      provider: 'catalog',
      advisory: 'Static road-name reference. Follow posted and temporary signs and authority instructions; stop and reconfirm while parked.',
      observedAt: confirmedAt,
    };
  }

  return {
    limitKmh: null,
    roadName: null,
    confidence: 'unknown',
    provider: 'none',
    advisory: 'No verified limit source is selected. Follow the posted sign.',
    observedAt: confirmedAt,
  };
};

const runLocationSamples = async (
  incoming: LocationSample[],
  allowSpeech: boolean,
  expectedSessionId: string,
  requireNotification: boolean,
): Promise<DriveSnapshot> => {
  const session = await getSnapshot();
  const activeSession = await getDriveSession();
  if (
    !session.active ||
    !activeSession ||
    activeSession.id !== expectedSessionId
  ) {
    return session;
  }

  const settings = activeSession.settings;
  const ordered = [...incoming]
    .filter((sample) => sample.timestamp >= activeSession.startedAt)
    .sort((a, b) => a.timestamp - b.timestamp);
  const latest = ordered.at(-1);

  const usablePosition = latest ? isUsableLocation(latest) : false;
  const usableCurrentSpeed = latest
    ? metresPerSecondToKmh(latest.speedMps) !== null
    : false;
  if (!latest || !usablePosition || !usableCurrentSpeed) {
    const signalMessage = usablePosition
      ? 'The current GPS speed is unavailable or implausible. Speed alerts are paused.'
      : 'GPS accuracy is not sufficient for a current-speed alert.';
    const snapshot: DriveSnapshot = {
      active: true,
      currentSpeedKmh: null,
      accuracyMetres: latest?.accuracyMetres ?? null,
      resolution: buildSessionResolution(settings, activeSession.startedAt),
      lastFixAt: latest?.timestamp ?? null,
      status: 'degraded',
      alertBand: 'safe',
      message: session.sessionWarning
        ? `${session.sessionWarning} ${signalMessage}`
        : signalMessage,
      ...(session.sessionWarning ? { sessionWarning: session.sessionWarning } : {}),
    };
    if (await isDriveSessionCurrent(expectedSessionId)) await saveSnapshot(snapshot);
    return snapshot;
  }

  const trace = await appendTrace(ordered);
  const speedKmh = smoothedSpeedKmh(trace);
  const resolution = buildSessionResolution(settings, activeSession.startedAt);
  const currentSession = await getSnapshot();
  if (
    !currentSession.active ||
    !(await isDriveSessionCurrent(expectedSessionId))
  ) {
    return currentSession;
  }

  const alertState = await getAlertState();
  const evaluation = evaluateSpeedAlert({
    speedKmh,
    limitKmh: resolution.limitKmh,
    warningOffsetKmh: settings.warningOffsetKmh,
    state: alertState,
  });
  let backgroundNotificationFailed = false;
  if (evaluation.event && (await isDriveSessionCurrent(expectedSessionId))) {
    const delivery = await deliverAlert(evaluation.event, settings, { allowSpeech });
    if (!(await isDriveSessionCurrent(expectedSessionId))) return getSnapshot();
    backgroundNotificationFailed =
      requireNotification &&
      settings.notificationsEnabled &&
      !delivery.notificationDelivered;
  }
  if (backgroundNotificationFailed) {
    const nativeStopFailed = await shutdownBackgroundSession();
    const stopped: DriveSnapshot = {
      active: false,
      currentSpeedKmh: null,
      accuracyMetres: latest.accuracyMetres,
      resolution,
      lastFixAt: latest.timestamp,
      status: 'error',
      alertBand: 'safe',
      ...(nativeStopFailed ? { restartRequired: true } : {}),
      message: nativeStopFailed
        ? 'A background alert could not be delivered. The session was invalidated, but location shutdown could not be confirmed. Reopen the app before driving again.'
        : 'A background alert could not be delivered, so tracking stopped. Reopen the app, enable RoadLimit notifications, and confirm the sign again.',
    };
    await saveSnapshot(stopped);
    return stopped;
  }
  if (await isDriveSessionCurrent(expectedSessionId)) {
    await saveAlertState(evaluation.state);
  }

  const snapshot: DriveSnapshot = {
    active: true,
    currentSpeedKmh: speedKmh,
    accuracyMetres: latest.accuracyMetres,
    resolution,
    lastFixAt: latest.timestamp,
    status:
      resolution.limitKmh === null || speedKmh === null ? 'degraded' : 'tracking',
    alertBand: evaluation.state.band,
    ...(speedKmh === null
      ? { message: 'Current GPS speed is unavailable. No speed alert can be calculated.' }
      : currentSession.sessionWarning
        ? { message: currentSession.sessionWarning }
        : {}),
    ...(currentSession.sessionWarning
      ? { sessionWarning: currentSession.sessionWarning }
      : {}),
  };
  if (await isDriveSessionCurrent(expectedSessionId)) {
    await saveSnapshot(snapshot);
    return snapshot;
  }
  return getSnapshot();
};

let processingTail: Promise<void> = Promise.resolve();

export const processLocationSamples = (
  incoming: LocationSample[],
  allowSpeech: boolean,
  sessionId: string,
  requireNotification = false,
): Promise<DriveSnapshot> => {
  const result = processingTail.then(() =>
    runLocationSamples(incoming, allowSpeech, sessionId, requireNotification),
  );
  processingTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

export const processLocationError = (
  message: string,
  sessionId: string,
  stopBackgroundRegistration = true,
): Promise<void> => {
  const result = processingTail.then(async () => {
    const current = await getSnapshot();
    if (!current.active || !(await isDriveSessionCurrent(sessionId))) return;
    const nativeStopFailed = await shutdownBackgroundSession(
      stopBackgroundRegistration,
    );
    await deliverTrackingStoppedNotice();
    await saveSnapshot({
      ...current,
      active: false,
      currentSpeedKmh: null,
      status: 'error',
      alertBand: 'safe',
      ...(nativeStopFailed ? { restartRequired: true } : {}),
      message: nativeStopFailed
        ? `Location tracking failed and the native service could not be confirmed stopped. Reopen the app before driving again. ${message}`
        : `Location tracking failed and stopped. Reopen the app and confirm the sign again. ${message}`,
    });
  });
  processingTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

export const waitForLocationProcessing = async (): Promise<void> => {
  await processingTail;
};
