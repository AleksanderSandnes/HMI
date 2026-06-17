/**
 * Notifications API Service
 * Talks to the Node weatherAPI `/api/notifications` endpoints (auth-gated).
 */

import { getDataMode } from './dataConfig';

export type NotificationLevel = 'success' | 'error' | 'info' | 'warning';
export type NotificationType = 'weather_sync' | 'solar_sync' | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  level: NotificationLevel;
  title: string;
  message: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

function getApiBaseUrl(): string {
  const dataMode = getDataMode();
  if (dataMode === 'production') {
    return (
      process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION ||
      'https://weatherapi-sbwb.onrender.com'
    );
  }
  return (
    process.env.EXPO_PUBLIC_WEATHER_API_DEVELOPMENT || 'http://localhost:5000'
  );
}

async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) return JSON.parse(userInfo).token || null;
    } else {
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) return JSON.parse(userInfo).token || null;
    }
    return null;
  } catch (error) {
    console.error('[NotificationsAPI] Error getting auth token:', error);
    return null;
  }
}

async function authedRequest(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown
): Promise<any> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/notifications${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    let detail = `${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data?.error || data?.message) detail = data.error || data.message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

/** Fetch all notifications for the current user (newest first). */
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const data = await authedRequest('/', 'GET');
  return Array.isArray(data?.notifications) ? data.notifications : [];
}

/** Fetch just the unread (= total) count. */
export async function fetchNotificationCount(): Promise<number> {
  const data = await authedRequest('/count', 'GET');
  return typeof data?.count === 'number' ? data.count : 0;
}

/** Mark one notification as read (hard delete on the server). */
export async function dismissNotification(id: string): Promise<void> {
  await authedRequest(`/${id}`, 'DELETE');
}

/** Mark all notifications as read (clear) for the current user. */
export async function clearNotifications(): Promise<void> {
  await authedRequest('/clear', 'DELETE');
}

/** Register an Expo push token for this device. */
export async function registerPushToken(token: string): Promise<void> {
  await authedRequest('/push-token', 'POST', { token });
}

/** Remove an Expo push token (e.g. on logout). */
export async function unregisterPushToken(token: string): Promise<void> {
  await authedRequest('/push-token', 'DELETE', { token });
}
