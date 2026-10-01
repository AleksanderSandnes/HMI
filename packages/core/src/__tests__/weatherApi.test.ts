import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoreApiContext } from "../api/context";
import { createWeatherApi } from "../api/weather";

function fixture(cache: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: cache });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  const invoke = vi.fn().mockResolvedValue({ data: { observations: [{ temperature: 12 }] } });
  const api = createWeatherApi({
    supabase: { from, functions: { invoke } },
  } as unknown as CoreApiContext);
  return { api, invoke, eq, maybeSingle };
}

afterEach(() => vi.useRealTimers());

describe("weather cache freshness and fallback", () => {
  it("serves a completed day without calling the upstream function", async () => {
    const { api, invoke, eq } = fixture({ observations: [{ temperature: 7 }] });
    await expect(api.getHistoricalWeatherData("20200101")).resolves.toEqual({
      observations: [{ temperature: 7 }],
    });
    expect(eq).toHaveBeenCalledWith("date", "20200101");
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each(["20260930", "20260929"])("serves fresh live-day cache for %s", async (date) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12));
    const { api, invoke } = fixture({
      observations: [],
      cached_at: new Date(Date.now() - 299999).toISOString(),
    });
    await expect(api.getHourlyWeatherData(date)).resolves.toEqual({ observations: [] });
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each([undefined, "invalid", new Date(2026, 8, 30, 11, 55).toISOString()])(
    "refreshes live observations with stale or unusable cache timestamp %s",
    async (cachedAt) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 30, 12));
      const { api, invoke } = fixture({ observations: [{ temperature: 1 }], cached_at: cachedAt });
      await expect(api.getHistoricalWeatherData("20260930")).resolves.toEqual({
        observations: [{ temperature: 12 }],
      });
      expect(invoke).toHaveBeenCalledWith("weather-history", { body: { date: "20260930" } });
    },
  );

  it("returns an empty historical result when the fallback fails or has no observations", async () => {
    const { api, invoke } = fixture();
    invoke
      .mockResolvedValueOnce({ error: new Error("offline") })
      .mockResolvedValueOnce({ data: null });
    await expect(api.getHistoricalWeatherData("20200101")).resolves.toEqual({ observations: [] });
    await expect(api.getHourlyWeatherData("20200102")).resolves.toEqual({ observations: [] });
  });

  it("propagates current-condition failures rather than presenting success", async () => {
    const { api, invoke } = fixture();
    invoke
      .mockResolvedValueOnce({ data: { temperature: 14 } })
      .mockResolvedValueOnce({ error: { message: "unavailable" } });
    await expect(api.getCurrentWeatherData()).resolves.toEqual({ temperature: 14 });
    await expect(api.getCurrentWeatherData()).rejects.toThrow("unavailable");
    expect(invoke).toHaveBeenCalledWith("weather-current");
  });

  it("aggregates seven days in chronological order for both weekly contracts", async () => {
    const { api, maybeSingle, eq } = fixture();
    for (let day = 1; day <= 7; day++)
      maybeSingle.mockResolvedValueOnce({ data: { observations: [{ day }] } });
    const expected = Array.from({ length: 7 }, (_, index) => ({ day: index + 1 }));
    const dates = Array.from({ length: 7 }, (_, index) => `2020010${index + 1}`);
    await expect(api.getWeeklyWeatherData("20200107")).resolves.toEqual({
      observations: expected,
      weekDates: dates,
    });
    expect(eq.mock.calls.map((call) => call[1])).toEqual(dates);
    for (let day = 1; day <= 7; day++)
      maybeSingle.mockResolvedValueOnce({ data: { observations: [{ day }] } });
    await expect(api.getWeeklyHourlyWeatherData("20200107")).resolves.toEqual({
      weeklyData: expected,
      observations: expected,
      weekDates: dates,
      selectedDate: "20200107",
    });
  });
});
