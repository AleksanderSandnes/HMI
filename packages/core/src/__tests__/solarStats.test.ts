import { describe, expect, it } from "vitest";

import type { SolarData } from "../types/solar";
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
  kwLabel,
  solarCapValues,
  solarTotalKwh,
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

describe("kwLabel", () => {
  it("formats watts as kW with two decimals under 10 kW", () => {
    expect(kwLabel(0)).toBe("0.00");
    expect(kwLabel(2450)).toBe("2.45");
  });

  it("drops to one decimal from 10 kW", () => {
    expect(kwLabel(10_900)).toBe("10.9");
  });

  it("shows an em dash for missing values", () => {
    expect(kwLabel(null)).toBe("—");
    expect(kwLabel(undefined)).toBe("—");
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

function makeSolar(data: number[], labels: string[], todayGeneration = 0): SolarData {
  return {
    chartData: { labels, datasets: [{ data, color: () => "#000", strokeWidth: 1 }] },
    metrics: { todayGeneration, totalGeneration: 0, todayRevenue: 0, totalRevenue: 0 },
  };
}

describe("solarTotalKwh", () => {
  it("uses the today metric for the hourly timespan", () => {
    expect(solarTotalKwh(makeSolar([500, 900], ["10", "11"], 12.3), "hourly")).toBe(12.3);
  });

  it("sums the dataset for aggregated timespans, ignoring gaps", () => {
    expect(solarTotalKwh(makeSolar([1, 2, 0, 4], ["a", "b", "c", "d"]), "weekly")).toBe(7);
  });

  it("returns 0 without data", () => {
    expect(solarTotalKwh(undefined, "weekly")).toBe(0);
  });
});

describe("solarCapValues", () => {
  it("reports no data for an empty dataset", () => {
    expect(solarCapValues(makeSolar([], []), "hourly").hasData).toBe(false);
    expect(solarCapValues(undefined, "hourly").hasData).toBe(false);
  });

  it("labels the caps per timespan with a fallback", () => {
    expect(solarCapValues(makeSolar([1], ["a"]), "weekly").labels).toEqual([
      "solar.cap.peakDay",
      "solar.cap.weekTotal",
    ]);
    expect(solarCapValues(makeSolar([1], ["a"]), "bogus").labels).toEqual([
      "solar.cap.peak",
      "solar.cap.total",
    ]);
  });

  it("formats the peak with its label and k-scaled unit", () => {
    const c = solarCapValues(makeSolar([200, 10_900], ["09:00", "12:00"], 5), "hourly");
    expect(c.peakText).toBe("12:00 · 10.9 kW");
    expect(c.totalText).toBe("5.0 kWh");
  });

  it("shows an em dash for a peakless (all-zero) dataset", () => {
    expect(solarCapValues(makeSolar([0, 0], ["a", "b"]), "weekly").peakText).toBe("—");
  });

  it("k-scales the aggregated total into MWh", () => {
    const c = solarCapValues(makeSolar([800, 700], ["Jan", "Feb"]), "yearly");
    expect(c.totalText).toBe("1.5 MWh");
  });
});
