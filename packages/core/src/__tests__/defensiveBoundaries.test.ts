import { describe, expect, it, vi } from "vitest";
import * as Yup from "yup";

import { getTranslator, translate } from "../i18n";
import { nb } from "../i18n/nb";
import type { SolarData } from "../types/solar";
import { weatherYDomain } from "../utils/chart";
import { parseYMD, toYMD } from "../utils/date";
import { buildAggregatedLabels } from "../utils/growattApiHelpers";
import { getPeakOutput, periodLabel, solarCapValues } from "../utils/solarStats";
import { buildWeatherDailyBands, buildWeatherSeries } from "../utils/weatherSeries";
import { createRegisterAccountSchema, validateRegisterAccount } from "../validation/auth";

describe("date and solar metadata boundaries", () => {
  it("defaults omitted month/day components to January and the first", () => {
    expect(toYMD(parseYMD("2026"))).toBe("2026-01-01");
  });

  it("preserves provider labels when dates or calendar-month indices are unavailable", () => {
    expect(buildAggregatedLabels("weekly", 1, ["not-a-date"])).toEqual(["not-a-date"]);
    expect(buildAggregatedLabels("yearly", 13).at(-1)).toBe("13");
    expect(periodLabel("monthly")).toBe("This month");
  });

  it("formats a peak without a timestamp rather than displaying undefined", () => {
    const chartData = {
      labels: [],
      datasets: [{ data: [100], color: vi.fn().mockReturnValue("#000000"), strokeWidth: 2 }],
    };
    expect(getPeakOutput(chartData, "hourly")).toEqual({ value: 100, label: "", unit: "W" });
    const solar: SolarData = {
      chartData,
      metrics: { todayGeneration: 1, totalGeneration: 10, todayRevenue: 1, totalRevenue: 10 },
    };
    expect(solarCapValues(solar, "hourly").peakText).toBe("100 W");
  });

  it("keeps a positive chart range even when extreme negative values lose unit precision", () => {
    expect(weatherYDomain([-1e20]).range).toBeGreaterThan(0);
  });
});

describe("partial weather observations", () => {
  it("falls back to temperature for unknown metrics", () => {
    expect(
      buildWeatherSeries([{ tempHigh: 8, dewptHigh: 4 }], "future-metric", "hourly").series,
    ).toEqual([[8], [4]]);
  });

  it("accepts date-only observations for weekly views and ignores invalid daily dates", () => {
    const observations = [
      { date: "2026-09-30 00:00:00", tempHigh: 8 },
      { date: "invalid", tempHigh: 100 },
    ];
    expect(buildWeatherSeries(observations, "temperature", "weekly").labels).toEqual(["Wed 9/30"]);
    expect(buildWeatherDailyBands(observations, "temperature").max).toEqual([8]);
  });

  it("rounds late-hour readings across midnight", () => {
    expect(
      buildWeatherSeries(
        [{ obsTimeLocal: "2026-09-30 23:59:00", tempHigh: 8 }],
        "temperature",
        "hourly",
      ).labels,
    ).toEqual(["00:00"]);
  });
});

describe("partial localization catalogs", () => {
  it("preserves unresolved placeholders", () => {
    expect(translate("en", "time.minutesAgo", {})).toBe("{m}m ago");
  });

  it("falls back to English when a localized entry is absent", () => {
    const original = Object.getOwnPropertyDescriptor(nb, "time.minutesAgo")!;
    Object.defineProperty(nb, "time.minutesAgo", { configurable: true, get: () => undefined });
    try {
      expect(translate("nb", "time.minutesAgo", { m: 5 })).toBe("5m ago");
    } finally {
      Object.defineProperty(nb, "time.minutesAgo", original);
    }
  });
});

describe("registration validator failures", () => {
  const valid = {
    email: "demo@example.test",
    password: "fixture-password",
    confirmPassword: "fixture-password",
  };

  it("propagates unexpected validator failures rather than treating input as valid", () => {
    const schema = createRegisterAccountSchema(getTranslator("en"));
    const failure = new Error("validator unavailable");
    vi.spyOn(schema, "validateSync").mockImplementationOnce(() => {
      throw failure;
    });
    expect(() => validateRegisterAccount(valid, schema)).toThrow(failure);
  });

  it("retains the first field message and ignores errors that have no field path", () => {
    const schema = createRegisterAccountSchema(getTranslator("en"))
      .shape({ email: Yup.string().required("Email required").min(3, "Email too short") })
      .test("root-error", "Root error", () => false);
    expect(validateRegisterAccount({ ...valid, email: "" }, schema)).toEqual({
      email: "Email required",
    });
  });
});
