// Pure data-shaping helpers for the Home/Dashboard screen, shared by web
// (apps/web) and mobile (apps/mobile). The React Query wiring stays per-app
// (it differs by platform); only the loosely-typed payload → tile-model
// transforms live here so both apps render identical numbers and stay testable.

import type { SolarData } from "../types";

import { average } from "./format";
import { round } from "./format";
import { getPeakOutput } from "./solarStats";
import { buildWeatherSeries } from "./weatherSeries";

/** Wunderground "current conditions" observation metric block (metric units). */
export interface CurrentMetric {
  temp?: number;
  heatIndex?: number;
  dewpt?: number;
  windChill?: number;
  windSpeed?: number;
  windGust?: number;
  pressure?: number;
  precipRate?: number;
  precipTotal?: number;
}

export interface CurrentObs {
  humidity?: number;
  winddir?: number;
  uv?: number;
  solarRadiation?: number;
  obsTimeLocal?: string;
  metric?: CurrentMetric;
}

export interface CurrentWeather {
  observations?: CurrentObs[];
}

/** Week-of observations payload shape consumed by {@link dashboardWeekAverages}. */
export interface WeekObservations {
  observations?: Array<Record<string, unknown>>;
}

/** Solar generation/peak tile values from today's hourly + the week's solar data. */
export function solarMetrics(solar?: SolarData, solarWeek?: SolarData) {
  return {
    peak: solar ? getPeakOutput(solar.chartData, "hourly") : null,
    todayGen: solar?.metrics.todayGeneration ?? null,
    weekGen: solarWeek?.metrics.todayGeneration ?? null,
    lifetime: solar?.metrics.totalGeneration ?? null,
  };
}

/** Device + capacity/utilisation tile values for the current instantaneous power. */
export function solarDevice(solar: SolarData | undefined, currentPower: number) {
  const device = solar?.device;
  const capacityKw = device?.capacity ? round(device.capacity / 1000, 1) : null;
  const utilisation =
    device?.capacity && currentPower > 0
      ? Math.round((currentPower / device.capacity) * 100)
      : null;
  return { device, capacityKw, utilisation };
}

/** Latest observation + its metric block + a "feels like" fallback chain. */
export function weatherNow(weatherData?: CurrentWeather) {
  const obs = weatherData?.observations?.[0];
  const m: CurrentMetric = obs?.metric ?? {};
  const feelsLike = m.heatIndex ?? m.windChill ?? m.temp;
  return { obs, m, feelsLike };
}

/** Weekly average for each dashboard weather tile, derived from the week series. */
export function dashboardWeekAverages(weekObs?: WeekObservations) {
  const obs = weekObs?.observations ?? [];
  const avg = (key: string) => average(buildWeatherSeries(obs, key, "weekly").series[0] ?? []);
  return {
    temp: avg("temperature"),
    humidity: avg("humidity"),
    pressure: avg("pressure"),
    solar: avg("solarRadiation"),
    uv: avg("uvIndex"),
  };
}
