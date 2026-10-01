import { describe, expect, it } from "vitest";

import { calculateMetrics, optimizeChartData } from "../utils/growattApiHelpers";
import { chartSubtitle, comparisonLabel, peakUnit } from "../utils/solarStats";

describe("solar period fallbacks", () => {
  it("uses monthly totals when available and calculates fallback generation otherwise", () => {
    expect(calculateMetrics([12000], "monthly", 2, { month: 50, total: 200 })).toEqual({
      todayGeneration: 50,
      totalGeneration: 200,
      todayRevenue: 100,
      totalRevenue: 400,
    });
    expect(calculateMetrics([12000], "monthly")).toEqual({
      todayGeneration: 1,
      totalGeneration: 1,
      todayRevenue: 1,
      totalRevenue: 1,
    });
  });

  it("preserves non-hourly sample labels and rounds early hourly samples down", () => {
    expect(optimizeChartData([100], ["06:15"], "weekly")).toEqual({
      data: [100],
      labels: ["06:15"],
    });
    expect(optimizeChartData([100], ["06:15"], "hourly")).toEqual({
      data: [100],
      labels: ["06:00"],
    });
    expect(optimizeChartData([100], ["06:00"], "hourly")).toEqual({
      data: [100],
      labels: ["06:00"],
    });
  });

  it("labels lifetime periods and preserves units without a defined scale", () => {
    expect(comparisonLabel("hourly")).toBe("vs yesterday");
    expect(comparisonLabel("weekly")).toBe("vs last week");
    expect(comparisonLabel("monthly")).toBe("vs last month");
    expect(comparisonLabel("yearly")).toBe("vs last year");
    expect(comparisonLabel("total")).toBe("vs prior 5 years");
    expect(chartSubtitle("total", "2026-09-30")).toBe("Yearly output · last 5 years");
    expect(peakUnit(2000, "unknown")).toBe("unknown");
  });
});
