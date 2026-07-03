import { describe, expect, it } from "vitest";

import { hasNoData, readSolar, solarModel } from "@/components/charts/SolarChart";

describe("readSolar", () => {
  it("extracts values and labels, tolerating missing pieces", () => {
    expect(readSolar({ labels: ["a", "b"], datasets: [{ data: [1, 2] }] })).toEqual({
      values: [1, 2],
      labels: ["a", "b"],
    });
    expect(readSolar({ labels: [], datasets: [] })).toEqual({ values: [], labels: [] });
  });
});

describe("hasNoData", () => {
  it("is true for empty or all-zero series", () => {
    expect(hasNoData([])).toBe(true);
    expect(hasNoData([0, 0, 0])).toBe(true);
  });

  it("is false when any value is non-zero", () => {
    expect(hasNoData([0, 5, 0])).toBe(false);
  });
});

describe("solarModel", () => {
  it("finds the peak and pads the y-axis by 15%", () => {
    const m = solarModel([100, 900, 300], ["09", "12", "15"]);
    expect(m.max).toBe(900);
    expect(m.peakIndex).toBe(1);
    expect(m.peakLabel).toBe("12");
    expect(m.yMax).toBeCloseTo(1035);
  });

  it("pairs values with labels, defaulting missing labels", () => {
    const m = solarModel([1, 2], ["only-one"]);
    expect(m.chartData).toEqual([
      { label: "only-one", value: 1 },
      { label: "", value: 2 },
    ]);
  });

  it("uses a unit y-max when nothing is positive", () => {
    expect(solarModel([0, 0], ["a", "b"]).yMax).toBe(1);
  });
});
