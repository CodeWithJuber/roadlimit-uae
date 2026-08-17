import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { LOCATION_TASK_NAME } from '../background/locationTaskConfig';
import type { DriveSettings, LocationSample } from '../domain/types';
import { configureAlerts } from './notifications';

export type TrackingMode = 'background' | 'foreground';

export type TrackingStartResult = {
  mode: TrackingMode;
  warning: string | null;
};

export class LocationPermissionError extends Error {}

export const mapLocation = (location: Location.LocationObject): LocationSample => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  speedMps: location.coords.speed,
  accuracyMetres: location.coords.accuracy,
  headingDegrees: location.coords.heading,
  timestamp: location.timestamp,
});

export const beginTracking = async (
  settings: DriveSettings,
): Promise<TrackingStartResult> => {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new LocationPermissionError('Turn on Location Services before starting a drive.');
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    throw new LocationPermissionError(
      'Precise location permission is required for live speed alerts.',
    );
  }
  const preciseLocationGranted =
    Platform.OS === 'android'
      ? foreground.android?.accuracy === 'fine'
      : foreground.ios?.accuracy === 'full';
  if (!preciseLocationGranted) {
    throw new LocationPermissionError(
      'Enable Precise Location for reliable GPS-speed alerts, then start again.',
    );
  }

  const notificationsReady = settings.notificationsEnabled
    ? await configureAlerts()
    : false;

  if (!settings.backgroundEnabled) {
    return {
      mode: 'foreground',
      warning: notificationsReady
        ? 'Screen-open mode is active. Tracking pauses when the app leaves the screen.'
        : 'Screen-open visual alerts only. Tracking pauses when the app leaves the screen.',
    };
  }

  if (!notificationsReady) {
    return {
      mode: 'foreground',
      warning: 'Background alerts require local-notification permission. Screen-open mode is active.',
    };
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return {
      mode: 'foreground',
      warning: 'Expo Go cannot run reliable background location. Screen-open mode is active; use a development or release build for background alerts.',
    };
  }

  const taskManagerAvailable = await TaskManager.isAvailableAsync();
  if (!taskManagerAvailable) {
    return {
      mode: 'foreground',
      warning: 'Background tasks need an Expo development or release build, not Expo Go.',
    };
  }

  if (Platform.OS === 'ios') {
    const background =
      (await Location.requestBackgroundPermissionsAsync()) as Location.LocationPermissionResponse;
    if (!background.granted || background.ios?.scope !== 'always') {
      return {
        mode: 'foreground',
        warning: 'Always location was not granted. Screen-open mode is active.',
      };
    }
  }

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2_000,
    distanceInterval: 5,
    activityType: Location.ActivityType.AutomotiveNavigation,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'RoadLimit UAE is active',
      notificationBody: 'Monitoring speed against the session limit you confirmed.',
      notificationColor: '#1FD18A',
      killServiceOnDestroy: false,
    },
  });

  return { mode: 'background', warning: null };
};

export const watchForeground = (
  onLocation: (sample: LocationSample) => void | Promise<void>,
  onError: (message: string) => void | Promise<void>,
): Promise<Location.LocationSubscription> => {
  const reportError = (message: string): void => {
    void Promise.resolve(onError(message)).catch(() => undefined);
  };
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2_000,
      distanceInterval: 5,
    },
    (location) => {
      void Promise.resolve(onLocation(mapLocation(location))).catch((error: unknown) => {
        reportError(
          error instanceof Error ? error.message : 'Foreground location processing failed.',
        );
      });
    },
    reportError,
  );
};

export const stopTracking = async (): Promise<void> => {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
};

export const isBackgroundTrackingRegistered = async (): Promise<boolean> =>
  Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
