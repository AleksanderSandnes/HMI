import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Appearance } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { NotificationsOverlay } from "../components/NotificationsOverlay";
import { SubScreen } from "../components/settings/SubScreen";
import { geistFamilyForWeight, GEIST_FONT_NAMES } from "../font";
import { hairline, ThemeProvider, useThemeBootstrap, useThemeColors } from "../lib/theme";

const mockNw = { set: jest.fn() };
const mockRouter = { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() };
const mockLayout = { splitSettings: false };

jest.mock("nativewind", () => ({ colorScheme: { set: (v: unknown) => mockNw.set(v) } }));
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../lib/useLayoutMode", () => ({ useLayoutMode: () => mockLayout }));

let mounted: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => mounted.forEach((t) => t.unmount()));
  mounted = [];
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

function mount(ui: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(ui);
  });
  mounted.push(tree);
  return tree;
}

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

describe("hairline", () => {
  it("is white on dark and dark-tinted on light", () => {
    expect(hairline("dark", 0.1)).toBe("rgba(255, 255, 255, 0.1)");
    expect(hairline("light", 0.2)).toBe("rgba(20, 26, 41, 0.2)");
  });
});

describe("useThemeBootstrap", () => {
  function probe() {
    const ref = { current: undefined as unknown as ReturnType<typeof useThemeBootstrap> };
    function P() {
      ref.current = useThemeBootstrap();
      return null;
    }
    mount(<P />);
    return ref;
  }

  it("defaults to system when nothing is stored", async () => {
    await AsyncStorage.removeItem("pref.theme");
    const ref = probe();
    expect(ref.current.ready).toBe(false);
    await flush();
    expect(ref.current).toEqual({ preference: "system", ready: true });
    expect(mockNw.set).toHaveBeenCalledWith("system");
  });

  it("uses a valid stored preference and ignores garbage", async () => {
    await AsyncStorage.setItem("pref.theme", "light");
    const ref = probe();
    await flush();
    expect(ref.current.preference).toBe("light");
    await AsyncStorage.setItem("pref.theme", "purple");
    const again = probe();
    await flush();
    expect(again.current.preference).toBe("system");
  });
});

describe("ThemeProvider", () => {
  function probe(preference: "light" | "dark" | "system") {
    const ref = { current: undefined as unknown as ReturnType<typeof useThemeColors> };
    function P() {
      ref.current = useThemeColors();
      return null;
    }
    mount(
      <ThemeProvider preference={preference}>
        <P />
      </ThemeProvider>,
    );
    return ref;
  }

  it("provides light or dark colors and persists preference changes", async () => {
    const ref = probe("dark");
    const dark = ref.current.colors.bgBase;
    await act(async () => ref.current.setPreference("light"));
    expect(ref.current.mode).toBe("light");
    expect(ref.current.colors.bgBase).not.toBe(dark);
    expect(mockNw.set).toHaveBeenCalledWith("light");
    expect(await AsyncStorage.getItem("pref.theme")).toBe("light");
  });

  it("follows OS appearance changes while on system", () => {
    jest.spyOn(Appearance, "getColorScheme").mockReturnValue("dark");
    let listener: (p: { colorScheme: "light" | "dark" | null }) => void = () => {};
    const remove = jest.fn();
    jest.spyOn(Appearance, "addChangeListener").mockImplementation((cb) => {
      listener = cb as typeof listener;
      return { remove } as never;
    });
    const ref = probe("system");
    expect(ref.current.mode).toBe("dark");
    act(() => listener({ colorScheme: "light" }));
    expect(ref.current.mode).toBe("light");
    act(() => listener({ colorScheme: null }));
    expect(ref.current.mode).toBe("dark");
    act(() => mounted[0].unmount());
    mounted = [];
    expect(remove).toHaveBeenCalled();
  });

  it("does not subscribe to the OS when a fixed preference is chosen", () => {
    const add = jest.spyOn(Appearance, "addChangeListener");
    probe("light");
    expect(add).not.toHaveBeenCalled();
  });
});

describe("font helpers", () => {
  it("maps font weights to Geist families", () => {
    expect(geistFamilyForWeight("500")).toBe("Geist_500Medium");
    expect(geistFamilyForWeight("bold")).toBe("Geist_700Bold");
    expect(geistFamilyForWeight("900")).toBe("Geist_900Black");
    expect(geistFamilyForWeight(undefined)).toBe("Geist_400Regular");
    expect(GEIST_FONT_NAMES).toContain("Geist_600SemiBold");
  });
});

describe("NotificationsOverlay", () => {
  const items = [
    {
      id: "a",
      level: "success",
      title: "Peak",
      message: "4 kW",
      createdAt: new Date().toISOString(),
    },
    { id: "b", level: "nonsense", title: "Odd", message: "", createdAt: new Date().toISOString() },
  ] as never;

  const texts = (t: TestRenderer.ReactTestRenderer) =>
    t.root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);

  it("lists items and wires dismiss, clear and close", () => {
    const onClose = jest.fn();
    const onClear = jest.fn();
    const onDismiss = jest.fn();
    const tree = mount(
      <NotificationsOverlay
        visible
        onClose={onClose}
        items={items}
        onClear={onClear}
        onDismiss={onDismiss}
      />,
    );
    expect(texts(tree)).toContain("Peak");
    const dismiss = tree.root.findAll((n) => n.props.accessibilityLabel === "Dismiss")[0];
    void act(() => dismiss.props.onPress());
    expect(onDismiss).toHaveBeenCalledWith("a");
    const clear = tree.root.findAll(
      (n) => typeof n.props.onPress === "function" && n.props.onPress === onClear,
    )[0];
    void act(() => clear.props.onPress());
    expect(onClear).toHaveBeenCalled();
    const backdrop = tree.root.findAll((n) => n.props.onPress === onClose)[0];
    void act(() => backdrop.props.onPress());
    expect(onClose).toHaveBeenCalled();
    const inner = tree.root.findAll(
      (n) =>
        typeof n.props.onPress === "function" &&
        n.props.onPress !== onClose &&
        n.props.onPress !== onClear &&
        !n.props.accessibilityLabel,
    )[0];
    const stop = jest.fn();
    void act(() => inner.props.onPress({ stopPropagation: stop }));
    expect(stop).toHaveBeenCalled();
  });

  it("shows the empty state without a clear action", () => {
    const tree = mount(
      <NotificationsOverlay
        visible
        onClose={jest.fn()}
        items={[]}
        onClear={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(texts(tree)).toContain("You're all caught up");
  });
});

describe("SubScreen", () => {
  const back = (t: TestRenderer.ReactTestRenderer) =>
    t.root.findAll((n) => n.props.accessibilityLabel === "Back")[0];

  it("goes back when history exists", () => {
    mockRouter.canGoBack.mockReturnValue(true);
    mockLayout.splitSettings = false;
    const tree = mount(
      <SubScreen title="Profile" subtitle="Edit">
        <></>
      </SubScreen>,
    );
    void act(() => back(tree).props.onPress());
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("falls back to replacing with /settings on a cold entry", () => {
    mockRouter.canGoBack.mockReturnValue(false);
    const tree = mount(
      <SubScreen title="Profile">
        <></>
      </SubScreen>,
    );
    void act(() => back(tree).props.onPress());
    expect(mockRouter.replace).toHaveBeenCalledWith("/settings");
  });

  it("hides the back button in the split tablet layout", () => {
    mockLayout.splitSettings = true;
    const tree = mount(
      <SubScreen title="Profile">
        <></>
      </SubScreen>,
    );
    expect(back(tree)).toBeUndefined();
  });
});
