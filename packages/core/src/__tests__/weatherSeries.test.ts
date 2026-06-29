import { describe, expect, it } from "vitest";
import { buildWeatherSeries } from "../utils/weatherSeries";

const hourly = [
  { obsTimeLocal: "2026-06-10 06:00:00", metric: { tempAvg: 10, dewptAvg: 5 } },
  { obsTimeLocal: "2026-06-10 07:00:00", metric: { tempAvg: 12, dewptAvg: 6 } },
];

describe("buildWeatherSeries (hourly)", () => {
  it("extracts two temperature series with HH:MM labels", () => {
    const { labels, series } = buildWeatherSeries(hourly, "temperature", "hourly");
    expect(labels).toEqual(["06:00", "07:00"]);
    expect(series).toHaveLength(2);
    expect(series[0]).toEqual([10, 12]); // temperature
    expect(series[1]).toEqual([5, 6]); // dew point
  });

  it("single-series metrics read top-level fields", () => {
    const data = [
      { obsTimeLocal: "2026-06-10 12:00:00", solarRadiationHigh: 800 },
      { obsTimeLocal: "2026-06-10 13:00:00", solarRadiationHigh: 750 },
    ];
    const { series } = buildWeatherSeries(data, "solarRadiation", "hourly");
    expect(series).toHaveLength(1);
    expect(series[0]).toEqual([800, 750]);
  });

  it("missing values fall back to 0", () => {
    const { series } = buildWeatherSeries(
      [{ obsTimeLocal: "2026-06-10 06:00:00", metric: {} }],
      "temperature",
      "hourly"
    );
    expect(series[0]).toEqual([0]);
  });
});

describe("buildWeatherSeries (weekly)", () => {
  it("samples every 3 hours", () => {
    const week = Array.from({ length: 24 }, (_, h) => ({
      obsTimeLocal: `2026-06-08 ${String(h).padStart(2, "0")}:00:00`,
      metric: { tempAvg: h },
    }));
    const { series } = buildWeatherSeries(week, "temperature", "weekly");
    // 24 hourly points → sampled at 0,3,6,...,21 = 8 points
    expect(series[0]).toEqual([0, 3, 6, 9, 12, 15, 18, 21]);
  });

  it("labels the midnight sample with day + date", () => {
    const week = Array.from({ length: 24 }, (_, h) => ({
      obsTimeLocal: `2026-06-08 ${String(h).padStart(2, "0")}:00:00`,
      metric: { tempAvg: h },
    }));
    const { labels } = buildWeatherSeries(week, "temperature", "weekly");
    // 2026-06-08 is a Monday
    expect(labels[0]).toBe("Mon 6/8");
  });
});

describe("buildWeatherSeries (empty)", () => {
  it("returns empty labels and one empty series per extractor", () => {
    const { labels, series } = buildWeatherSeries([], "windSpeed", "hourly");
    expect(labels).toEqual([]);
    expect(series).toEqual([[], []]);
  });
});
