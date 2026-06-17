import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import {
  clearNotifications as apiClear,
  dismissNotification as apiDismiss,
  fetchNotifications,
  NotificationItem,
} from '../services/notificationsApiService';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  count: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  count: 0,
  loading: false,
  error: null,
  refresh: async () => {},
  dismiss: async () => {},
  clearAll: async () => {},
});

// How often to poll the notification center while it's open (web).
const POLL_INTERVAL_MS = 60_000;

/**
 * Provides the notification list + unread count to the web notification center and the
 * sidebar badge. Polling is web-only — native devices receive push notifications instead,
 * so the provider stays inert there (no network chatter).
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const user = useSelector((state: any) => state?.auth?.user);
  const isWeb = Platform.OS === 'web';
  const enabled = isWeb && Boolean(user?.token);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const items = await fetchNotifications();
      setNotifications(items);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [enabled]);

  const dismiss = useCallback(
    async (id: string) => {
      // Optimistic removal — restore on failure.
      const previous = notifications;
      setNotifications((curr) => curr.filter((n) => n.id !== id));
      try {
        await apiDismiss(id);
      } catch (err: any) {
        setNotifications(previous);
        setError(err?.message || 'Failed to dismiss notification');
      }
    },
    [notifications]
  );

  const clearAll = useCallback(async () => {
    const previous = notifications;
    setNotifications([]);
    try {
      await apiClear();
    } catch (err: any) {
      setNotifications(previous);
      setError(err?.message || 'Failed to clear notifications');
    }
  }, [notifications]);

  // Initial load + reset when auth changes.
  useEffect(() => {
    if (enabled) {
      refresh();
    } else {
      setNotifications([]);
      setError(null);
    }
  }, [enabled, refresh]);

  // Background polling while enabled.
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  // Refresh when the web tab/app regains focus.
  useEffect(() => {
    if (!enabled) return undefined;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [enabled, refresh]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        count: notifications.length,
        loading,
        error,
        refresh,
        dismiss,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext);
}

export default NotificationsContext;
