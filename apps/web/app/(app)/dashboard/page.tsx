"use client";

import {
  buildWeatherSeries,
  formatPeak,
  getPeakOutput,
  peakUnit,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import {
  CloudRain,
  Droplets,
  Gauge,
  type LucideIcon,
  Mountain,
  Sun,
  SunMedium,
  Thermometer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/PageHeader";
import { DualBaro } from "@/components/ui/DualBaro";
import { DualStat } from "@/components/ui/DualStat";
import { WindDial } from "@/components/ui/WindDial";
import { average, lastPositive, round, show } from "@/lib/format";
import { useCore } from "@/lib/hooks/useCore";

interface CurrentMetric {
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
interface CurrentObs {
  humidity?: number;
  winddir?: number;
  uv?: number;
  solarRadiation?: number;
  obsTimeLocal?: string;
  metric?: CurrentMetric;
}
interface CurrentWeather {
  observations?: CurrentObs[];
}

function SectionLabel({
  icon: Icon,
  text,
  right,
}: {
  icon: LucideIcon;
  text: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="text-solar-light" />
      <span className="text-[11.5px] font-bold uppercase tracking-[0.6px] text-text-secondary">
        {text}
      </span>
      <div className="h-px flex-1 bg-glass-border" />
      {right}
    </div>
  );
}

function StatusBadge({ online }: { online: boolean | null | undefined }) {
  if (online == null) return null;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold ${online ? "bg-[rgba(52,211,153,0.13)] text-positive" : "bg-[rgba(251,113,133,0.13)] text-negative"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-positive" : "bg-negative"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function solarMetrics(solar?: SolarData, solarWeek?: SolarData) {
  return {
    peak: solar ? getPeakOutput(solar.chartData, "hourly") : null,
    todayGen: solar?.metrics.todayGeneration ?? null,
    weekGen: solarWeek?.metrics.todayGeneration ?? null,
    lifetime: solar?.metrics.totalGeneration ?? null,
  };
}

function solarDevice(solar: SolarData | undefined, currentPower: number) {
  const device = solar?.device;
  const capacityKw = device?.capacity ? round(device.capacity / 1000, 1) : null;
  const utilisation =
    device?.capacity && currentPower > 0
      ? Math.round((currentPower / device.capacity) * 100)
      : null;
  return { device, capacityKw, utilisation };
}

function weatherNow(weatherData?: CurrentWeather) {
  const obs = weatherData?.observations?.[0];
  const m: CurrentMetric = obs?.metric ?? {};
  const feelsLike = m.heatIndex ?? m.windChill ?? m.temp;
  return { obs, m, feelsLike };
}

function useDashboardData() {
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

  const wkAvg = useMemo(() => {
    const obs = weekObs?.observations ?? [];
    const avg = (key: string) => average(buildWeatherSeries(obs, key, "weekly").series[0] ?? []);
    return {
      temp: avg("temperature"),
      humidity: avg("humidity"),
      pressure: avg("pressure"),
      solar: avg("solarRadiation"),
      uv: avg("uvIndex"),
    };
  }, [weekObs]);

  const currentPower = useMemo(
    () => lastPositive(solar?.chartData?.datasets?.[0]?.data ?? []),
    [solar],
  );

  return {
    solarLoading,
    wxLoading: weatherLoading && !weatherData,
    currentPower,
    wkAvg,
    ...solarMetrics(solar, solarWeek),
    ...solarDevice(solar, currentPower),
    ...weatherNow(weatherData),
  };
}

type DashboardModel = ReturnType<typeof useDashboardData>;

function SolarSection({ model }: { model: DashboardModel }) {
  const { todayGen, weekGen, lifetime, currentPower, peak, utilisation, capacityKw, solarLoading } =
    model;
  return (
    <>
      <SectionLabel
        icon={Sun}
        text="Solar"
        right={
          capacityKw != null ? (
            <span className="text-[11px] font-semibold text-text-muted">
              {capacityKw} kW system
            </span>
          ) : null
        }
      />
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:min-h-0 md:flex-1 md:grid-cols-4">
        <DualStat
          icon={Zap}
          gradient="solar"
          label="Generation"
          aLabel="Today"
          aValue={show(todayGen, 1)}
          aUnit="kWh"
          bLabel="This week"
          bValue={show(weekGen, 1)}
          bUnit="kWh"
          loading={solarLoading}
        />
        <DualStat
          icon={TrendingUp}
          gradient="energy"
          label="Power"
          aLabel="Current"
          aValue={show(currentPower)}
          aUnit="W"
          bLabel="Peak today"
          bValue={peak ? formatPeak(peak.value) : "—"}
          bUnit={peak ? peakUnit(peak.value, "W") : "W"}
          loading={solarLoading}
        />
        <DualStat
          icon={Gauge}
          gradient="revenue"
          label="Utilisation"
          aLabel="Now"
          aValue={utilisation != null ? `${utilisation}` : "—"}
          aUnit="%"
          bLabel="System"
          bValue={capacityKw != null ? `${capacityKw}` : "—"}
          bUnit="kW"
          loading={solarLoading}
        />
        <DualStat
          icon={Mountain}
          gradient="solar"
          label="Lifetime"
          aLabel="Total"
          aValue={show(lifetime, 0)}
          aUnit="kWh"
          bLabel="Today"
          bValue={show(todayGen, 1)}
          bUnit="kWh"
          loading={solarLoading}
        />
      </div>
    </>
  );
}

function WeatherTilesA({ model }: { model: DashboardModel }) {
  const { obs, m, wkAvg, wxLoading } = model;
  return (
    <>
      <WindDial degrees={obs?.winddir} speed={m.windSpeed} gust={m.windGust} unit="km/h" />
      <DualStat
        icon={Thermometer}
        gradient="solar"
        label="Temperature"
        aLabel="Now"
        aValue={show(m.temp)}
        aUnit="°C"
        bLabel="Week average"
        bValue={show(wkAvg.temp)}
        bUnit="°C"
        loading={wxLoading}
      />
      <DualStat
        icon={Droplets}
        gradient="co2"
        label="Humidity"
        aLabel="Now"
        aValue={show(obs?.humidity)}
        aUnit="%"
        bLabel="Week average"
        bValue={show(wkAvg.humidity)}
        bUnit="%"
        loading={wxLoading}
      />
      <DualBaro now={m.pressure} avg={wkAvg.pressure} unit="hPa" loading={wxLoading} />
    </>
  );
}

function WeatherTilesB({ model }: { model: DashboardModel }) {
  const { obs, m, feelsLike, wkAvg, wxLoading } = model;
  return (
    <>
      <DualStat
        icon={SunMedium}
        gradient="solar"
        label="Solar radiation"
        aLabel="Now"
        aValue={show(obs?.solarRadiation)}
        aUnit="W/m²"
        bLabel="Week average"
        bValue={show(wkAvg.solar)}
        bUnit="W/m²"
        loading={wxLoading}
      />
      <DualStat
        icon={Sun}
        gradient="revenue"
        label="UV index"
        aLabel="Now"
        aValue={show(obs?.uv)}
        bLabel="Week average"
        bValue={show(wkAvg.uv)}
        loading={wxLoading}
      />
      <DualStat
        icon={CloudRain}
        gradient="energy"
        label="Precipitation"
        aLabel="Rate"
        aValue={show(m.precipRate, 1)}
        aUnit="mm/h"
        bLabel="Today"
        bValue={show(m.precipTotal, 1)}
        bUnit="mm"
        loading={wxLoading}
      />
      <DualStat
        icon={Thermometer}
        gradient="accent"
        label="Feels like"
        aLabel="Now"
        aValue={show(feelsLike)}
        aUnit="°C"
        bLabel="Wind chill"
        bValue={show(m.windChill)}
        bUnit="°C"
        loading={wxLoading}
      />
    </>
  );
}

function WeatherSection({ model }: { model: DashboardModel }) {
  const { obs } = model;
  return (
    <>
      <SectionLabel
        icon={CloudRain}
        text="Weather"
        right={
          obs?.obsTimeLocal ? (
            <span className="text-[11px] font-semibold text-text-muted">
              updated {obs.obsTimeLocal.split(" ")[1] ?? ""}
            </span>
          ) : null
        }
      />
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:min-h-0 md:flex-[2] md:grid-cols-4">
        <WeatherTilesA model={model} />
        <WeatherTilesB model={model} />
      </div>
    </>
  );
}

export default function DashboardPage() {
  const model = useDashboardData();
  const { device } = model;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 md:h-full">
      <PageHeader
        title="Home Production"
        subtitle={
          [device?.plantName, device?.model].filter(Boolean).join(" · ") ||
          "Solar & weather overview"
        }
        right={<StatusBadge online={device?.online} />}
      />
      <SolarSection model={model} />
      <WeatherSection model={model} />
    </div>
  );
}
