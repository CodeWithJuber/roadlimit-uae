import { Platform } from 'react-native';

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';

import type { AlertEvent, DriveSettings } from '../domain/types';

export const DRIVE_ALERTS_CHANNEL_ID = 'drive-alerts';

const isAndroidChannelUsable = (
  channel: Notifications.NotificationChannel | null,
): boolean =>
  Boolean(
    channel && channel.importance >= Notifications.AndroidImportance.DEFAULT,
  );

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const configureAlerts = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DRIVE_ALERTS_CHANNEL_ID, {
      name: 'Driving speed alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 250],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted
    ? true
    : (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(
      DRIVE_ALERTS_CHANNEL_ID,
    );
    if (!isAndroidChannelUsable(channel)) {
      return false;
    }
  }

  return true;
};

type DeliverOptions = {
  allowSpeech: boolean;
};

export type AlertDeliveryResult = {
  notificationDelivered: boolean;
  hapticDelivered: boolean;
  speechStarted: boolean;
};

const canDeliverNotification = async (): Promise<boolean> => {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  if (Platform.OS !== 'android') return true;
  const channel = await Notifications.getNotificationChannelAsync(
    DRIVE_ALERTS_CHANNEL_ID,
  );
  return isAndroidChannelUsable(channel);
};

export const deliverAlert = async (
  event: AlertEvent,
  settings: DriveSettings,
  options: DeliverOptions,
): Promise<AlertDeliveryResult> => {
  const result: AlertDeliveryResult = {
    notificationDelivered: false,
    hapticDelivered: false,
    speechStarted: false,
  };

  if (settings.notificationsEnabled) {
    try {
      if (await canDeliverNotification()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: event.title,
            body: event.body,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { severity: event.severity, source: 'roadlimit-uae' },
          },
          trigger: { channelId: DRIVE_ALERTS_CHANNEL_ID },
        });
        result.notificationDelivered = true;
      }
    } catch {
      result.notificationDelivered = false;
    }
  }

  if (settings.hapticsEnabled) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      result.hapticDelivered = true;
    } catch {
      result.hapticDelivered = false;
    }
  }

  if (settings.voiceEnabled && options.allowSpeech) {
    try {
      await Speech.stop();
      Speech.speak(event.speak, { rate: 0.95, pitch: 1.0 });
      result.speechStarted = true;
    } catch {
      result.speechStarted = false;
    }
  }

  return result;
};

export const deliverTrackingStoppedNotice = async (): Promise<boolean> => {
  try {
    if (!(await canDeliverNotification())) return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'RoadLimit tracking stopped',
        body: 'Location updates failed. Reopen the app and confirm the current sign before starting again.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { severity: 'system-error', source: 'roadlimit-uae' },
      },
      trigger: { channelId: DRIVE_ALERTS_CHANNEL_ID },
    });
    return true;
  } catch {
    return false;
  }
};

export const stopAlertOutputs = async (): Promise<void> => {
  await Speech.stop().catch(() => undefined);
  await Notifications.dismissAllNotificationsAsync().catch(() => undefined);
};
