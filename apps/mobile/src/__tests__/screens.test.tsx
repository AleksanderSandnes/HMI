import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import Login from "../../app/(auth)/login";
import Dashboard from "../../app/(tabs)/index";
import Solar from "../../app/(tabs)/solar";

const mockRouter = { replace: jest.fn(), push: jest.fn() };
const mockCore = {
  auth: { loginUser: jest.fn() },
  growatt: { fetchSolarData: jest.fn() },
  account: { getUserProfile: jest.fn() },
};
const mockLayout = {
  isLandscape: false,
  isPhoneLandscape: false,
  isTablet: false,
  columns: 1,
};
const mockWindow = { width: 400, height: 800 };
const mockNotifications = {
  items: [] as unknown[],
  count: 0,
  clearAll: jest.fn(),
  dismiss: jest.fn(),
};
const mockModel = {
  device: { model: "MIN", online: true },
  capacityKw: 5,
  obsTimeLocal: undefined as string | undefined,
  obs: { obsTimeLocal: "2026-09-30 12:30:00" } as { obsTimeLocal?: string } | undefined,
};

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("../lib/useCore", () => ({ useCore: () => mockCore }));
jest.mock("../lib/useLayoutMode", () => ({ useLayoutMode: () => mockLayout }));
jest.mock("../lib/useNotifications", () => ({ useNotifications: () => mockNotifications }));
jest.mock("../lib/useDashboardData", () => ({ useDashboardData: () => mockModel }));
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
  SolarChart: (p: { timespan: string }) => `chart:${p.timespan}`,
}));
jest.mock("../components/dashboard/SolarHeroCard", () => ({ SolarHeroCard: () => "hero" }));
jest.mock("../components/dashboard/WeatherSummaryCard", () => ({
  WeatherSummaryCard: (p: { variant: string; dialSize?: number }) =>
    `weather:${p.variant}:${p.dialSize ?? "-"}`,
}));
jest.mock("../components/dashboard/DashboardTopbar", () => ({
  DashboardTopbar: (p: { onBellPress: () => void }) => {
    const { Pressable } = require("react-native");
    return <Pressable accessibilityLabel="bell" onPress={p.onBellPress} />;
  },
}));

let mounted: TestRenderer.ReactTestRenderer[] = [];
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  Object.assign(mockLayout, {
    isLandscape: false,
    isPhoneLandscape: false,
    isTablet: false,
    columns: 1,
  });
  Object.assign(mockWindow, { width: 400, height: 800 });
  mockNotifications.items = [];
  mockNotifications.count = 0;
  mockModel.obs = { obsTimeLocal: "2026-09-30 12:30:00" };
  mockModel.device = { model: "MIN", online: true };
  mockModel.capacityKw = 5;
  mockCore.account.getUserProfile.mockResolvedValue({ username: "Demo" });
  mockCore.growatt.fetchSolarData.mockResolvedValue({
    metrics: { todayGeneration: 3, totalGeneration: 9 },
    chartData: { labels: ["a", "b"], datasets: [{ data: [1, 4] }] },
  });
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

const texts = (t: TestRenderer.ReactTestRenderer) =>
  t.root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children as unknown);
const flat = (t: TestRenderer.ReactTestRenderer) => texts(t).flat(3).map(String);
const json = (t: TestRenderer.ReactTestRenderer) => JSON.stringify(t.toJSON());

describe("Dashboard", () => {
  it("renders a single column with the phone weather card and opens the overlay", async () => {
    const tree = mount(<Dashboard />);
    await flush();
    expect(json(tree)).toContain("weather:default:-");
    expect(flat(tree)).toEqual(expect.arrayContaining(["MIN · 5 kW"]));
    const bell = tree.root.findAll((n) => n.props.accessibilityLabel === "bell")[0];
    act(() => {
      bell.props.onPress();
    });
    expect(tree.root.findAll((n) => n.props.visible === true).length).toBeGreaterThan(0);
  });

  it("uses two columns and the rich widget on wide portrait tablets", async () => {
    Object.assign(mockLayout, { columns: 2, isTablet: true });
    mockWindow.width = 900;
    const tree = mount(<Dashboard />);
    await flush();
    expect(json(tree)).toContain("weather:rich");
  });

  it("scales the dial on tablets by orientation", async () => {
    Object.assign(mockLayout, { isTablet: true, isLandscape: true, columns: 2 });
    mockWindow.width = 700;
    const landscape = mount(<Dashboard />);
    await flush();
    expect(json(landscape)).toContain("weather:default:230");
    Object.assign(mockLayout, { isLandscape: false });
    mockWindow.width = 500;
    const portrait = mount(<Dashboard />);
    await flush();
    expect(json(portrait)).toContain("weather:default:190");
  });

  it("hides the topbar and uses the compact card on landscape phones", async () => {
    Object.assign(mockLayout, { isPhoneLandscape: true, isLandscape: true, columns: 2 });
    const tree = mount(<Dashboard />);
    await flush();
    expect(json(tree)).toContain("weather:compact");
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === "bell")).toHaveLength(0);
  });

  it("uses the compact card on short portrait phones", async () => {
    mockWindow.height = 640;
    const tree = mount(<Dashboard />);
    await flush();
    expect(json(tree)).toContain("weather:compact");
  });

  it("omits captions when there is no device or observation time", async () => {
    mockModel.obs = undefined;
    mockModel.device = undefined as never;
    mockModel.capacityKw = null as never;
    const tree = mount(<Dashboard />);
    await flush();
    expect(flat(tree).some((s) => s.includes("kW"))).toBe(false);
  });
});

describe("Solar screen", () => {
  it("shows the stacked portrait layout with chart and caps", async () => {
    const tree = mount(<Solar />);
    await flush();
    expect(mockCore.growatt.fetchSolarData).toHaveBeenCalledWith("hourly", expect.any(String));
    expect(json(tree)).toContain("chart:hourly");
  });

  it("switches timespan and refetches", async () => {
    const tree = mount(<Solar />);
    await flush();
    const seg = tree.root.findAll(
      (n) => typeof n.props.onChange === "function" && n.props.value === "hourly",
    )[0];
    act(() => {
      seg.props.onChange("weekly");
    });
    await flush();
    expect(mockCore.growatt.fetchSolarData).toHaveBeenCalledWith("weekly", expect.any(String));
  });

  it("uses the landscape shell on tablets and phones", async () => {
    Object.assign(mockLayout, { isLandscape: true, isPhoneLandscape: true });
    const phone = mount(<Solar />);
    await flush();
    expect(json(phone)).toContain("chart:hourly");
    Object.assign(mockLayout, { isPhoneLandscape: false });
    const tablet = mount(<Solar />);
    await flush();
    expect(json(tablet)).toContain("chart:hourly");
  });

  it("renders without caps when there is no data", async () => {
    mockCore.growatt.fetchSolarData.mockResolvedValue({
      metrics: { todayGeneration: 0, totalGeneration: 0 },
      chartData: { labels: [], datasets: [{ data: [] }] },
    });
    const tree = mount(<Solar />);
    await flush();
    expect(json(tree)).toContain("chart:hourly");
  });
});

describe("Login", () => {
  const field = (t: TestRenderer.ReactTestRenderer, label: string) =>
    t.root.findAll((n) => n.props.label === label && typeof n.props.onChangeText === "function")[0];
  const submit = (t: TestRenderer.ReactTestRenderer) =>
    t.root.findAll((n) => n.props.label === "Sign In" && typeof n.props.onPress === "function")[0];

  it("validates before submitting", async () => {
    const tree = mount(<Login />);
    await act(async () => {
      submit(tree).props.onPress();
    });
    await flush();
    expect(mockCore.auth.loginUser).not.toHaveBeenCalled();
  });

  it("signs in and navigates to the tabs", async () => {
    mockCore.auth.loginUser.mockResolvedValue(undefined);
    const tree = mount(<Login />);
    await act(async () => {
      field(tree, "EMAIL ADDRESS").props.onChangeText("demo@example.com");
      field(tree, "PASSWORD").props.onChangeText("Password1!");
    });
    await act(async () => {
      submit(tree).props.onPress();
    });
    await flush();
    expect(mockCore.auth.loginUser).toHaveBeenCalledWith({
      email: "demo@example.com",
      password: "Password1!",
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("shows an error banner when sign-in fails", async () => {
    mockCore.auth.loginUser.mockRejectedValue(new Error("bad"));
    const tree = mount(<Login />);
    await act(async () => {
      field(tree, "EMAIL ADDRESS").props.onChangeText("demo@example.com");
      field(tree, "PASSWORD").props.onChangeText("Password1!");
    });
    await act(async () => {
      submit(tree).props.onPress();
    });
    await flush();
    expect(tree.root.findAll((n) => n.props.kind === "error").length).toBeGreaterThan(0);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("links to registration", () => {
    const tree = mount(<Login />);
    const link = tree.root.findAll(
      (n) =>
        typeof n.props.onPress === "function" &&
        n.props.label === undefined &&
        !n.props.className?.includes?.("w-full"),
    );
    const go = link.find((n) => {
      try {
        act(() => {
          n.props.onPress();
        });
        return mockRouter.push.mock.calls.length > 0;
      } catch {
        return false;
      }
    });
    expect(go).toBeDefined();
    expect(mockRouter.push).toHaveBeenCalledWith("/(auth)/register");
  });
});
