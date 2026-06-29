import { describe, expect, it } from "vitest";
import {
  comparisonLabel,
  formatCO2,
  formatMetric,
  formatNum,
  formatPeak,
  getPeakOutput,
  percentDelta,
  periodLabel,
  previousPeriodDate,
} from "../utils/solarStats";

describe("formatNum", () => {
  it("formats thousands and millions", () => {
    expect(formatNum(950)).toBe("950");
    expect(formatNum(1500)).toBe("1.5k");
    expect(formatNum(15000)).toBe("15k");
    expect(formatNum(2_500_000)).toBe("2.5M");
  });
});

describe("formatCO2", () => {
  it("uses kg below 1000 and tonnes above", () => {
    expect(formatCO2(5)).toEqual({ value: "5.0", unit: "kg" });
    expect(formatCO2(50)).toEqual({ value: "50", unit: "kg" });
    expect(formatCO2(2000)).toEqual({ value: "2.00", unit: "t" });
  });
});

describe("formatPeak", () => {
  it("scales kilo values", () => {
    expect(formatPeak(5)).toBe("5.0");
    expect(formatPeak(1500)).toBe("1.5");
  });
});

describe("previousPeriodDate", () => {
  it("steps back by the right unit", () => {
    expect(previousPeriodDate("hourly", "2026-06-10")).toBe("2026-06-09");
    expect(previousPeriodDate("weekly", "2026-06-10")).toBe("2026-06-03");
    expect(previousPeriodDate("monthly", "2026-06-10")).toBe("2026-05-10");
    expect(previousPeriodDate("yearly", "2026-06-10")).toBe("2025-06-10");
    expect(previousPeriodDate("total", "2026-06-10")).toBe("2021-06-10");
  });
});

describe("labels", () => {
  it("maps period + comparison labels", () => {
    expect(periodLabel("hourly")).toBe("Today");
    expect(periodLabel("yearly")).toBe("This year");
    expect(periodLabel("total")).toBe("Last 5 years");
    expect(comparisonLabel("weekly")).toBe("vs last week");
    expect(comparisonLabel("total")).toBe("vs prior 5 years");
  });
});

describe("getPeakOutput", () => {
  it("finds the max value, its label and unit", () => {
    const data = { labels: ["a", "b", "c"], datasets: [{ data: [1, 9, 3] }] };
    expect(getPeakOutput(data, "hourly")).toEqual({
      value: 9,
      label: "b",
      unit: "W",
    });
    expect(getPeakOutput(data, "weekly")?.unit).toBe("kWh");
  });

  it("returns null for empty or all-zero data", () => {
    expect(getPeakOutput({ labels: [], datasets: [{ data: [] }] }, "hourly")).toBeNull();
    expect(
      getPeakOutput({ labels: ["a"], datasets: [{ data: [0] }] }, "hourly")
    ).toBeNull();
  });
});

describe("percentDelta", () => {
  it("computes percentage change", () => {
    expect(percentDelta(150, 100)).toBe(50);
    expect(percentDelta(80, 100)).toBe(-20);
  });
  it("returns null when prev is non-positive", () => {
    expect(percentDelta(10, 0)).toBeNull();
    expect(percentDelta(10, -5)).toBeNull();
  });
});

describe("formatMetric", () => {
  it("adds more precision for small ranges", () => {
    expect(formatMetric(1.234, 1)).toBe("1.23");
    expect(formatMetric(1.234, 5)).toBe("1.2");
    expect(formatMetric(42.6, 30)).toBe("43");
    expect(formatMetric(1500, 50)).toBe("1.5k");
    expect(formatMetric(1500, 200)).toBe("1500");
  });
});
