import { describe, expect, it } from "vitest";

import { WEATHER_METRICS, WEATHER_TIME_OPTIONS } from "../utils/weatherMetrics";

describe("WEATHER_METRICS", () => {
  it("has the seven metrics with unique keys", () => {
    expect(WEATHER_METRICS).toHaveLength(7);
    expect(new Set(WEATHER_METRICS.map((m) => m.key)).size).toBe(7);
  });

  it("gives every metric at least one series and dual series for temperature", () => {
    for (const m of WEATHER_METRICS) expect(m.series.length).toBeGreaterThan(0);
    expect(WEATHER_METRICS.find((m) => m.key === "temperature")?.series).toHaveLength(2);
  });
});

describe("WEATHER_TIME_OPTIONS", () => {
  it("offers hourly and weekly", () => {
    expect(WEATHER_TIME_OPTIONS.map((o) => o.value)).toEqual(["hourly", "weekly"]);
  });
});
