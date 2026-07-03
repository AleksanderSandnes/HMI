"use client";

import { type NotificationItem } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { useCore } from "./useCore";

/**
 * Shared notifications state — the list, live subscription, and mutations.
 * Used by the notifications page, the dashboard bell badge, and the overlay
 * so they share one React-Query cache entry and one realtime subscription.
 * (Web port of mobile src/lib/useNotifications.ts.)
 */
export function useNotifications() {
  const { notifications } = useCore();

  const { data, refetch, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => notifications.fetchNotifications(),
  });

  useEffect(() => {
    const unsub = notifications.subscribeNotifications(() => void refetch());
    return unsub;
  }, [notifications, refetch]);

  const dismiss = useCallback(
    async (id: string) => {
      await notifications.dismissNotification(id);
      void refetch();
    },
    [notifications, refetch],
  );

  const clearAll = useCallback(async () => {
    await notifications.clearNotifications();
    void refetch();
  }, [notifications, refetch]);

  const items = data ?? [];
  return { items, count: items.length, isLoading, dismiss, clearAll };
}
