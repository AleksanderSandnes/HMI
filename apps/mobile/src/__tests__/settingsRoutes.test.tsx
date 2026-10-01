import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import SettingsLayout from "../../app/(tabs)/settings/_layout";
import DeleteAccountScreen from "../../app/(tabs)/settings/delete";
import GrowattScreen from "../../app/(tabs)/settings/growatt";
import SettingsHub from "../../app/(tabs)/settings/index";
import PasswordScreen from "../../app/(tabs)/settings/password";
import ProfileScreen from "../../app/(tabs)/settings/profile";
import WeatherCredentialsScreen from "../../app/(tabs)/settings/weather";
import Weather from "../../app/(tabs)/weather";

const mockRouter = { replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn(), back: jest.fn() };
const mockPath = { current: "/settings" };
const mockLayout = { splitSettings: false, isLandscape: false, isPhoneLandscape: false };
const mockWindow = { width: 400 };
const mockCore = {
  settings: { getApiSettings: jest.fn() },
  account: { getUserProfile: jest.fn(), deleteAccount: jest.fn(), updateUserPassword: jest.fn() },
  weather: { getHourlyWeatherData: jest.fn(), getWeeklyHourlyWeatherData: jest.fn() },
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPath.current,
  Stack: () => "stack",
  Redirect: ({ href }: { href: string }) => `redirect:${href}`,
}));
jest.mock("../lib/useCore", () => ({ useCore: () => mockCore }));
jest.mock("../lib/useLayoutMode", () => ({ useLayoutMode: () => mockLayout }));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../components/charts", () => ({
  WeatherChart: (p: { band?: unknown; unit: string }) =>
    `wx:${p.band ? "band" : "series"}:${p.unit}`,
}));
jest.mock("../components/settings/SettingsHubList", () => ({
  SettingsHubList: (p: { onSelect: (r: string) => void; activeRoute?: string }) => {
    const { Pressable } = require("react-native");
    return (
      <Pressable
        accessibilityLabel={`hub:${p.activeRoute ?? "none"}`}
        onPress={() => p.onSelect("growatt")}
      />
    );
  },
}));

let mounted: TestRenderer.ReactTestRenderer[] = [];
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  Object.assign(mockLayout, { splitSettings: false, isLandscape: false, isPhoneLandscape: false });
  mockWindow.width = 400;
  mockPath.current = "/settings";
  mockCore.settings.getApiSettings.mockResolvedValue({
    growatt: { email: "g@x.y", configured: true },
    weather: { stationId: "ST1", configured: true },
  });
  mockCore.account.getUserProfile.mockResolvedValue({ username: "Ada", email: "ada@example.com" });
  mockCore.weather.getHourlyWeatherData.mockResolvedValue({
    observations: [{ obsTimeLocal: "2026-09-30 10:00:00", metric: { temp: 5 } }],
  });
  mockCore.weather.getWeeklyHourlyWeatherData.mockResolvedValue({ observations: [] });
});
afterEach(() => {
  act(() => {
    mounted.forEach((t) => t.unmount());
  });
  mounted = [];
  client.clear();
  jest.clearAllMocks();
});

function mount(ui: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  });
  mounted.push(tree);
  return tree;
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 5));
  });
const json = (t: TestRenderer.ReactTestRenderer) => JSON.stringify(t.toJSON());
const texts = (t: TestRenderer.ReactTestRenderer) =>
  t.root
    .findAll((n) => String(n.type) === "Text")
    .flatMap((n) => [n.props.children as unknown])
    .flat(3)
    .map(String);

describe("settings sub-screens", () => {
  it("renders the profile form once the profile loads", async () => {
    const tree = mount(<ProfileScreen />);
    expect(texts(tree)).toContain("Loading…");
    await flush();
    expect(tree.root.findAll((n) => n.props.label === "Save profile").length).toBeGreaterThan(0);
  });

  it("renders the Growatt and weather credential forms from shared settings", async () => {
    const growatt = mount(<GrowattScreen />);
    const weather = mount(<WeatherCredentialsScreen />);
    await flush();
    expect(
      growatt.root.findAll((n) => n.props.label === "Save credentials").length,
    ).toBeGreaterThan(0);
    expect(weather.root.findAll((n) => n.props.value === "ST1").length).toBeGreaterThan(0);
  });

  it("renders the password and delete-account screens", () => {
    const pw = mount(<PasswordScreen />);
    expect(pw.root.findAll((n) => n.props.label === "Update password").length).toBeGreaterThan(0);
    const del = mount(<DeleteAccountScreen />);
    expect(del.root.findAll((n) => n.props.label === "Delete account").length).toBeGreaterThan(0);
  });
});

describe("Settings hub route", () => {
  it("pushes the chosen sub-screen on phones", () => {
    const tree = mount(<SettingsHub />);
    act(() => {
      tree.root.findAll((n) => typeof n.props.onPress === "function")[0].props.onPress();
    });
    expect(mockRouter.push).toHaveBeenCalledWith("/settings/growatt");
  });

  it("redirects to the profile pane in split layout", () => {
    mockLayout.splitSettings = true;
    expect(json(mount(<SettingsHub />))).toContain("redirect:/settings/profile");
  });
});

describe("Settings layout", () => {
  it("is just the stack on phones", () => {
    expect(json(mount(<SettingsLayout />))).toContain("stack");
  });

  it("shows the list beside the stack and replaces on selection in split layout", () => {
    mockLayout.splitSettings = true;
    mockPath.current = "/settings/profile";
    const tree = mount(<SettingsLayout />);
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === "hub:profile")).not.toHaveLength(
      0,
    );
    act(() => {
      tree.root.findAll((n) => n.props.accessibilityLabel === "hub:profile")[0].props.onPress();
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/settings/growatt");
  });

  it("resets to the hub when leaving split mode on a sub-route", () => {
    mockLayout.splitSettings = true;
    mockPath.current = "/settings/profile";
    const ui = (
      <QueryClientProvider client={client}>
        <SettingsLayout />
      </QueryClientProvider>
    );
    const tree = mount(<SettingsLayout />);
    mockLayout.splitSettings = false;
    act(() => {
      tree.update(ui);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/settings");
  });

  it("does not reset for a non-sub-route path", () => {
    mockLayout.splitSettings = true;
    mockPath.current = "/settings";
    const tree = mount(<SettingsLayout />);
    mockLayout.splitSettings = false;
    act(() => {
      tree.update(
        <QueryClientProvider client={client}>
          <SettingsLayout />
        </QueryClientProvider>,
      );
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

describe("Weather screen", () => {
  it("renders the series chart in portrait on wide screens", async () => {
    mockWindow.width = 1200;
    const tree = mount(<Weather />);
    await flush();
    expect(json(tree)).toContain("wx:series:");
    expect(mockCore.weather.getHourlyWeatherData).toHaveBeenCalled();
  });

  it("selects another metric via the chips", async () => {
    mockWindow.width = 1200;
    const tree = mount(<Weather />);
    await flush();
    const chips = tree.root.findAll(
      (n) =>
        typeof n.props.onPress === "function" && n.props.className?.includes?.("rounded-md border"),
    );
    expect(chips.length).toBeGreaterThan(3);
    act(() => {
      chips[2].props.onPress();
    });
    await flush();
    expect(json(tree)).toContain("wx:series:");
  });

  it("uses daily bands and the weekly endpoint for phone weekly", async () => {
    const tree = mount(<Weather />);
    await flush();
    const seg = tree.root.findAll(
      (n) => typeof n.props.onChange === "function" && n.props.value === "hourly",
    )[0];
    act(() => {
      seg.props.onChange("weekly");
    });
    await flush();
    expect(mockCore.weather.getWeeklyHourlyWeatherData).toHaveBeenCalled();
    expect(json(tree)).toContain("wx:band:");
  });

  it("renders the landscape side panel with wrapped chips", async () => {
    Object.assign(mockLayout, { isLandscape: true, isPhoneLandscape: true });
    const phone = mount(<Weather />);
    await flush();
    expect(json(phone)).toContain("wx:");
    Object.assign(mockLayout, { isPhoneLandscape: false });
    const tablet = mount(<Weather />);
    await flush();
    expect(json(tablet)).toContain("wx:");
  });
});
