// Notification shapes (ported from mobile notificationsApiService.ts).

export type NotificationLevel = "success" | "error" | "info" | "warning";
export type NotificationType = "weather_sync" | "solar_sync" | "system";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  level: NotificationLevel;
  title: string;
  message: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}
