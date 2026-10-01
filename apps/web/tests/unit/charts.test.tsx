import { cleanup, render, screen } from "@testing-library/react";
import { cloneElement, isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SolarChart } from "@/components/charts/SolarChart";
import {
  buildRows,
  readClean,
  WeatherChart,
  xTickProps,
  type LineSeries,
} from "@/components/charts/WeatherChart";

// jsdom has no layout, so ResponsiveContainer would render nothing. Give the
// chart a fixed size so the real Recharts tree (axes, areas, bars) is built.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ width: number; height: number }>, {
            width: 600,
            height: 300,
          })
        : null,
  };
});

afterEach(cleanup);

const solar = (data: number[], labels = data.map((_, i) => `L${i}`)) => ({
  labels,
  datasets: [{ data }],
});

describe("SolarChart", () => {
  it("shows a spinner while loading", () => {
    const { container } = render(<SolarChart data={solar([1, 2])} timespan="hourly" loading />);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("shows the empty state for missing or all-zero data", () => {
    const { rerender } = render(<SolarChart data={solar([])} timespan="hourly" />);
    expect(screen.getByText(/No production data/)).toBeInTheDocument();
    rerender(<SolarChart data={solar([0, 0, 0])} timespan="daily" />);
    expect(screen.getByText(/No production data/)).toBeInTheDocument();
    rerender(
      <SolarChart
        data={undefined as unknown as ReturnType<typeof solar>}
        timespan="daily"
        heightClass="h-40"
      />,
    );
    expect(screen.getByText(/No production data/)).toBeInTheDocument();
  });

  it("renders an area chart for the hourly timespan", () => {
    const { container } = render(<SolarChart data={solar([0, 120, 480, 300])} timespan="hourly" />);
    expect(container.querySelector(".recharts-area")).not.toBeNull();
  });

  it("renders bars for other timespans, with and without axes", () => {
    const { container, rerender } = render(
      <SolarChart data={solar([3, 9, 4])} timespan="weekly" heightClass="h-64" />,
    );
    expect(container.querySelector(".recharts-bar")).not.toBeNull();
    expect(container.querySelector(".recharts-xAxis")).not.toBeNull();
    rerender(<SolarChart data={solar([3, 9, 4])} timespan="monthly" showAxes={false} />);
    expect(container.querySelector(".recharts-xAxis")).toBeNull();
  });
});

describe("WeatherChart helpers", () => {
  const a: LineSeries = { data: [1, 2, 3], color: "#111", label: "A" };
  const empty: LineSeries = { data: [], color: "#222", label: "B" };

  it("drops empty series and flattens values", () => {
    const r = readClean([a, empty]);
    expect(r.clean).toEqual([a]);
    expect(r.n).toBe(3);
    expect(r.all).toEqual([1, 2, 3]);
    expect(readClean(undefined as unknown as LineSeries[]).n).toBe(0);
  });

  it("builds rows, padding missing points with zero", () => {
    expect(buildRows(["x", "y", "z", "w"], [a])).toEqual([
      { label: "x", s0: 1 },
      { label: "y", s0: 2 },
      { label: "z", s0: 3 },
      { label: "w", s0: 0 },
    ]);
  });

  it("uses explicit ticks when supplied and auto ticks otherwise", () => {
    expect(xTickProps(["a", "b"])).toEqual({ ticks: ["a", "b"], interval: 0 });
    expect(xTickProps([])).toEqual({ interval: "preserveStartEnd", minTickGap: 32 });
    expect(xTickProps()).toEqual({ interval: "preserveStartEnd", minTickGap: 32 });
  });
});

describe("WeatherChart", () => {
  const labels = ["00", "01", "02", "03"];
  const series: LineSeries[] = [
    { data: [4, 5, 6, 5], color: "#f00", label: "Temp" },
    { data: [1, 2, 1, 0], color: "#0f0", label: "Dew" },
  ];

  it("shows a loading state and an empty state", () => {
    const { container, rerender } = render(
      <WeatherChart labels={labels} series={series} loading />,
    );
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    rerender(<WeatherChart labels={[]} series={[]} emptyText="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders multi-series areas with explicit and automatic ticks", () => {
    const { container, rerender } = render(
      <WeatherChart labels={labels} series={series} unit="°C" ticks={["00", "02"]} />,
    );
    expect(container.querySelectorAll(".recharts-area").length).toBeGreaterThan(1);
    rerender(<WeatherChart labels={labels} series={series} heightClass="h-56" />);
    expect(container.querySelector(".recharts-area")).not.toBeNull();
  });

  it("renders a daily min/max/avg band", () => {
    const { container } = render(
      <WeatherChart
        labels={["Mon", "Tue", "Wed"]}
        band={{ min: [1, 2, 0], max: [8, 9, 7], avg: [4, 5, 3] }}
        bandColor="#abc"
        unit="°C"
        heightClass="h-56"
      />,
    );
    expect(container.querySelector(".recharts-responsive-container, svg")).not.toBeNull();
  });
});
