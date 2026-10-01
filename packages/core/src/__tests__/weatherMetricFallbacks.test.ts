import { describe, expect, it } from "vitest";

import { buildWeatherSeries } from "../utils/weatherSeries";

describe("weather metric compatibility", () => {
  it.each([
    ["windSpeed", { metric: { windspeedAvg: "12", windgustAvg: "18" } }, [12, 18]],
    ["windSpeed", { metric: { windspeedHigh: 14, windgustHigh: 20 } }, [14, 20]],
    ["windSpeed", { windspeedHigh: 16, windgustHigh: 22 }, [16, 22]],
    ["precip", { metric: { precipTotal: 3, precipRate: 2 } }, [3, 2]],
    ["precip", { precipTotal: 4, precipRate: 1 }, [4, 1]],
    ["pressure", { metric: { pressureMax: 1012 } }, [1012]],
    ["pressure", { pressureMax: 1010 }, [1010]],
    ["pressure", { pressureHigh: 1008 }, [1008]],
    ["humidity", { humidityAvg: 65 }, [65]],
    ["humidity", { humidityHigh: 70 }, [70]],
    ["humidity", { humidity: 60 }, [60]],
    ["uvIndex", { uvHigh: 5 }, [5]],
    ["temperature", { metric: { tempHigh: 20, dewptHigh: 10 } }, [20, 10]],
    ["temperature", { tempHigh: 19, dewptHigh: 9 }, [19, 9]],
  ] as const)("extracts %s from available provider fields", (metric, observation, expected) => {
    const result = buildWeatherSeries(
      [{ obsTimeLocal: "2026-09-30 12:00:00", ...observation }],
      metric,
      "hourly",
    );
    expect(result.series.map((series) => series[0])).toEqual(expected);
  });

  it.each([
    "windSpeed",
    "precip",
    "pressure",
    "humidity",
    "uvIndex",
    "solarRadiation",
    "temperature",
  ])("uses zero for missing or non-numeric %s measurements", (metric) => {
    const result = buildWeatherSeries(
      [{ metric: {}, uvHigh: "invalid", solarRadiationHigh: NaN }],
      metric,
      "hourly",
    );
    expect(result.series.every((series) => series[0] === 0)).toBe(true);
    expect(result.labels).toEqual([""]);
  });
});
