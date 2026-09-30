import { dashboardDates, type SolarData } from "@hmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboardData } from "@/lib/hooks/useDashboardData";

const api = vi.hoisted(() => ({ solar: vi.fn(), current: vi.fn(), week: vi.fn() }));
vi.mock("@/lib/hooks/useCore", () => ({
  useCore: () => ({
    growatt: { fetchSolarData: api.solar },
    weather: { getCurrentWeatherData: api.current, getWeeklyHourlyWeatherData: api.week },
  }),
}));
let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const solar: SolarData = {
  chartData: {
    labels: ["06:00", "12:00", "18:00"],
    datasets: [{ data: [100, 900, 300], color: () => "#fff", strokeWidth: 2 }],
  },
  metrics: { todayGeneration: 5, totalGeneration: 1200, todayRevenue: 0, totalRevenue: 0 },
  device: { capacity: 3000, plantName: "Fictional roof" },
};
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  api.solar.mockResolvedValue(solar);
  api.current.mockResolvedValue({
    observations: [{ humidity: 60, metric: { temp: 10, windChill: 8 } }],
  });
  api.week.mockResolvedValue({
    observations: [
      { obsTimeLocal: "2026-09-28 12:00:00", metric: { tempAvg: 10 }, humidityAvg: 50 },
      { obsTimeLocal: "2026-09-29 12:00:00", metric: { tempAvg: 20 }, humidityAvg: 70 },
    ],
  });
});
afterEach(() => {
  cleanup();
  client.clear();
});

describe("dashboard query integration", () => {
  it("renders loading defaults, then combines independent solar and weather results", async () => {
    const { result } = renderHook(useDashboardData, { wrapper });
    expect(result.current.solarLoading).toBe(true);
    expect(result.current.wxLoading).toBe(true);
    expect(result.current.sparkline).toEqual([]);
    await waitFor(() => expect(result.current.wkAvg.temp).toBe(15));
    expect(result.current).toMatchObject({
      solarLoading: false,
      wxLoading: false,
      currentPower: 300,
      capacityKw: 3,
      utilisation: 10,
      todayGen: 5,
      lifetime: 1200,
      feelsLike: 8,
      sparkline: [100, 900, 300],
      wkAvg: { humidity: 60 },
    });
    const { today, yesterday } = dashboardDates();
    expect(api.solar).toHaveBeenCalledWith("hourly", today);
    expect(api.solar).toHaveBeenCalledWith("weekly", yesterday);
    expect(api.week).toHaveBeenCalledWith(yesterday.replaceAll("-", ""));
  });

  it("stops loading and keeps safe empty values when providers fail", async () => {
    api.solar.mockRejectedValue(new Error("Solar unavailable"));
    api.current.mockRejectedValue(new Error("Weather unavailable"));
    api.week.mockRejectedValue(new Error("Week unavailable"));
    const { result } = renderHook(useDashboardData, { wrapper });
    await waitFor(() =>
      expect(result.current.solarLoading || result.current.wxLoading).toBe(false),
    );
    expect(result.current).toMatchObject({
      currentPower: 0,
      sparkline: [],
      todayGen: null,
      lifetime: null,
      wkAvg: { temp: null },
    });
  });

  it("preserves cached weather without a loading flash when a refresh fails", async () => {
    const { result } = renderHook(useDashboardData, { wrapper });
    await waitFor(() => expect(result.current.feelsLike).toBe(8));
    api.current.mockRejectedValue(new Error("Refresh unavailable"));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["dashboard-weather"], exact: true });
    });
    expect(result.current.feelsLike).toBe(8);
    expect(result.current.wxLoading).toBe(false);
    expect(api.current).toHaveBeenCalledTimes(2);
  });
});
