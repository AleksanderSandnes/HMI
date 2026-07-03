import type { GrowattApi } from "../api/growatt";
import type { WeatherApi } from "../api/weather";

import { toISO } from "./solarStats";

// Dashboard react-query wiring shared by web and mobile. Returns plain
// option objects (queryKey/queryFn/staleTime/refetch flags) — valid useQuery
// input on both platforms without core depending on React.

export interface DashboardQueryDeps {
  growatt: Pick<GrowattApi, "fetchSolarData">;
  weather: Pick<WeatherApi, "getCurrentWeatherData" | "getWeeklyHourlyWeatherData">;
}

/** Today + yesterday as ISO dates, from an injectable clock. */
export function dashboardDates(now: Date = new Date()): { today: string; yesterday: string } {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return { today: toISO(now), yesterday: toISO(yesterday) };
}

export function dashboardQueries(deps: DashboardQueryDeps, today: string, yesterday: string) {
  return {
    solar: {
      queryKey: ["dashboard-solar", today],
      queryFn: () => deps.growatt.fetchSolarData("hourly", today),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
    solarWeek: {
      queryKey: ["dashboard-solar-week", yesterday],
      queryFn: () => deps.growatt.fetchSolarData("weekly", yesterday),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
    weatherCurrent: {
      queryKey: ["dashboard-weather"],
      queryFn: () => deps.weather.getCurrentWeatherData(),
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      staleTime: 60_000,
    },
    weatherWeek: {
      queryKey: ["dashboard-weather-week", yesterday],
      queryFn: () => deps.weather.getWeeklyHourlyWeatherData(yesterday.replaceAll("-", "")),
      staleTime: 30 * 60_000,
    },
  };
}
