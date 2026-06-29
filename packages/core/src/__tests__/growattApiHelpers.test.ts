import { describe, expect, it } from "vitest";
import {
  buildAggregatedLabels,
  calculateMetrics,
  cleanPowerData,
  generateTimeLabels,
} from "../utils/growattApiHelpers";

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
});

describe("calculateMetrics", () => {
  it("prefers API totals when provided", () => {
    const m = calculateMetrics([0, 0], "hourly", 1, 100, 5);
    expect(m.totalGeneration).toBe(100);
    expect(m.todayGeneration).toBe(5);
  });
  it("falls back to computed kWh from 5-min power samples", () => {
    // 12 samples of 1000W → sum 12000, /12 = 1000 Wh, /1000 = 1 kWh
    const m = calculateMetrics(new Array(12).fill(1000), "hourly");
    expect(m.todayGeneration).toBeCloseTo(1);
  });
});
