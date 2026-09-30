import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { WeatherChart } from "../components/charts/WeatherChart";
import { DualBaro } from "../components/charts/dials/Barometer";

const mockCrosshair = { index: null as number | null };

jest.mock("react-native-gesture-handler", () => ({
  Gesture: { Pan: () => ({}) },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../components/charts/svg/crosshair", () => ({
  useCrosshair: () => ({ index: mockCrosshair.index, gesture: {} }),
}));

let mounted: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => mounted.forEach((t) => t.unmount()));
  mounted = [];
  mockCrosshair.index = null;
});

function mount(ui: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(ui);
  });
  mounted.push(tree);
  return tree;
}

function layout(tree: TestRenderer.ReactTestRenderer, w = 320, h = 200) {
  const host = tree.root.findAll((n) => typeof n.props.onLayout === "function")[0];
  void act(() => host.props.onLayout({ nativeEvent: { layout: { width: w, height: h } } }));
}

const texts = (t: TestRenderer.ReactTestRenderer) =>
  t.root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children as unknown);

const flat = (t: TestRenderer.ReactTestRenderer) => texts(t).flat(3).map(String);

const labels = ["00", "06", "12", "18"];
const series = [
  { data: [4, 6, 9, 5], color: "#f00", label: "Temp" },
  { data: [1, 2, 3, 2], color: "#0f0", label: "Dew" },
];
const band = { min: [1, 2, 0], max: [8, 9, 7], avg: [4, 5, 3] };

describe("WeatherChart", () => {
  it("waits for layout before drawing, and spins while loading", () => {
    const tree = mount(<WeatherChart labels={labels} series={series} />);
    expect(flat(tree)).toHaveLength(0);
    layout(tree);
    expect(tree.root.findAll((n) => n.props.stroke === "#f00").length).toBeGreaterThan(0);
    const loading = mount(<WeatherChart labels={labels} series={series} loading />);
    layout(loading);
    expect(loading.root.findAll((n) => n.props.stroke === "#f00")).toHaveLength(0);
  });

  it("shows the empty message with default or custom text", () => {
    const empty = mount(<WeatherChart labels={[]} series={[]} />);
    layout(empty);
    expect(flat(empty).length).toBeGreaterThan(0);
    const custom = mount(
      <WeatherChart
        labels={[]}
        series={[{ data: [], color: "#000", label: "x" }]}
        emptyText="No data"
      />,
    );
    layout(custom);
    expect(flat(custom)).toContain("No data");
  });

  it("lists every series in the scrub tooltip", () => {
    mockCrosshair.index = 2;
    const tree = mount(<WeatherChart labels={labels} series={series} unit="°C" />);
    layout(tree);
    const t = flat(tree);
    expect(t).toContain("Temp");
    expect(t).toContain("Dew");
    expect(t.some((s) => s.includes("°C"))).toBe(true);
  });

  it("draws the daily band with High/Avg/Low rows and expands weekday labels", () => {
    mockCrosshair.index = 1;
    const tree = mount(
      <WeatherChart labels={["Mon", "Tue", "Wed"]} band={band} bandColor="#abc" />,
    );
    layout(tree);
    const t = flat(tree);
    expect(t).toEqual(expect.arrayContaining(["High", "Avg", "Low", "Tuesday"]));
  });

  it("falls back to series mode when the band is empty", () => {
    const tree = mount(
      <WeatherChart labels={labels} series={series} band={{ min: [], max: [], avg: [] }} />,
    );
    layout(tree);
    expect(tree.root.findAll((n) => n.props.stroke === "#f00").length).toBeGreaterThan(0);
  });

  it("pads missing points with zero", () => {
    mockCrosshair.index = 3;
    const tree = mount(
      <WeatherChart labels={labels} series={[{ data: [1, 2], color: "#123", label: "Short" }]} />,
    );
    layout(tree);
    expect(flat(tree)).toContain("Short");
  });
});

describe("DualBaro", () => {
  it("renders both readings with a needle each", () => {
    const tree = mount(<DualBaro now={1013.26} avg={1000} />);
    const t = flat(tree);
    expect(t).toEqual(expect.arrayContaining(["1013.3"]));
    expect(tree.root.findAll((n) => typeof n.props.transform === "string")).toHaveLength(2);
  });

  it("clamps out-of-range values and shows a dash when missing", () => {
    const tree = mount(<DualBaro now={900} avg={null} unit="mb" />);
    expect(flat(tree)).toContain("—");
    expect(tree.root.findAll((n) => typeof n.props.transform === "string")).toHaveLength(1);
    const high = mount(<DualBaro now={1200} avg={1200} />);
    expect(high.root.findAll((n) => typeof n.props.transform === "string")).toHaveLength(2);
  });
});
