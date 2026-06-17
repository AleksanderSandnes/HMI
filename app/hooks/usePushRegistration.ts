import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSelector } from 'react-redux';

import { registerPushToken } from '../services/notificationsApiService';
import { storePushToken } from '../services/pushNotifications';

/**
 * Registers this device's Expo push token with the backend so the nightly cron jobs can
 * deliver push notifications (mobile/tablet). Web is excluded — it uses the in-app
 * notification center instead.
 *
 * Defensive by design: it silently no-ops on web, on simulators/emulators, when permission
 * is denied, or when no EAS `projectId` is configured yet. Real push delivery requires an
 * EAS projectId (run `eas init`) and a development/standalone build on a physical device.
 */
export function usePushRegistration(): void {
  const user = useSelector((state: any) => state?.auth?.user);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!user?.token) return;

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
            shouldShowAlert: true,
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
            '[Push] No EAS projectId configured — skipping push token registration. ' +
              'Run `eas init` and rebuild to enable push notifications.'
          );
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResponse?.data;
        if (token && !cancelled) {
          await registerPushToken(token);
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
  }, [user?.token]);
}

export default usePushRegistration;
