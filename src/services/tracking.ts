import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import { LOCATION_TASK_NAME } from '../background/locationTaskConfig';
import type { DriveSettings, LocationSample } from '../domain/types';
import { configureAlerts } from './notifications';

export type TrackingMode = 'background' | 'foreground';

export type TrackingStartResult = {
  mode: TrackingMode;
  warning: string | null;
};

export type TrackingPreparation = TrackingStartResult;

export class LocationPermissionError extends Error {}

const waitForVisibleApp = async (): Promise<void> => {
  if (AppState.currentState === 'active') return;
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let subscription: { remove: () => void } | null = null;
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      subscription?.remove();
      if (error) reject(error);
      else resolve();
    };
    subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') finish();
    });
    timeout = setTimeout(
      () =>
        finish(
          new LocationPermissionError(
            'Return to RoadLimit UAE and start the drive again while the app is visible.',
          ),
        ),
      8_000,
    );
  });
};

export const mapLocation = (location: Location.LocationObject): LocationSample => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  speedMps: location.coords.speed,
  accuracyMetres: location.coords.accuracy,
  headingDegrees: location.coords.heading,
  timestamp: location.timestamp,
});

export const prepareTracking = async (
  settings: DriveSettings,
): Promise<TrackingPreparation> => {
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

  // Permission sheets can briefly background or recreate an Android activity.
  // Finish each prompt phase only after the app is visible again.
  await waitForVisibleApp();

  const notificationsReady = settings.notificationsEnabled
    ? await configureAlerts().catch(() => false)
    : false;
  await waitForVisibleApp();

  // Expo SDK 57's Android background-location foreground-service path has an
  // accepted lifecycle defect that can stop or freeze some devices. The beta
  // therefore uses the foreground watcher on Android and keeps the screen
  // awake; iOS background support remains separately gated below.
  if (Platform.OS === 'android') {
    return {
      mode: 'foreground',
      warning: notificationsReady
        ? 'Android beta uses screen-on tracking for reliability. Keep RoadLimit open; tracking stops if you leave the app or lock the screen.'
        : 'Android beta uses screen-on visual alerts. Keep RoadLimit open; tracking stops if you leave the app or lock the screen.',
    };
  }

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
    await waitForVisibleApp();
  }

  return { mode: 'background', warning: null };
};

export const startPreparedTracking = async (
  preparation: TrackingPreparation,
): Promise<void> => {
  if (preparation.mode !== 'background') return;

  // Defence in depth: Android beta must never enter Expo SDK 57's unstable
  // background FGS path, even if a malformed preparation reaches this call.
  if (Platform.OS === 'android') {
    throw new LocationPermissionError(
      'Android background tracking is disabled in this beta. Use screen-on mode.',
    );
  }

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME,
  );
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  await waitForVisibleApp();
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
      notificationColor: '#F26430',
      killServiceOnDestroy: false,
    },
  });
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
