import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Platform } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { usePushRegistration } from "../hooks/usePushRegistration";
import { I18nProvider, useI18n, useI18nBootstrap } from "../lib/i18n";
import { getAccessToken, getCurrentUserId } from "../lib/supabase";
import { useAvatar } from "../lib/useAvatar";
import { useDashboardData } from "../lib/useDashboardData";
import { useLogout } from "../lib/useLogout";
import { useNotifications } from "../lib/useNotifications";

const mockCore = {
  notifications: {
    fetchNotifications: jest.fn(),
    subscribeNotifications: jest.fn(),
    dismissNotification: jest.fn(),
    clearNotifications: jest.fn(),
    unregisterPushToken: jest.fn(),
    registerPushToken: jest.fn(),
  },
  account: { getUserProfile: jest.fn(), uploadAvatar: jest.fn(), removeAvatar: jest.fn() },
  growatt: {},
  weather: {},
};
const mockAuth = { session: null as null | { user: { id: string } }, signOut: jest.fn() };
const mockSession = jest.fn();
const mockDevice = { isDevice: true };
const mockPush = {
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
};

jest.mock("../lib/useCore", () => ({ useCore: () => mockCore }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "proj" } } } },
}));
jest.mock("expo-device", () => mockDevice);
jest.mock("expo-notifications", () => mockPush);
jest.mock("../lib/auth", () => ({ useAuth: () => mockAuth }));
jest.mock("../lib/supabase", () => ({
  supabase: { auth: { getSession: (...a: unknown[]) => mockSession(...a) } },
  getAccessToken: async () => (await mockSession()).data.session?.access_token ?? null,
  getCurrentUserId: async () => (await mockSession()).data.session?.user?.id ?? null,
}));
jest.mock("../services/pushNotifications", () => ({
  unregisterPushOnLogout: jest.fn(async (fn: () => Promise<void>) => fn()),
  storePushToken: jest.fn(),
}));
jest.mock("@hmi/core", () => ({
  ...jest.requireActual("@hmi/core"),
  dashboardQueries: () => ({
    solar: {
      queryKey: ["s"],
      queryFn: async () => ({
        metrics: { todayGeneration: 1, totalGeneration: 2 },
        chartData: { labels: ["a", "b", "c"], datasets: [{ data: [0, 2, 3] }] },
      }),
    },
    solarWeek: {
      queryKey: ["sw"],
      queryFn: async () => ({ metrics: { todayGeneration: 5, totalGeneration: 6 } }),
    },
    weatherCurrent: { queryKey: ["wc"], queryFn: async () => ({ observations: [] }) },
    weatherWeek: { queryKey: ["ww"], queryFn: async () => [] },
  }),
}));

let mounted: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => mounted.forEach((t) => t.unmount()));
  mounted = [];
  jest.clearAllMocks();
});

function renderHook<T>(hook: () => T, wrapper?: (c: React.ReactNode) => React.ReactElement) {
  const ref = { current: undefined as unknown as T };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  function Probe() {
    ref.current = hook();
    return null;
  }
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    const inner = <Probe />;
    tree = TestRenderer.create(
      <QueryClientProvider client={client}>{wrapper ? wrapper(inner) : inner}</QueryClientProvider>,
    );
  });
  mounted.push(tree);
  return { ref, client };
}

// Query resolution needs a few macrotasks; one tick is flaky when jest runs files in parallel.
const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 5));
  });

describe("useNotifications", () => {
  it("loads, subscribes and refetches after dismiss/clear", async () => {
    mockCore.notifications.fetchNotifications.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    const unsub = jest.fn();
    let onChange: () => void = () => {};
    mockCore.notifications.subscribeNotifications.mockImplementation((cb: () => void) => {
      onChange = cb;
      return unsub;
    });
    mockCore.notifications.dismissNotification.mockResolvedValue(undefined);
    mockCore.notifications.clearNotifications.mockResolvedValue(undefined);
    const { ref } = renderHook(useNotifications);
    expect(ref.current.items).toEqual([]);
    await flush();
    expect(ref.current.count).toBe(2);
    await act(async () => ref.current.dismiss("a"));
    expect(mockCore.notifications.dismissNotification).toHaveBeenCalledWith("a");
    await act(async () => ref.current.clearAll());
    expect(mockCore.notifications.clearNotifications).toHaveBeenCalled();
    const before = mockCore.notifications.fetchNotifications.mock.calls.length;
    await act(async () => onChange());
    expect(mockCore.notifications.fetchNotifications.mock.calls.length).toBeGreaterThan(before);
    act(() => mounted[0].unmount());
    mounted = [];
    expect(unsub).toHaveBeenCalled();
  });
});

describe("useLogout", () => {
  it("removes the push token and then signs out", async () => {
    mockCore.notifications.unregisterPushToken.mockResolvedValue(undefined);
    mockAuth.signOut.mockResolvedValue(undefined);
    const { ref } = renderHook(useLogout);
    await act(async () => ref.current());
    expect(mockCore.notifications.unregisterPushToken).toHaveBeenCalled();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });
});

describe("useAvatar", () => {
  it("exposes the profile avatar and updates the cache on upload/remove", async () => {
    mockCore.account.getUserProfile.mockResolvedValue({ avatarUrl: "https://x/y.png" });
    mockCore.account.uploadAvatar.mockResolvedValue({ avatarUrl: "https://x/new.png" });
    mockCore.account.removeAvatar.mockResolvedValue({ avatarUrl: null });
    const { ref, client } = renderHook(useAvatar);
    expect(ref.current.uri).toBeNull();
    await flush();
    expect(ref.current.uri).toBe("https://x/y.png");
    await act(async () =>
      ref.current.setAvatar({
        data: new Uint8Array(1),
        contentType: "image/png",
        extension: "png",
      }),
    );
    expect(mockCore.account.uploadAvatar).toHaveBeenCalled();
    await act(async () => ref.current.removeAvatar());
    expect(mockCore.account.removeAvatar).toHaveBeenCalled();
    expect(client.getQueryData(["profile"])).toBeDefined();
  });
});

describe("useDashboardData", () => {
  it("derives the sparkline and current power from today's solar series", async () => {
    const { ref } = renderHook(useDashboardData);
    await flush();
    await flush();
    expect(ref.current.sparkline).toEqual([0, 2, 3]);
    expect(ref.current.currentPower).toBe(3);
  });
});

describe("i18n", () => {
  it("bootstraps the stored locale, defaulting to English", async () => {
    await AsyncStorage.setItem("pref.language", "nb");
    const { ref } = renderHook(useI18nBootstrap);
    expect(ref.current.ready).toBe(false);
    await flush();
    expect(ref.current).toEqual({ locale: "nb", ready: true });
    await AsyncStorage.setItem("pref.language", "xx");
    const again = renderHook(useI18nBootstrap);
    await flush();
    expect(again.ref.current.locale).toBe("en");
  });

  it("switches locale, persists it and translates", async () => {
    const { ref } = renderHook(useI18n, (c) => <I18nProvider locale="en">{c}</I18nProvider>);
    const english = ref.current.t("common.cancel");
    act(() => ref.current.setLocale("nb"));
    expect(ref.current.locale).toBe("nb");
    expect(ref.current.t("common.cancel")).not.toBe(english);
    expect(await AsyncStorage.getItem("pref.language")).toBe("nb");
    expect(typeof ref.current.tp("notifications.count", 2)).toBe("string");
  });
});

describe("supabase helpers", () => {
  it("returns the token and user id, or null when signed out", async () => {
    mockSession.mockResolvedValue({ data: { session: { access_token: "t", user: { id: "u" } } } });
    expect(await getAccessToken()).toBe("t");
    expect(await getCurrentUserId()).toBe("u");
    mockSession.mockResolvedValue({ data: { session: null } });
    expect(await getAccessToken()).toBeNull();
    expect(await getCurrentUserId()).toBeNull();
  });
});

describe("usePushRegistration", () => {
  const push = mockPush;
  const device = mockDevice;

  beforeEach(() => {
    mockAuth.session = { user: { id: "u1" } };
    device.isDevice = true;
    push.getPermissionsAsync.mockResolvedValue({ status: "granted" });
    push.getExpoPushTokenAsync.mockResolvedValue({ data: "ExpoPushToken[x]" });
    mockCore.notifications.registerPushToken.mockResolvedValue(undefined);
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("registers the token on a physical device with permission", async () => {
    renderHook(usePushRegistration);
    await flush();
    expect(mockCore.notifications.registerPushToken).toHaveBeenCalledWith("ExpoPushToken[x]");
  });

  it("asks for permission when not yet granted and stops when denied", async () => {
    push.getPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    push.requestPermissionsAsync.mockResolvedValue({ status: "denied" });
    renderHook(usePushRegistration);
    await flush();
    expect(push.requestPermissionsAsync).toHaveBeenCalled();
    expect(mockCore.notifications.registerPushToken).not.toHaveBeenCalled();
  });

  it("skips simulators and signed-out users", async () => {
    device.isDevice = false;
    renderHook(usePushRegistration);
    await flush();
    mockAuth.session = null;
    device.isDevice = true;
    renderHook(usePushRegistration);
    await flush();
    expect(mockCore.notifications.registerPushToken).not.toHaveBeenCalled();
  });

  it("swallows registration failures", async () => {
    push.getExpoPushTokenAsync.mockRejectedValue(new Error("boom"));
    renderHook(usePushRegistration);
    await flush();
    expect(mockCore.notifications.registerPushToken).not.toHaveBeenCalled();
  });

  it("skips web entirely", async () => {
    const original = Platform.OS;
    Platform.OS = "web";
    renderHook(usePushRegistration);
    await flush();
    Platform.OS = original;
    expect(push.getPermissionsAsync).not.toHaveBeenCalled();
  });
});
