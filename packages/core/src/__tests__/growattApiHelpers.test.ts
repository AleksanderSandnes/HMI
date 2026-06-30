import { describe, expect, it } from "vitest";

import {
  buildAggregatedLabels,
  calculateMetrics,
  cleanPowerData,
  generateTimeLabels,
  optimizeChartData,
} from "../utils/growattApiHelpers";

describe("optimizeChartData", () => {
  const labels = generateTimeLabels(); // 288 five-minute "HH:MM" labels

  it("returns a No-Data placeholder when nothing exceeds the 5W threshold", () => {
    const flat = new Array(288).fill(0);
    expect(optimizeChartData(flat, labels, "hourly")).toEqual({
      data: [0],
      labels: ["No Data"],
    });
  });

  it("treats sub-threshold noise (<=5W) as no data", () => {
    const noise = new Array(288).fill(3);
    expect(optimizeChartData(noise, labels, "hourly").labels).toEqual(["No Data"]);
  });

  it("trims leading/trailing zeros and samples once per hour with clean labels", () => {
    // Meaningful generation from 06:00 (index 72) to 18:00 (index 216).
    const power = new Array(288).fill(0);
    for (let i = 72; i <= 216; i++) power[i] = 1000;

    const { data, labels: outLabels } = optimizeChartData(power, labels, "hourly");

    // Data and labels stay aligned, and the window is far smaller than 288.
    expect(data).toHaveLength(outLabels.length);
    expect(data.length).toBeLessThan(20);
    // Hourly labels are rounded to clean "HH:00" hours.
    expect(outLabels.every((l) => /^\d{2}:00$/.test(l))).toBe(true);
    // The padded window starts ~30min before the first meaningful sample.
    expect(outLabels[0]).toBe("06:00");
    // Peak power is preserved within the sampled window.
    expect(Math.max(...data)).toBe(1000);
  });
});

describe("cleanPowerData", () => {
  it("coerces null/undefined/NaN to 0 and numbers through", () => {
    expect(cleanPowerData([1, null, undefined, NaN, "5"])).toEqual([1, 0, 0, 0, 5]);
  });
});

describe("generateTimeLabels", () => {
  it("produces 288 five-minute labels", () => {
    const labels = generateTimeLabels();
    expect(labels).toHaveLength(288);
    expect(labels[0]).toBe("00:00");
    expect(labels[1]).toBe("00:05");
    expect(labels[288 - 1]).toBe("23:55");
  });
});

describe("buildAggregatedLabels", () => {
  it("weekly maps ISO days to weekday names", () => {
    // 2026-06-08 is a Monday
    expect(buildAggregatedLabels("weekly", 2, ["2026-06-08", "2026-06-09"])).toEqual([
      "Mon",
      "Tue",
    ]);
  });
  it("yearly returns month abbreviations", () => {
    expect(buildAggregatedLabels("yearly", 3)).toEqual(["Jan", "Feb", "Mar"]);
  });
  it("monthly returns day numbers", () => {
    expect(buildAggregatedLabels("monthly", 3)).toEqual(["1", "2", "3"]);
  });
  it("total returns consecutive years ending on the current year", () => {
    const end = new Date().getFullYear();
    expect(buildAggregatedLabels("total", 5)).toEqual([
      `${end - 4}`,
      `${end - 3}`,
      `${end - 2}`,
      `${end - 1}`,
      `${end}`,
    ]);
  });
});

describe("calculateMetrics", () => {
  it("prefers API totals when provided", () => {
    const m = calculateMetrics([0, 0], "hourly", 1, { total: 100, today: 5 });
    expect(m.totalGeneration).toBe(100);
    expect(m.todayGeneration).toBe(5);
  });
  it("falls back to computed kWh from 5-min power samples", () => {
    // 12 samples of 1000W → sum 12000, /12 = 1000 Wh, /1000 = 1 kWh
    const m = calculateMetrics(new Array(12).fill(1000), "hourly");
    expect(m.todayGeneration).toBeCloseTo(1);
  });
});
