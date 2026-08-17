import { AppState } from 'react-native';

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import type { LocationSample } from '../domain/types';
import { processLocationError, processLocationSamples } from '../services/driveEngine';
import { isRuntimeSessionCurrent } from '../services/runtimeSession';
import {
  endDriveSession,
  getDriveSession,
  resetDriveBuffers,
} from '../storage';
import { LOCATION_TASK_NAME } from './locationTaskConfig';

const toSample = (location: Location.LocationObject): LocationSample => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  speedMps: location.coords.speed,
  accuracyMetres: location.coords.accuracy,
  headingDegrees: location.coords.heading,
  timestamp: location.timestamp,
});

if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    const session = await getDriveSession();
    if (!session || !isRuntimeSessionCurrent(session.id)) {
      await endDriveSession().catch(() => undefined);
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(
        () => undefined,
      );
      await resetDriveBuffers().catch(() => undefined);
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
  });
}
