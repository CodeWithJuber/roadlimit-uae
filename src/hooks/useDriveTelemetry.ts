import { useCallback, useEffect, useRef, useState } from 'react';

import type * as Location from 'expo-location';

import { MAX_FIX_AGE_MS } from '../core/speed';
import {
  buildSessionResolution,
  processLocationError,
  processLocationSamples,
  waitForLocationProcessing,
} from '../services/driveEngine';
import { stopAlertOutputs } from '../services/notifications';
import {
  activateRuntimeSession,
  clearRuntimeSession,
} from '../services/runtimeSession';
import {
  beginTracking,
  isBackgroundTrackingRegistered,
  stopTracking,
  watchForeground,
} from '../services/tracking';
import {
  DEFAULT_SETTINGS,
  EMPTY_SNAPSHOT,
  beginDriveSession,
  endDriveSession,
  getDriveSession,
  getSettings,
  getSnapshot,
  resetDriveBuffers,
  saveSettings,
  saveSnapshot,
} from '../storage';
import type { DriveSettings, DriveSnapshot } from '../domain/types';

type CleanupResult = {
  locationStopFailed: boolean;
  stateCleanupFailed: boolean;
};

const quiesceDriveSession = async (): Promise<CleanupResult> => {
  let locationStopFailed = false;
  let stateCleanupFailed = false;
  clearRuntimeSession();
  await endDriveSession().catch(() => {
    stateCleanupFailed = true;
  });
  await stopTracking().catch(() => {
    locationStopFailed = true;
  });
  await waitForLocationProcessing().catch(() => {
    stateCleanupFailed = true;
  });
  await stopAlertOutputs().catch(() => {
    stateCleanupFailed = true;
  });
  await resetDriveBuffers().catch(() => {
    stateCleanupFailed = true;
  });
  return { locationStopFailed, stateCleanupFailed };
};

export const useDriveTelemetry = () => {
  const [settings, setSettingsState] = useState<DriveSettings>(DEFAULT_SETTINGS);
  const [snapshot, setSnapshot] = useState<DriveSnapshot>(EMPTY_SNAPSHOT);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [startBlocked, setStartBlocked] = useState(false);
  const foregroundSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    void Promise.all([
      getSettings(),
      getSnapshot(),
      getDriveSession(),
      isBackgroundTrackingRegistered().catch(() => null),
    ])
      .then(async ([storedSettings, storedSnapshot, storedSession, registered]) => {
        setSettingsState(storedSettings);
        const interrupted =
          storedSnapshot.active ||
          storedSnapshot.restartRequired === true ||
          storedSession !== null ||
          registered !== false;
        if (!interrupted) {
          await resetDriveBuffers();
          setSnapshot(storedSnapshot);
          return;
        }

        const cleanup = await quiesceDriveSession();
        const cleanupFailed = cleanup.locationStopFailed || cleanup.stateCleanupFailed;
        setStartBlocked(cleanupFailed);
        const recovered: DriveSnapshot = {
          ...EMPTY_SNAPSHOT,
          status: 'error',
          ...(cleanupFailed ? { restartRequired: true } : {}),
          message: cleanupFailed
            ? 'An interrupted location service could not be stopped. Revoke location permission and reopen the app.'
            : 'The previous drive ended when the app or device restarted. Confirm the current sign and start a new session while parked.',
        };
        await saveSnapshot(recovered);
        setSnapshot(recovered);
      })
      .catch(async (error: unknown) => {
        await quiesceDriveSession();
        setStartBlocked(true);
        const failed: DriveSnapshot = {
          ...EMPTY_SNAPSHOT,
          status: 'error',
          restartRequired: true,
          message: error instanceof Error ? error.message : 'Unable to restore app state.',
        };
        await saveSnapshot(failed).catch(() => undefined);
        setSnapshot(failed);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!snapshot.active) return;
    const timer = setInterval(() => {
      void getSnapshot()
        .then((stored) => {
          if (!stored.active) {
            if (stored.restartRequired) setStartBlocked(true);
            setSnapshot(stored);
            return;
          }
          const referenceAt = stored.lastFixAt ?? stored.resolution.observedAt;
          if (referenceAt > 0 && Date.now() - referenceAt > MAX_FIX_AGE_MS) {
            const staleMessage = 'GPS updates are delayed. Current speed is unknown and alerts are paused.';
            setSnapshot({
              ...stored,
              currentSpeedKmh: null,
              status: 'degraded',
              alertBand: 'safe',
              message: stored.sessionWarning
                ? `${stored.sessionWarning} ${staleMessage}`
                : staleMessage,
            });
            return;
          }
          setSnapshot(stored);
        })
        .catch(() => {
          setSnapshot((current) => ({
            ...current,
            currentSpeedKmh: null,
            status: 'error',
            alertBand: 'safe',
            message: 'Unable to read live session state. Stop and restart while parked.',
          }));
        });
    }, 1_000);
    return () => clearInterval(timer);
  }, [snapshot.active]);

  useEffect(
    () => () => {
      foregroundSubscription.current?.remove();
    },
    [],
  );

  const updateSettings = useCallback(async (next: DriveSettings) => {
    if (!hydrated) return;
    setSettingsState(next);
    await saveSettings(next);
  }, [hydrated]);

  const start = useCallback(async () => {
    if (!hydrated || startBlocked) return;
    setBusy(true);
    try {
      await resetDriveBuffers();
      const session = await beginDriveSession(settings);
      activateRuntimeSession(session.id);
      const starting: DriveSnapshot = {
        ...EMPTY_SNAPSHOT,
        active: true,
        status: 'starting',
        resolution: buildSessionResolution(settings, session.startedAt),
      };
      setSnapshot(starting);
      await saveSnapshot(starting);

      const result = await beginTracking(settings);
      if (result.mode === 'foreground') {
        foregroundSubscription.current = await watchForeground(
          async (sample) => {
            const next = await processLocationSamples([sample], true, session.id);
            setSnapshot(next);
          },
          async (message) => {
            foregroundSubscription.current?.remove();
            foregroundSubscription.current = null;
            await processLocationError(message, session.id, false);
            setSnapshot(await getSnapshot());
          },
        );
      }

      const active: DriveSnapshot = {
        ...starting,
        status: 'degraded',
        message: result.warning ?? 'Waiting for a current GPS speed.',
        ...(result.warning ? { sessionWarning: result.warning } : {}),
      };
      setSnapshot(active);
      await saveSnapshot(active);
    } catch (error) {
      foregroundSubscription.current?.remove();
      foregroundSubscription.current = null;
      const cleanup = await quiesceDriveSession();
      const cleanupFailed = cleanup.locationStopFailed || cleanup.stateCleanupFailed;
      if (cleanupFailed) setStartBlocked(true);
      const failed: DriveSnapshot = {
        ...EMPTY_SNAPSHOT,
        status: 'error',
        ...(cleanupFailed ? { restartRequired: true } : {}),
        message: cleanupFailed
          ? 'Drive start failed and location shutdown could not be confirmed. Revoke location permission and reopen the app.'
          : error instanceof Error
            ? error.message
            : 'Unable to start tracking.',
      };
      setSnapshot(failed);
      await saveSnapshot(failed).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }, [hydrated, settings, startBlocked]);

  const stop = useCallback(async () => {
    setBusy(true);
    foregroundSubscription.current?.remove();
    foregroundSubscription.current = null;
    const cleanup = await quiesceDriveSession();
    let stopFailed = cleanup.locationStopFailed || cleanup.stateCleanupFailed;
    await saveSnapshot(EMPTY_SNAPSHOT).catch(() => {
      stopFailed = true;
    });
    if (stopFailed) {
      setStartBlocked(true);
      const failed: DriveSnapshot = {
        ...EMPTY_SNAPSHOT,
        status: 'error',
        restartRequired: true,
        message: 'Location shutdown could not be confirmed. Revoke location permission and reopen the app before driving again.',
      };
      await saveSnapshot(failed).catch(() => undefined);
      setSnapshot(failed);
    } else {
      setSnapshot(EMPTY_SNAPSHOT);
    }
    setBusy(false);
  }, []);

  return {
    settings,
    snapshot,
    busy,
    ready: hydrated,
    startBlocked,
    updateSettings,
    start,
    stop,
  };
};
