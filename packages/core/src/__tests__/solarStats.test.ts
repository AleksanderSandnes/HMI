import { describe, expect, it } from "vitest";

import {
  chartSubtitle,
  comparisonLabel,
  formatCO2,
  formatMetric,
  formatNum,
  formatPeak,
  getPeakOutput,
  peakSublabel,
  peakUnit,
  percentDelta,
  periodLabel,
  previousPeriodDate,
  toISO,
} from "../utils/solarStats";

describe("toISO", () => {
  it("formats a Date as a yyyy-MM-dd string", () => {
    expect(toISO(new Date("2026-06-30T12:34:56Z"))).toBe("2026-06-30");
  });
});

describe("chartSubtitle", () => {
  // Noon-local so the date components are timezone-stable across CI runners.
  const date = "2026-06-10T12:00:00";
  it("describes each timespan", () => {
    expect(chartSubtitle("hourly", date)).toBe("Power output · Jun 10");
    expect(chartSubtitle("weekly", date)).toBe("7-day output from June 10");
    expect(chartSubtitle("monthly", date)).toBe("Daily output · June 2026");
    expect(chartSubtitle("total", date)).toBe("Yearly output · last 5 years");
    expect(chartSubtitle("yearly", date)).toBe("Monthly output · 2026");
  });
});

describe("peakSublabel", () => {
  it("phrases the peak 'when' per timespan", () => {
    expect(peakSublabel("hourly", "13:00")).toBe("at 13:00");
    expect(peakSublabel("weekly", "Wed")).toBe("on Wednesday");
    expect(peakSublabel("monthly", "12")).toBe("on day 12");
    expect(peakSublabel("total", "2024")).toBe("in 2024");
    expect(peakSublabel("yearly", "Jul")).toBe("in July");
  });

  it("falls back to the raw label for unknown day/month codes", () => {
    expect(peakSublabel("weekly", "Xyz")).toBe("on Xyz");
    expect(peakSublabel("yearly", "Xyz")).toBe("in Xyz");
  });

  it("returns 'No data' for an empty label", () => {
    expect(peakSublabel("hourly", "")).toBe("No data");
  });
});

describe("peakUnit", () => {
  it("matches formatPeak's k-scaling", () => {
    expect(peakUnit(137, "W")).toBe("W");
    expect(peakUnit(10900, "W")).toBe("kW");
    expect(peakUnit(540, "kWh")).toBe("kWh");
    expect(peakUnit(1500, "kWh")).toBe("MWh");
  });
});

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
    expect(getPeakOutput({ labels: ["a"], datasets: [{ data: [0] }] }, "hourly")).toBeNull();
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
