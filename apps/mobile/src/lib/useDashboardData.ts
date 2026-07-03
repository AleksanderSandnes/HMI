import {
  dashboardDates,
  dashboardQueries,
  dashboardWeekAverages,
  lastPositive,
  solarDevice,
  solarMetrics,
  weatherNow,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCore } from "./useCore";

/**
 * Dashboard data: today's hourly solar + weekly totals, live current weather
 * (60s), and weekly weather averages. Query wiring + selectors come from
 * @hmi/core so web and mobile stay in lockstep.
 */
export function useDashboardData() {
  const { growatt, weather } = useCore();
  const { today, yesterday } = dashboardDates();
  const q = useMemo(
    () => dashboardQueries({ growatt, weather }, today, yesterday),
    [growatt, weather, today, yesterday],
  );

  const { data: solar, isLoading: solarLoading } = useQuery(q.solar);
  const { data: solarWeek } = useQuery(q.solarWeek);
  const { data: weatherData, isLoading: weatherLoading } = useQuery(q.weatherCurrent);
  const { data: weekObs } = useQuery(q.weatherWeek);

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
