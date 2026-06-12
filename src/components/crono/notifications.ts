import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminder(task: Pick<Task, 'title' | 'dueAt' | 'recurrence'>) {
  if (!task.dueAt) {
    return undefined;
  }

  const dueDate = new Date(task.dueAt);
  const seconds = Math.max(1, Math.round((dueDate.getTime() - Date.now()) / 1000));
  const repeatSeconds = {
    none: seconds,
    daily: 24 * 60 * 60,
    weekly: 7 * 24 * 60 * 60,
    monthly: 30 * 24 * 60 * 60,
  }[task.recurrence];

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    return undefined;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Crono',
      body: task.title,
      data: { dueAt: task.dueAt },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: repeatSeconds,
      repeats: task.recurrence !== 'none',
      channelId: 'reminders',
    },
  });
}

export async function cancelReminder(notificationId: string | undefined) {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}
