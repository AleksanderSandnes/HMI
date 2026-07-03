import { describe, expect, it } from "vitest";

import { buildRows, readClean, xTickProps } from "@/components/charts/WeatherChart";

const series = (data: number[], color = "#000", label = "s") => ({ data, color, label });

describe("readClean", () => {
  it("drops empty series and reports the point count", () => {
    const { clean, n, all } = readClean([series([1, 2]), series([]), series([3, 4])]);
    expect(clean).toHaveLength(2);
    expect(n).toBe(2);
    expect(all).toEqual([1, 2, 3, 4]);
  });

  it("handles no usable series", () => {
    const { clean, n, all } = readClean([series([])]);
    expect(clean).toHaveLength(0);
    expect(n).toBe(0);
    expect(all).toEqual([]);
  });
});

describe("xTickProps", () => {
  it("pins explicit ticks with interval 0", () => {
    expect(xTickProps(["Mon", "Tue"])).toEqual({ ticks: ["Mon", "Tue"], interval: 0 });
  });

  it("falls back to preserveStartEnd without explicit ticks", () => {
    expect(xTickProps(undefined)).toEqual({ interval: "preserveStartEnd", minTickGap: 32 });
    expect(xTickProps([])).toEqual({ interval: "preserveStartEnd", minTickGap: 32 });
  });
});

describe("buildRows", () => {
  it("zips labels with per-series keys, zero-filling gaps", () => {
    const rows = buildRows(["a", "b"], [series([1]), series([3, 4])]);
    expect(rows).toEqual([
      { label: "a", s0: 1, s1: 3 },
      { label: "b", s0: 0, s1: 4 },
    ]);
  });
});
