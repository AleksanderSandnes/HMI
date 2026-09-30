import { describe, expect, it, vi } from "vitest";

import type { CoreApiContext } from "../api/context";
import { createNotificationsApi } from "../api/notifications";

function fixture(uid: string | null = "fixture-user") {
  const order = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({ data: null });
  const select = vi.fn().mockReturnValue({ order, eq: vi.fn().mockReturnValue({ single }) });
  const update = vi.fn().mockReturnValue({ eq });
  const remove = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select, update, delete: remove });
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  const removeChannel = vi.fn().mockResolvedValue("ok");
  const api = createNotificationsApi({
    supabase: { from, channel: vi.fn().mockReturnValue(channel), removeChannel },
    getCurrentUserId: vi.fn().mockResolvedValue(uid),
  } as unknown as CoreApiContext);
  return { api, from, select, order, eq, single, update, channel, removeChannel };
}

describe("notification lifecycle", () => {
  it("maps empty and populated notification lists including optional fields", async () => {
    const { api, order } = fixture();
    await expect(api.fetchNotifications()).resolves.toEqual([]);
    order.mockResolvedValueOnce({
      data: [
        { id: "one", type: "weather", level: "info", title: "Forecast", created_at: "2026-09-30" },
        {
          id: "two",
          type: "solar",
          level: "info",
          title: "Generation",
          message: "Ready",
          meta: { plant: "fixture" },
          created_at: "2026-09-29",
        },
      ],
      error: null,
    });
    await expect(api.fetchNotifications()).resolves.toEqual([
      {
        id: "one",
        type: "weather",
        level: "info",
        title: "Forecast",
        message: "",
        meta: null,
        createdAt: "2026-09-30",
      },
      {
        id: "two",
        type: "solar",
        level: "info",
        title: "Generation",
        message: "Ready",
        meta: { plant: "fixture" },
        createdAt: "2026-09-29",
      },
    ]);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    order.mockResolvedValueOnce({ error: { message: "read denied" } });
    await expect(api.fetchNotifications()).rejects.toThrow("read denied");
  });

  it("returns exact counts and reports read errors", async () => {
    const { api, select } = fixture();
    select
      .mockResolvedValueOnce({ count: 7 })
      .mockResolvedValueOnce({ count: null })
      .mockResolvedValueOnce({ error: { message: "offline" } });
    await expect(api.fetchNotificationCount()).resolves.toBe(7);
    await expect(api.fetchNotificationCount()).resolves.toBe(0);
    await expect(api.fetchNotificationCount()).rejects.toThrow("offline");
    expect(select).toHaveBeenCalledWith("*", { count: "exact", head: true });
  });

  it("scopes clearing to the current user and surfaces delete failures", async () => {
    const { api, eq } = fixture();
    await api.dismissNotification("fixture-notification");
    expect(eq).toHaveBeenLastCalledWith("id", "fixture-notification");
    await api.clearNotifications();
    expect(eq).toHaveBeenLastCalledWith("auth_id", "fixture-user");
    eq.mockResolvedValue({ error: { message: "delete denied" } });
    await expect(api.dismissNotification("fixture-notification")).rejects.toThrow("delete denied");
    await expect(api.clearNotifications()).rejects.toThrow("delete denied");
  });

  it("does not modify notifications or tokens while signed out", async () => {
    const { api, from } = fixture(null);
    await api.clearNotifications();
    await api.registerPushToken("fixture-token");
    await api.unregisterPushToken("fixture-token");
    expect(from).not.toHaveBeenCalled();
  });
});

describe("notification device registration and synchronization", () => {
  it("preserves other devices, deduplicates registration, and removes only the selected token", async () => {
    const { api, single, update, eq } = fixture();
    single.mockResolvedValueOnce({ data: { expo_push_tokens: ["other-device", "this-device"] } });
    await api.registerPushToken("this-device");
    expect(update).toHaveBeenLastCalledWith({ expo_push_tokens: ["other-device", "this-device"] });
    single.mockResolvedValueOnce({ data: { expo_push_tokens: ["other-device", "this-device"] } });
    await api.unregisterPushToken("this-device");
    expect(update).toHaveBeenLastCalledWith({ expo_push_tokens: ["other-device"] });
    await api.registerPushToken("new-device");
    expect(update).toHaveBeenLastCalledWith({ expo_push_tokens: ["new-device"] });
    await api.unregisterPushToken("new-device");
    expect(update).toHaveBeenLastCalledWith({ expo_push_tokens: [] });
    expect(eq).toHaveBeenLastCalledWith("auth_id", "fixture-user");
  });

  it("notifies on realtime changes and cleans up the channel", () => {
    const { api, channel, removeChannel } = fixture();
    const onChange = vi.fn();
    const cleanup = api.subscribeNotifications(onChange);
    channel.on.mock.calls[0][2]();
    expect(onChange).toHaveBeenCalledOnce();
    cleanup();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
