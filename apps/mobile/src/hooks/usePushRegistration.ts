import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../lib/auth';
import { useCore } from '../lib/useCore';
import { storePushToken } from '../services/pushNotifications';

/**
 * Registers this device's Expo push token with the backend (profiles.expo_push_tokens)
 * so the cron jobs can deliver push notifications (mobile/tablet). Web is excluded — it
 * uses the in-app notification center instead.
 *
 * Defensive by design: it silently no-ops on web, on simulators/emulators, when permission
 * is denied, or when no EAS `projectId` is configured. Real push delivery requires an EAS
 * projectId and a dev/standalone build on a physical device.
 */
export function usePushRegistration(): void {
  const { session } = useAuth();
  const { notifications } = useCore();
  const userId = session?.user?.id;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const Device = require('expo-device');
        const Notifications = require('expo-notifications');

        if (!Device.isDevice) {
          console.log('[Push] Skipped: push requires a physical device.');
          return;
        }

        // Foreground display behaviour.
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Data sync',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (status !== 'granted') {
          console.log('[Push] Notification permission not granted.');
          return;
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          (Constants as any)?.easConfig?.projectId;
        if (!projectId) {
          console.warn(
            '[Push] No EAS projectId configured — skipping push token registration.',
          );
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResponse?.data;
        if (token && !cancelled) {
          await notifications.registerPushToken(token);
          await storePushToken(token);
          console.log('[Push] Expo push token registered with backend.');
        }
      } catch (error: any) {
        console.warn('[Push] Registration failed:', error?.message || error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, notifications]);
}

export default usePushRegistration;
