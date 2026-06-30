// Notifications API — reads/writes the Supabase `notifications` table (RLS-scoped)
// with a Realtime subscription. Ported from mobile src/services/notificationsApiService.ts.
import type { NotificationItem } from "../types/notifications";

import type { CoreApiContext } from "./context";

function toItem(row: Record<string, any>): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    level: row.level,
    title: row.title,
    message: row.message ?? "",
    meta: row.meta ?? null,
    createdAt: row.created_at,
  };
}

export function createNotificationsApi(ctx: CoreApiContext) {
  const { supabase, getCurrentUserId } = ctx;

  /** Fetch all notifications for the current user (newest first). */
  async function fetchNotifications(): Promise<NotificationItem[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toItem);
  }

  /** Fetch the unread (= total) count. */
  async function fetchNotificationCount(): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /** Mark one notification as read (hard delete). */
  async function dismissNotification(id: string): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Clear all notifications for the current user. */
  async function clearNotifications(): Promise<void> {
    const uid = await getCurrentUserId();
    if (!uid) return;
    const { error } = await supabase.from("notifications").delete().eq("auth_id", uid);
    if (error) throw new Error(error.message);
  }

  /**
   * Subscribe to live notification changes for the current user. Calls `onChange`
   * on any insert/delete. Returns an unsubscribe function.
   */
  function subscribeNotifications(onChange: () => void): () => void {
    const channel = supabase
      .channel("notifications-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
        onChange(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }

  /** Register a push token on profiles.expo_push_tokens (mobile). */
  async function registerPushToken(token: string): Promise<void> {
    const uid = await getCurrentUserId();
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("expo_push_tokens")
      .eq("auth_id", uid)
      .single();
    const tokens = new Set<string>(data?.expo_push_tokens ?? []);
    tokens.add(token);
    await supabase
      .from("profiles")
      .update({ expo_push_tokens: [...tokens] })
      .eq("auth_id", uid);
  }

  async function unregisterPushToken(token: string): Promise<void> {
    const uid = await getCurrentUserId();
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("expo_push_tokens")
      .eq("auth_id", uid)
      .single();
    const tokens = (data?.expo_push_tokens ?? []).filter((t: string) => t !== token);
    await supabase.from("profiles").update({ expo_push_tokens: tokens }).eq("auth_id", uid);
  }

  return {
    fetchNotifications,
    fetchNotificationCount,
    dismissNotification,
    clearNotifications,
    subscribeNotifications,
    registerPushToken,
    unregisterPushToken,
  };
}

export type NotificationsApi = ReturnType<typeof createNotificationsApi>;
