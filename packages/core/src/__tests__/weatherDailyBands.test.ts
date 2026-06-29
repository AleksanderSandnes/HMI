import { describe, expect, it } from "vitest";
import { buildWeatherDailyBands } from "../utils/weatherSeries";

// Two calendar days of temperature readings (Wed 2026-06-10, Thu 2026-06-11).
const obs = [
  { obsTimeLocal: "2026-06-10 06:00:00", metric: { tempAvg: 10 } },
  { obsTimeLocal: "2026-06-10 12:00:00", metric: { tempAvg: 20 } },
  { obsTimeLocal: "2026-06-10 18:00:00", metric: { tempAvg: 15 } },
  { obsTimeLocal: "2026-06-11 06:00:00", metric: { tempAvg: 8 } },
  { obsTimeLocal: "2026-06-11 12:00:00", metric: { tempAvg: 12 } },
];

describe("buildWeatherDailyBands", () => {
  it("returns empty arrays for no observations", () => {
    expect(buildWeatherDailyBands([], "temperature")).toEqual({
      labels: [],
      min: [],
      max: [],
      avg: [],
    });
  });

  it("collapses readings into per-day min/max/avg of the primary metric", () => {
    const b = buildWeatherDailyBands(obs, "temperature");
    expect(b.labels).toEqual(["Wed", "Thu"]);
    expect(b.min).toEqual([10, 8]);
    expect(b.max).toEqual([20, 12]);
    expect(b.avg[0]).toBeCloseTo(15, 5); // (10+20+15)/3
    expect(b.avg[1]).toBeCloseTo(10, 5); // (8+12)/2
  });

  it("keeps only the last 7 days, oldest → newest", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      obsTimeLocal: `2026-06-${String(i + 1).padStart(2, "0")} 12:00:00`,
      metric: { tempAvg: i },
    }));
    const b = buildWeatherDailyBands(many, "temperature");
    expect(b.labels).toHaveLength(7);
    // Days 04..10 survive; their single value equals the index 3..9.
    expect(b.avg).toEqual([3, 4, 5, 6, 7, 8, 9]);
  });

  it("falls back to the temperature extractor for an unknown metric", () => {
    const b = buildWeatherDailyBands(obs, "nonsense");
    expect(b.labels).toEqual(["Wed", "Thu"]);
    expect(b.avg[0]).toBeCloseTo(15, 5);
  });
});
