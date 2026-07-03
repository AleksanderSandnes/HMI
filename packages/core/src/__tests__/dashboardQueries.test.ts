import { describe, expect, it, vi } from "vitest";

import {
  dashboardDates,
  dashboardQueries,
  type DashboardQueryDeps,
} from "../utils/dashboardQueries";

function makeDeps(): DashboardQueryDeps {
  return {
    growatt: { fetchSolarData: vi.fn().mockResolvedValue("solar") },
    weather: {
      getCurrentWeatherData: vi.fn().mockResolvedValue("current"),
      getWeeklyHourlyWeatherData: vi.fn().mockResolvedValue("weekly"),
    },
  } as unknown as DashboardQueryDeps;
}

describe("dashboardDates", () => {
  it("returns today and yesterday as ISO dates from the injected clock", () => {
    const { today, yesterday } = dashboardDates(new Date("2026-03-01T12:00:00Z"));
    expect(today).toBe("2026-03-01");
    expect(yesterday).toBe("2026-02-28");
  });
});

describe("dashboardQueries", () => {
  const deps = makeDeps();
  const q = dashboardQueries(deps, "2026-03-01", "2026-02-28");

  it("keys each query on its date", () => {
    expect(q.solar.queryKey).toEqual(["dashboard-solar", "2026-03-01"]);
    expect(q.solarWeek.queryKey).toEqual(["dashboard-solar-week", "2026-02-28"]);
    expect(q.weatherCurrent.queryKey).toEqual(["dashboard-weather"]);
    expect(q.weatherWeek.queryKey).toEqual(["dashboard-weather-week", "2026-02-28"]);
  });

  it("delegates queryFns to the injected apis", async () => {
    await q.solar.queryFn();
    expect(deps.growatt.fetchSolarData).toHaveBeenCalledWith("hourly", "2026-03-01");
    await q.solarWeek.queryFn();
    expect(deps.growatt.fetchSolarData).toHaveBeenCalledWith("weekly", "2026-02-28");
    await q.weatherWeek.queryFn();
    expect(deps.weather.getWeeklyHourlyWeatherData).toHaveBeenCalledWith("20260228");
  });

  it("keeps solar cached indefinitely and current weather on a 60s cycle", () => {
    expect(q.solar.staleTime).toBe(Infinity);
    expect(q.weatherCurrent.refetchInterval).toBe(60_000);
    expect(q.weatherCurrent.staleTime).toBe(60_000);
    expect(q.weatherWeek.staleTime).toBe(30 * 60_000);
  });
});
