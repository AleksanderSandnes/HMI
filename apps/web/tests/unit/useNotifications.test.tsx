import type { NotificationItem } from "@hmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotifications } from "@/lib/hooks/useNotifications";

const notifications = vi.hoisted(() => ({
  fetchNotifications: vi.fn(),
  subscribeNotifications: vi.fn(),
  dismissNotification: vi.fn(),
  clearNotifications: vi.fn(),
}));
vi.mock("@/lib/hooks/useCore", () => ({ useCore: () => ({ notifications }) }));

const item: NotificationItem = {
  id: "fixture",
  type: "system",
  level: "info",
  title: "Demo",
  message: "Fictional notification",
  createdAt: "2026-09-30",
};
let client: QueryClient;
let onChange: () => void;
const unsubscribe = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  notifications.fetchNotifications.mockResolvedValue([]);
  notifications.dismissNotification.mockResolvedValue(undefined);
  notifications.clearNotifications.mockResolvedValue(undefined);
  notifications.subscribeNotifications.mockImplementation((callback: () => void) => {
    onChange = callback;
    return unsubscribe;
  });
});

afterEach(() => {
  cleanup();
  client.clear();
});

describe("notification query lifecycle", () => {
  it("shares query data across consumers and removes each realtime listener on unmount", async () => {
    notifications.fetchNotifications.mockResolvedValue([item]);
    const first = renderHook(useNotifications, { wrapper });
    await waitFor(() => expect(first.result.current.count).toBe(1));
    const second = renderHook(useNotifications, { wrapper });
    expect(second.result.current.items).toEqual([item]);
    first.unmount();
    second.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it("starts empty and refreshes the shared cache on a realtime change", async () => {
    const { result } = renderHook(useNotifications, { wrapper });
    expect(result.current.items).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    notifications.fetchNotifications.mockResolvedValue([item]);
    act(() => onChange());
    await waitFor(() => expect(result.current.count).toBe(1));
  });

  it("refreshes after successful dismiss and clear operations", async () => {
    notifications.fetchNotifications.mockResolvedValue([item]);
    const { result } = renderHook(useNotifications, { wrapper });
    await waitFor(() => expect(result.current.count).toBe(1));
    notifications.fetchNotifications.mockResolvedValue([]);
    await act(async () => {
      await result.current.dismiss(item.id);
    });
    await waitFor(() => expect(result.current.count).toBe(0));
    expect(notifications.dismissNotification).toHaveBeenCalledWith(item.id);
    await act(async () => {
      await result.current.clearAll();
    });
    expect(notifications.clearNotifications).toHaveBeenCalledOnce();
  });

  it("preserves cached notifications when a mutation fails", async () => {
    notifications.fetchNotifications.mockResolvedValue([item]);
    const { result } = renderHook(useNotifications, { wrapper });
    await waitFor(() => expect(result.current.count).toBe(1));
    notifications.dismissNotification.mockRejectedValue(new Error("delete denied"));
    notifications.clearNotifications.mockRejectedValue(new Error("clear denied"));
    await expect(result.current.dismiss(item.id)).rejects.toThrow("delete denied");
    await expect(result.current.clearAll()).rejects.toThrow("clear denied");
    expect(result.current.items).toEqual([item]);
    expect(notifications.fetchNotifications).toHaveBeenCalledOnce();
  });
});
