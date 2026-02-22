import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function initNativePushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== 'granted') {
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    try {
      await fetch(`${API_BASE}/api/push/register-native`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token: token.value,
          platform: Capacitor.getPlatform()
        })
      });
    } catch (err) {
      console.error('Failed to register push token:', err);
    }
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received in foreground:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data;
    if (data?.type === 'memory') {
      window.location.href = '/';
    } else if (data?.type === 'friend_request') {
      window.location.href = '/';
    } else if (data?.entryId) {
      window.location.href = `/entry/${data.entryId}`;
    }
  });
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativePlatform(): string {
  return Capacitor.getPlatform();
}
