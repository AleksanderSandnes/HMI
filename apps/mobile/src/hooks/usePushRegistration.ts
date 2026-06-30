import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "../lib/auth";
import { useCore } from "../lib/useCore";
import { storePushToken } from "../services/pushNotifications";

interface NotificationsModule {
  setNotificationHandler(config: unknown): void;
  setNotificationChannelAsync(id: string, config: unknown): Promise<unknown>;
  getPermissionsAsync(): Promise<{ status: string }>;
  requestPermissionsAsync(): Promise<{ status: string }>;
  getExpoPushTokenAsync(opts: { projectId: string }): Promise<{ data?: string }>;
  AndroidImportance: { DEFAULT: number };
}

async function configureForeground(notifications: NotificationsModule): Promise<void> {
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  if (Platform.OS === "android") {
    await notifications.setNotificationChannelAsync("default", {
      name: "Data sync",
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function ensurePermission(notifications: NotificationsModule): Promise<boolean> {
  const existing = await notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  const requested = await notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

function resolveProjectId(): string | undefined {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    (Constants as { easConfig?: { projectId?: string } })?.easConfig?.projectId
  );
}

/**
 * Registers this device's Expo push token with the backend (profiles.expo_push_tokens)
 * so the cron jobs can deliver push notifications (mobile/tablet). Web is excluded — it
 * uses the in-app notification center instead.
 *
 * Defensive by design: it silently no-ops on web, on simulators/emulators, when permission
 * is denied, or when no EAS `projectId` is configured.
 */
export function usePushRegistration(): void {
  const { session } = useAuth();
  const { notifications } = useCore();
  const userId = session?.user?.id;

  useEffect(() => {
    if (Platform.OS === "web" || !userId) return;
    let cancelled = false;

    void (async () => {
      try {
        const Device = require("expo-device");
        const push = require("expo-notifications") as NotificationsModule;
        if (!Device.isDevice) {
          console.warn("[Push] Skipped: push requires a physical device.");
          return;
        }
        await configureForeground(push);
        if (!(await ensurePermission(push))) {
          console.warn("[Push] Notification permission not granted.");
          return;
        }
        const projectId = resolveProjectId();
        if (!projectId) {
          console.warn("[Push] No EAS projectId configured — skipping push token registration.");
          return;
        }
        const { data: token } = await push.getExpoPushTokenAsync({ projectId });
        if (token && !cancelled) {
          await notifications.registerPushToken(token);
          await storePushToken(token);
          console.warn("[Push] Expo push token registered with backend.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("[Push] Registration failed:", message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, notifications]);
}

export default usePushRegistration;
