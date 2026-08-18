import { AppState } from 'react-native';

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import type { DriveSnapshot } from '../domain/types';
import type { LocationSample } from '../domain/types';
import { processLocationError, processLocationSamples } from '../services/driveEngine';
import { isRuntimeSessionActive } from '../services/runtimeSession';
import {
  EMPTY_SNAPSHOT,
  endDriveSession,
  getDriveSession,
  getSnapshot,
  resetDriveBuffers,
  saveSnapshot,
} from '../storage';
import { LOCATION_TASK_NAME } from './locationTaskConfig';
import { canProcessBackgroundSession } from './sessionGuard';

const toSample = (location: Location.LocationObject): LocationSample => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  speedMps: location.coords.speed,
  accuracyMetres: location.coords.accuracy,
  headingDegrees: location.coords.heading,
  timestamp: location.timestamp,
});

const stopOrphanedTask = async (snapshot: DriveSnapshot): Promise<void> => {
  await endDriveSession().catch(() => undefined);
  const nativeStopFailed = await Location.stopLocationUpdatesAsync(
    LOCATION_TASK_NAME,
  ).then(
    () => false,
    () => true,
  );
  await resetDriveBuffers().catch(() => undefined);
  if (!snapshot.active) return;
  await saveSnapshot({
    ...snapshot,
    active: false,
    currentSpeedKmh: null,
    status: 'error',
    alertBand: 'safe',
    ...(nativeStopFailed ? { restartRequired: true } : {}),
    message: nativeStopFailed
      ? 'The saved drive session was no longer valid and location shutdown could not be confirmed. Reopen the app before driving again.'
      : 'The saved drive session was no longer valid, so tracking stopped. Reopen the app and confirm the current sign again.',
  }).catch(() => undefined);
};

if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    let readableSnapshot = EMPTY_SNAPSHOT;
    try {
      const [session, snapshot] = await Promise.all([
        getDriveSession(),
        getSnapshot(),
      ]);
      readableSnapshot = snapshot;
      if (
        !session ||
        !isRuntimeSessionActive(session.id) ||
        !canProcessBackgroundSession(session, snapshot)
      ) {
        await stopOrphanedTask(snapshot);
        return;
      }

      if (error) {
        await processLocationError(error.message, session.id);
        return;
      }

      const payload = data as { locations?: Location.LocationObject[] } | undefined;
      if (!payload?.locations?.length) return;

      await processLocationSamples(
        payload.locations.map(toSample),
        AppState.currentState === 'active',
        session.id,
        true,
      );
    } catch {
      // A storage or processing failure must not leave native tracking alive
      // while the JavaScript safety loop is unavailable.
      await stopOrphanedTask(readableSnapshot);
    }
  });
}
