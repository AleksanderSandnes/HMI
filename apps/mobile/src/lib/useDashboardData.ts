import {
  dashboardWeekAverages,
  lastPositive,
  solarDevice,
  solarMetrics,
  toISO,
  weatherNow,
  type CurrentWeather,
  type SolarData,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCore } from "./useCore";

/**
 * Dashboard data: today's hourly solar + weekly totals, live current weather
 * (60s), and weekly weather averages. Shapes everything through the shared
 * @hmi/core selectors so the Focus dashboard just renders the result.
 */
export function useDashboardData() {
  const { growatt, weather } = useCore();
  const today = toISO(new Date());
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toISO(d);
  }, []);

  const { data: solar, isLoading: solarLoading } = useQuery<SolarData>({
    queryKey: ["dashboard-solar", today],
    queryFn: () => growatt.fetchSolarData("hourly", today),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const { data: solarWeek } = useQuery<SolarData>({
    queryKey: ["dashboard-solar-week", yesterday],
    queryFn: () => growatt.fetchSolarData("weekly", yesterday),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const { data: weatherData, isLoading: weatherLoading } = useQuery<CurrentWeather>({
    queryKey: ["dashboard-weather"],
    queryFn: () => weather.getCurrentWeatherData(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });
  const { data: weekObs } = useQuery({
    queryKey: ["dashboard-weather-week", yesterday],
    queryFn: () => weather.getWeeklyHourlyWeatherData(yesterday.replaceAll("-", "")),
    staleTime: 30 * 60_000,
  });

  const wkAvg = useMemo(() => dashboardWeekAverages(weekObs), [weekObs]);
  const sparkline = useMemo(() => solar?.chartData?.datasets?.[0]?.data ?? [], [solar]);
  const currentPower = useMemo(() => lastPositive(sparkline), [sparkline]);

  return {
    solarLoading,
    wxLoading: weatherLoading && !weatherData,
    currentPower,
    sparkline,
    wkAvg,
    ...solarMetrics(solar, solarWeek),
    ...solarDevice(solar, currentPower),
    ...weatherNow(weatherData),
  };
}

export type DashboardModel = ReturnType<typeof useDashboardData>;

export default useDashboardData;
