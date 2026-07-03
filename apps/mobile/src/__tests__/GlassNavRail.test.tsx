import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TestRenderer, { act } from "react-test-renderer";

import { GlassNavRail } from "../components/navigation/GlassNavRail";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 852, height: 393 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Minimal fabricated BottomTabBarProps (same stub approach as SegmentedControl.test). */
function makeProps(activeIndex: number, emit: jest.Mock, navigate: jest.Mock) {
  const routes = [
    { key: "index-1", name: "index" },
    { key: "solar-1", name: "solar" },
  ];
  const descriptors = Object.fromEntries(
    routes.map((r, i) => [r.key, { options: { title: i === 0 ? "Dashboard" : "Solar" } }]),
  );
  return {
    state: { index: activeIndex, routes },
    descriptors,
    navigation: { emit, navigate },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as BottomTabBarProps;
}

function renderTree(element: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>{element}</SafeAreaProvider>,
    );
  });
  return tree.root;
}

describe("GlassNavRail", () => {
  it("renders every tab label", () => {
    const root = renderTree(<GlassNavRail {...makeProps(0, jest.fn(), jest.fn())} />);
    const labels = root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);
    expect(labels).toEqual(expect.arrayContaining(["Dashboard", "Solar"]));
  });

  it("marks the active route's Pressable as selected", () => {
    const root = renderTree(<GlassNavRail {...makeProps(1, jest.fn(), jest.fn())} />);
    // Host nodes only (typeof type === "string") to avoid double-counting the
    // composite Pressable + its rendered host view.
    const selected = root.findAll(
      (n) => typeof n.type === "string" && n.props.accessibilityState?.selected === true,
    );
    expect(selected).toHaveLength(1);
  });

  it("emits tabPress and navigates on pressing an inactive tab", () => {
    const emit = jest.fn().mockReturnValue({ defaultPrevented: false });
    const navigate = jest.fn();
    const root = renderTree(<GlassNavRail {...makeProps(0, emit, navigate)} />);
    const buttons = root.findAll(
      (n) => n.props.accessibilityRole === "button" && !!n.props.onPress,
    );
    act(() => {
      buttons[1].props.onPress();
    });
    expect(emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "solar-1",
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith("solar");
  });
});
