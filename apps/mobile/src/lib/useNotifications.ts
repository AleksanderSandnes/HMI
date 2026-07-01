import { type NotificationItem } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { useCore } from "./useCore";

/**
 * Shared notifications state — the list, live subscription, and mutations. Used
 * by both the Dashboard bell badge and the notifications overlay so they share a
 * single React-Query cache (one fetch, one realtime subscription).
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

export default useNotifications;
