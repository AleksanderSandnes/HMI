import { Ionicons } from "@expo/vector-icons";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import Index from "../../app/index";
import { DashboardTopbar } from "../components/dashboard/DashboardTopbar";
import { Sparkline } from "../components/dashboard/Sparkline";
import { GlassTabBar } from "../components/navigation/GlassTabBar";
import { Calendar } from "../components/ui/Calendar";
import { Modal } from "../components/ui/Modal";

const mockAuth = { session: null as unknown, isLoading: false };
const mockWindow = { width: 400 };

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => `redirect:${href}`,
}));
jest.mock("../lib/auth", () => ({ useAuth: () => mockAuth }));
jest.mock("../lib/useAvatar", () => ({ useAvatar: () => ({ uri: null }) }));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 12, left: 0, right: 0 }),
}));

let mounted: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => {
    mounted.forEach((t) => t.unmount());
  });
  mounted = [];
  mockAuth.session = null;
  mockAuth.isLoading = false;
  mockWindow.width = 400;
  jest.clearAllMocks();
});

function mount(ui: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(ui);
  });
  mounted.push(tree);
  return tree;
}

const json = (t: TestRenderer.ReactTestRenderer) => JSON.stringify(t.toJSON());
const texts = (t: TestRenderer.ReactTestRenderer) =>
  t.root
    .findAll((n) => String(n.type) === "Text")
    .map((n) => n.props.children as unknown)
    .flat(3)
    .map(String);
const press = (n: TestRenderer.ReactTestInstance) => {
  act(() => {
    n.props.onPress({ stopPropagation: () => {} });
  });
};
const byText = (t: TestRenderer.ReactTestRenderer, text: string) =>
  t.root.findAll(
    (n) =>
      typeof n.props.onPress === "function" &&
      n
        .findAll((c) => String(c.type) === "Text")
        .map((c) => [c.props.children].flat().map(String).join(""))
        .join("") === text,
  )[0];

describe("Index route", () => {
  it("shows a spinner while the session loads", () => {
    mockAuth.isLoading = true;
    expect(json(mount(<Index />))).not.toContain("redirect");
  });

  it("redirects by session", () => {
    expect(json(mount(<Index />))).toContain("redirect:/(auth)/login");
    mockAuth.session = { user: { id: "u" } };
    expect(json(mount(<Index />))).toContain("redirect:/(tabs)");
  });
});

describe("DashboardTopbar", () => {
  it("shows the badge count, caps at 9+ and fires the bell handler", () => {
    const onBell = jest.fn();
    const tree = mount(
      <DashboardTopbar username="Ada Lovelace" notifCount={12} online onBellPress={onBell} />,
    );
    expect(texts(tree)).toEqual(expect.arrayContaining(["HMI", "9+", "AL"]));
    press(tree.root.findAll((n) => n.props.onPress === onBell)[0]);
    expect(onBell).toHaveBeenCalled();
  });

  it("hides the badge and online dot when idle", () => {
    const tree = mount(<DashboardTopbar notifCount={0} online={false} onBellPress={jest.fn()} />);
    expect(texts(tree)).not.toContain("0");
    const small = mount(<DashboardTopbar notifCount={4} onBellPress={jest.fn()} />);
    expect(texts(small)).toContain("4");
  });
});

describe("Sparkline", () => {
  const layout = (t: TestRenderer.ReactTestRenderer, w: number, h: number) => {
    const host = t.root.findAll((n) => typeof n.props.onLayout === "function")[0];
    act(() => {
      host.props.onLayout({ nativeEvent: { layout: { width: w, height: h } } });
    });
  };

  it("draws nothing until measured, then a path for any series length", () => {
    for (const values of [[], [3], [0, 2, 5, 1]]) {
      const tree = mount(<Sparkline values={values} />);
      expect(tree.root.findAll((n) => typeof n.props.d === "string")).toHaveLength(0);
      layout(tree, 200, 80);
      expect(tree.root.findAll((n) => typeof n.props.d === "string").length).toBeGreaterThan(0);
    }
  });
});

describe("GlassTabBar", () => {
  const routes = [
    { key: "a", name: "index" },
    { key: "b", name: "solar" },
  ];
  const descriptors = { a: { options: { title: "Home" } }, b: { options: {} } };

  it("highlights the focused tab and navigates on press", () => {
    const navigation = {
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
      navigate: jest.fn(),
    };
    const props = {
      state: { index: 0, routes },
      descriptors,
      navigation,
    } as unknown as React.ComponentProps<typeof GlassTabBar>;
    const tree = mount(<GlassTabBar {...props} />);
    expect(texts(tree)).toEqual(expect.arrayContaining(["Home", "solar"]));
    const buttons = tree.root.findAll(
      (n) => n.props.accessibilityRole === "button" && typeof n.type !== "string",
    );
    const selected = buttons.filter((b) => b.props.accessibilityState?.selected);
    const others = buttons.filter((b) => !b.props.accessibilityState?.selected);
    expect(selected.length).toBeGreaterThan(0);
    expect(others.length).toBeGreaterThan(0);
    act(() => {
      others[0].props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith("solar");
  });
});

describe("Modal", () => {
  const icon = (p: { color: string; size: number }) => <Ionicons name="key" {...p} />;

  it("renders title, optional subtitle and children, and closes", () => {
    const onClose = jest.fn();
    const tree = mount(
      <Modal visible onClose={onClose} icon={icon} gradient="solar" title="Edit" subtitle="Sub">
        <></>
      </Modal>,
    );
    expect(texts(tree)).toEqual(expect.arrayContaining(["Edit", "Sub"]));
    const closers = tree.root.findAll((n) => n.props.onPress === onClose);
    press(closers[closers.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("uses a fixed width on tablets and no subtitle by default", () => {
    mockWindow.width = 1000;
    const tree = mount(
      <Modal visible onClose={jest.fn()} icon={icon} gradient="energy" title="Edit">
        <></>
      </Modal>,
    );
    expect(texts(tree)).not.toContain("Sub");
    expect(json(tree)).toContain("460");
  });
});

describe("Calendar", () => {
  const setup = (over: Partial<React.ComponentProps<typeof Calendar>> = {}) => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const tree = mount(
      <Calendar visible value="2026-09-15" onSelect={onSelect} onClose={onClose} {...over} />,
    );
    return { tree, onSelect, onClose };
  };

  it("shows the selected month and picks a day", () => {
    const { tree, onSelect, onClose } = setup();
    expect(texts(tree)).toContain("September 2026");
    press(byText(tree, "20"));
    expect(onSelect).toHaveBeenCalledWith("2026-09-20");
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates months with the chevrons", () => {
    const { tree } = setup();
    const chevrons = tree.root.findAll(
      (n) => n.props.hitSlop === 8 && typeof n.props.onPress === "function" && n.props.className,
    );
    press(chevrons[0]);
    expect(texts(tree)).toContain("August 2026");
    press(chevrons[1]);
    press(chevrons[1]);
    expect(texts(tree)).toContain("October 2026");
  });

  it("zooms to months then years and steps back down on selection", () => {
    const { tree } = setup();
    press(byText(tree, "September 2026"));
    expect(texts(tree)).toContain("2026");
    const chevrons = () =>
      tree.root.findAll(
        (n) =>
          typeof n.type !== "string" &&
          typeof n.props.onPress === "function" &&
          n.props.hitSlop === 8 &&
          n.props.className?.includes("h-9"),
      );
    press(chevrons()[1]);
    expect(texts(tree)).toContain("2027");
    press(chevrons()[0]);
    press(byText(tree, "2026"));
    expect(texts(tree).some((s) => /^\d{4}–\d{4}$/.test(s))).toBe(true);
    press(chevrons()[1]);
    press(chevrons()[0]);
    press(byText(tree, "2026"));
    press(byText(tree, "Mar"));
    expect(texts(tree)).toContain("March 2026");
  });

  it("jumps to today and closes", () => {
    const { tree, onSelect, onClose } = setup();
    press(byText(tree, "Today"));
    expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    press(byText(tree, "Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables future days by default but allows them when configured", () => {
    const next = new Date();
    next.setDate(next.getDate() + 5);
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    const blocked = setup({ value: iso });
    expect(blocked.tree.root.findAll((n) => n.props.disabled === true).length).toBeGreaterThan(0);
    const open = setup({ value: iso, disableFuture: false });
    expect(open.tree.root.findAll((n) => n.props.disabled === true)).toHaveLength(0);
  });

  it("resets to the day view when reopened and ignores backdrop inner presses", () => {
    const { tree, onClose } = setup();
    press(byText(tree, "September 2026"));
    act(() => {
      tree.update(
        <Calendar visible={false} value="2026-09-15" onSelect={jest.fn()} onClose={onClose} />,
      );
    });
    act(() => {
      tree.update(<Calendar visible value="2026-09-15" onSelect={jest.fn()} onClose={onClose} />);
    });
    expect(texts(tree)).toContain("September 2026");
    const inner = tree.root.findAll(
      (n) =>
        typeof n.props.onPress === "function" && n.props.onPress !== onClose && !n.props.className,
    )[0];
    const stop = jest.fn();
    act(() => {
      inner.props.onPress({ stopPropagation: stop });
    });
    expect(stop).toHaveBeenCalled();
  });
});
