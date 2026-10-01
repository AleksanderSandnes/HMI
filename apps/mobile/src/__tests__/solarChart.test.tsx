import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { ChartMessage } from "../components/charts/ChartMessage";
import { SolarChart } from "../components/charts/SolarChart";
import { TooltipBubble } from "../components/charts/Tooltip";
import { Axes } from "../components/charts/svg/Axes";
import type { useCrosshair } from "../components/charts/svg/crosshair";
import { GradientDef } from "../components/charts/svg/gradient";
import { buildGeometry } from "../components/charts/svg/scales";

const mockCrosshair = { index: null as number | null };
const mockHandlers: Record<string, (e: { x: number }) => void> = {};

jest.mock("react-native-gesture-handler", () => {
  const builder: Record<string, unknown> = {};
  builder.minDistance = () => builder;
  builder.onBegin = (fn: (e: { x: number }) => void) => {
    mockHandlers.begin = fn;
    return builder;
  };
  builder.onUpdate = (fn: (e: { x: number }) => void) => {
    mockHandlers.update = fn;
    return builder;
  };
  builder.onFinalize = (fn: () => void) => {
    mockHandlers.finalize = fn as never;
    return builder;
  };
  return {
    Gesture: { Pan: () => builder },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  };
});
jest.mock("react-native-reanimated", () => ({ runOnJS: (fn: unknown) => fn }));
jest.mock("../components/charts/svg/crosshair", () => {
  const actual = jest.requireActual("../components/charts/svg/crosshair");
  return {
    ...actual,
    useCrosshair: (geo: unknown) => {
      const real = actual.useCrosshair(geo);
      return mockCrosshair.index === null ? real : { ...real, index: mockCrosshair.index };
    },
  };
});

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
  t.root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);

const svgTexts = (t: TestRenderer.ReactTestRenderer) =>
  t.root
    .findAll((n) => n.props.textAnchor !== undefined && typeof n.props.children === "string")
    .map((n) => n.props.children as string);

const hourly = {
  labels: ["06:00", "09:00", "12:00", "15:00", "18:00"],
  datasets: [{ data: [0, 800, 3200, 1500, 0] }],
};
const weekly = {
  labels: ["Mon", "Tue", "Wed"],
  datasets: [{ data: [3, 9.5, 4] }],
};

describe("SolarChart", () => {
  it("shows a spinner before layout and while loading", () => {
    const tree = mount(<SolarChart data={hourly} timespan="hourly" />);
    expect(tree.root.findAllByType(ChartMessage)).toHaveLength(1);
    layout(tree);
    expect(tree.root.findAllByType(ChartMessage)).toHaveLength(0);
    const loading = mount(<SolarChart data={hourly} timespan="hourly" loading />);
    layout(loading);
    expect(loading.root.findAllByType(ChartMessage)).toHaveLength(1);
  });

  it("shows the empty state for no or all-zero data", () => {
    const tree = mount(
      <SolarChart data={{ labels: [], datasets: [{ data: [0, 0] }] }} timespan="weekly" />,
    );
    layout(tree);
    expect(texts(tree)).toContain("No production data for this period");
    const missing = mount(<SolarChart data={undefined as never} timespan="weekly" />);
    layout(missing);
    expect(texts(missing)).toContain("No production data for this period");
  });

  it("draws the hourly area with kW axis labels", () => {
    const tree = mount(<SolarChart data={hourly} timespan="hourly" />);
    layout(tree);
    const t = svgTexts(tree);
    expect(t).toContain("0");
    expect(t.some((s) => /^\d+(\.\d)?$/.test(s))).toBe(true);
  });

  it("draws bars for aggregated timespans", () => {
    const tree = mount(<SolarChart data={weekly} timespan="weekly" />);
    layout(tree);
    expect(tree.root.findAll((n) => n.props.rx === 6 && n.props.width > 0)).not.toHaveLength(0);
  });

  it.each([
    ["hourly", hourly, 2, "12:00"],
    ["weekly", weekly, 1, "Tuesday"],
    ["monthly", { labels: ["1", "2", "3"], datasets: [{ data: [1, 2, 3] }] }, 2, "September 3"],
    ["yearly", { labels: ["Jan", "Feb", "Mar"], datasets: [{ data: [1, 2, 3] }] }, 0, "January"],
  ])("shows a %s tooltip when scrubbed", (timespan, data, index, header) => {
    mockCrosshair.index = index as number;
    const tree = mount(
      <SolarChart data={data as never} timespan={timespan as string} date="2026-09-15" />,
    );
    layout(tree);
    expect(texts(tree)).toContain(header);
  });

  it("keeps unknown weekly/yearly labels as-is", () => {
    mockCrosshair.index = 0;
    const tree = mount(
      <SolarChart data={{ labels: ["??"], datasets: [{ data: [5] }] }} timespan="weekly" />,
    );
    layout(tree);
    expect(texts(tree)).toContain("??");
  });
});

describe("useCrosshair", () => {
  it("tracks the nearest index within range and clears on release", () => {
    const geo = buildGeometry({
      width: 200,
      height: 100,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      count: 5,
      yDomain: [0, 1],
    });
    const ref = { current: undefined as unknown as ReturnType<typeof useCrosshair> };
    function P() {
      ref.current = jest.requireActual("../components/charts/svg/crosshair").useCrosshair(geo);
      return null;
    }
    mount(<P />);
    act(() => mockHandlers.begin({ x: 100 }));
    expect(ref.current.index).toBe(2);
    act(() => mockHandlers.update({ x: 9999 }));
    expect(ref.current.index).toBe(4);
    act(() => mockHandlers.update({ x: -50 }));
    expect(ref.current.index).toBe(0);
    act(() => (mockHandlers.finalize as unknown as () => void)());
    expect(ref.current.index).toBeNull();
  });
});

describe("chart building blocks", () => {
  it("clamps the tooltip bubble inside the chart", () => {
    const left = (x: number, width: number) => {
      const tree = mount(
        <TooltipBubble x={x} width={width}>
          <></>
        </TooltipBubble>,
      );
      const view = tree.root.findAll((n) => n.props.pointerEvents === "none")[0];
      return view.props.style.left as number;
    };
    expect(left(0, 400)).toBe(4);
    expect(left(200, 400)).toBe(134);
    expect(left(400, 400)).toBe(264);
    expect(left(10, 100)).toBe(4);
  });

  it("renders a fixed-height message", () => {
    const tree = mount(<ChartMessage height={120} text="Nothing" />);
    expect(texts(tree)).toContain("Nothing");
  });

  it("builds vertical and horizontal gradients", () => {
    const stops = [
      { offset: 0, color: "#fff" },
      { offset: 1, color: "#000", opacity: 0.5 },
    ];
    const v = mount(<GradientDef id="g" stops={stops} />);
    const h = mount(<GradientDef id="g2" horizontal stops={stops} />);
    const pick = (t: TestRenderer.ReactTestRenderer) =>
      t.root.findAll((n) => n.props.id && n.props.x2 !== undefined)[0].props;
    expect(pick(v)).toMatchObject({ x2: "0", y2: "1" });
    expect(pick(h)).toMatchObject({ x2: "1", y2: "0" });
  });

  it("drops x ticks that are too close together", () => {
    const geo = buildGeometry({
      width: 100,
      height: 100,
      margins: { top: 0, right: 0, bottom: 20, left: 0 },
      count: 12,
      yDomain: [0, 1],
    });
    const tree = mount(
      <Axes
        geo={geo}
        xCount={12}
        yCount={3}
        xAt={geo.x}
        formatX={(i) => `x${i}`}
        formatY={(v) => `y${v}`}
      />,
    );
    const labels = svgTexts(tree);
    expect(labels.filter((s) => s.startsWith("y"))).toHaveLength(3);
    expect(labels.filter((s) => s.startsWith("x")).length).toBeLessThan(12);
  });
});
