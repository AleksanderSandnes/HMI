"use client";

import { useMemo } from "react";
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
import {
  buildWeatherSeries,
  formatPeak,
  getPeakOutput,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { DualStat } from "@/components/ui/DualStat";
import { WindDial } from "@/components/ui/WindDial";
import { PageHeader } from "@/components/PageHeader";

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
interface CurrentWeather {
  observations?: Array<{
    humidity?: number;
    winddir?: number;
    uv?: number;
    solarRadiation?: number;
    obsTimeLocal?: string;
    metric?: CurrentMetric;
  }>;
}

const round = (v: number | null | undefined, dp = 0) =>
  v == null || isNaN(Number(v))
    ? null
    : Math.round(Number(v) * 10 ** dp) / 10 ** dp;

const show = (v: number | null | undefined, dp = 0) => {
  const r = round(v, dp);
  return r == null ? "—" : `${r}`;
};

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

export default function DashboardPage() {
  const { growatt, weather } = useCore();
  const today = toISO(new Date());
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toISO(d);
  }, []);

  // Solar today (load-once; no auto-refresh — Growatt IP-ban caution).
  const { data: solar, isLoading: solarLoading } = useQuery<SolarData>({
    queryKey: ["dashboard-solar", today],
    queryFn: () => growatt.fetchSolarData("hourly", today, false),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  // Solar this week (7-day total).
  const { data: solarWeek } = useQuery<SolarData>({
    queryKey: ["dashboard-solar-week", yesterday],
    queryFn: () => growatt.fetchSolarData("weekly", yesterday, false),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Weather: live current (focus-gated 60s) + weekly history for averages.
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

  // Weekly averages per metric, from the historical observations.
  const wkAvg = useMemo(() => {
    const obs = weekObs?.observations ?? [];
    const avg = (key: string) => {
      const { series } = buildWeatherSeries(obs, key, "weekly");
      const vals = (series[0] ?? []).filter((v) => v != null && v !== 0 && !isNaN(v));
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    };
    return {
      temp: avg("temperature"),
      humidity: avg("humidity"),
      pressure: avg("pressure"),
      solar: avg("solarRadiation"),
      uv: avg("uvIndex"),
    };
  }, [weekObs]);

  const currentPower = useMemo(() => {
    const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] > 0) return vals[i];
    }
    return 0;
  }, [solar]);

  const peak = solar ? getPeakOutput(solar.chartData, "hourly") : null;
  const todayGen = solar?.metrics.todayGeneration ?? null;
  const weekGen = solarWeek?.metrics.todayGeneration ?? null;
  const lifetime = solar?.metrics.totalGeneration ?? null;
  const device = solar?.device;
  const capacityKw = device?.capacity ? round(device.capacity / 1000, 1) : null;
  const utilisation =
    device?.capacity && currentPower > 0
      ? Math.round((currentPower / device.capacity) * 100)
      : null;

  const obs = weatherData?.observations?.[0];
  const m = obs?.metric ?? {};
  const feelsLike = m.heatIndex ?? m.windChill ?? m.temp;
  const wxLoading = weatherLoading && !weatherData;

  const statusBadge =
    device?.online != null ? (
      <span
        className={`flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold ${
          device.online
            ? "bg-[rgba(52,211,153,0.13)] text-positive"
            : "bg-[rgba(251,113,133,0.13)] text-negative"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${device.online ? "bg-positive" : "bg-negative"}`}
        />
        {device.online ? "Online" : "Offline"}
      </span>
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      <PageHeader
        title="Home Production"
        subtitle={
          [device?.plantName, device?.model].filter(Boolean).join(" · ") ||
          "Solar & weather overview"
        }
        right={statusBadge}
      />

      {/* Solar */}
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
          bUnit="W"
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

      {/* Weather */}
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <WindDial degrees={obs?.winddir} speed={m.windSpeed} gust={m.windGust} unit="km/h" />
        <DualStat icon={Thermometer} gradient="solar" label="Temperature" aLabel="Now" aValue={show(m.temp)} aUnit="°C" bLabel="Wk avg" bValue={show(wkAvg.temp)} bUnit="°C" loading={wxLoading} />
        <DualStat icon={Droplets} gradient="co2" label="Humidity" aLabel="Now" aValue={show(obs?.humidity)} aUnit="%" bLabel="Wk avg" bValue={show(wkAvg.humidity)} bUnit="%" loading={wxLoading} />
        <DualStat icon={Gauge} gradient="revenue" label="Pressure" aLabel="Now" aValue={show(m.pressure, 1)} aUnit="hPa" bLabel="Wk avg" bValue={show(wkAvg.pressure, 1)} bUnit="hPa" loading={wxLoading} />
        <DualStat icon={SunMedium} gradient="solar" label="Solar radiation" aLabel="Now" aValue={show(obs?.solarRadiation)} aUnit="W/m²" bLabel="Wk avg" bValue={show(wkAvg.solar)} bUnit="W/m²" loading={wxLoading} />
        <DualStat icon={Sun} gradient="revenue" label="UV index" aLabel="Now" aValue={show(obs?.uv)} bLabel="Wk avg" bValue={show(wkAvg.uv)} loading={wxLoading} />
        <DualStat icon={CloudRain} gradient="energy" label="Precipitation" aLabel="Rate" aValue={show(m.precipRate, 1)} aUnit="mm/h" bLabel="Today" bValue={show(m.precipTotal, 1)} bUnit="mm" loading={wxLoading} />
        <DualStat icon={Thermometer} gradient="accent" label="Feels like" aLabel="Now" aValue={show(feelsLike)} aUnit="°C" bLabel="Wind chill" bValue={show(m.windChill)} bUnit="°C" loading={wxLoading} />
      </div>
    </div>
  );
}
