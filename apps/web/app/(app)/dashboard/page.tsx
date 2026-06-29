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
import { formatPeak, getPeakOutput, toISO, type SolarData } from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { StatTile } from "@/components/ui/StatTile";
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

  // Solar: load once on page load — no auto-refresh (Growatt IP-ban caution).
  const { data: solar, isLoading: solarLoading } = useQuery<SolarData>({
    queryKey: ["dashboard-solar", today],
    queryFn: () => growatt.fetchSolarData("hourly", today, false),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Weather: live, focus-gated 60s polling (respects the WU ~1,500/day cap).
  const { data: weatherData, isLoading: weatherLoading } = useQuery<CurrentWeather>({
    queryKey: ["dashboard-weather"],
    queryFn: () => weather.getCurrentWeatherData(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });

  const currentPower = useMemo(() => {
    const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] > 0) return vals[i];
    }
    return 0;
  }, [solar]);

  const peak = solar ? getPeakOutput(solar.chartData, "hourly") : null;
  const todayGen = solar?.metrics.todayGeneration ?? null;
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
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile compact icon={Zap} gradient="solar" label="Today" value={show(todayGen, 1)} unit="kWh" sublabel="Generated" loading={solarLoading} />
        <StatTile compact icon={TrendingUp} gradient="energy" label="Current" value={show(currentPower)} unit="W" sublabel={utilisation != null ? `${utilisation}% of capacity` : "Now"} loading={solarLoading} />
        <StatTile compact icon={SunMedium} gradient="revenue" label="Peak today" value={peak ? formatPeak(peak.value) : "—"} unit="W" sublabel={peak ? `at ${peak.label}` : "No data"} loading={solarLoading} />
        <StatTile compact icon={Mountain} gradient="solar" label="Lifetime" value={show(lifetime, 1)} unit="kWh" sublabel="Total" loading={solarLoading} />
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
      <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-4">
        <WindDial degrees={obs?.winddir} speed={m.windSpeed} gust={m.windGust} unit="km/h" />
        <StatTile compact icon={Thermometer} gradient="solar" label="Temperature" value={show(m.temp)} unit="°C" sublabel={`Feels ${show(feelsLike)}°`} loading={wxLoading} />
        <StatTile compact icon={Droplets} gradient="co2" label="Humidity" value={show(obs?.humidity)} unit="%" sublabel={m.dewpt != null ? `dew pt ${show(m.dewpt)}°` : undefined} loading={wxLoading} />
        <StatTile compact icon={Gauge} gradient="revenue" label="Pressure" value={show(m.pressure, 1)} unit="hPa" sublabel="Sea level" loading={wxLoading} />
        <StatTile compact icon={SunMedium} gradient="solar" label="Solar radiation" value={show(obs?.solarRadiation)} unit="W/m²" sublabel="Irradiance" loading={wxLoading} />
        <StatTile compact icon={Sun} gradient="revenue" label="UV index" value={show(obs?.uv)} sublabel="Now" loading={wxLoading} />
        <StatTile compact icon={CloudRain} gradient="energy" label="Precip rate" value={show(m.precipRate, 1)} unit="mm/h" sublabel={m.precipTotal != null ? `${show(m.precipTotal, 1)} mm today` : undefined} loading={wxLoading} />
        <StatTile compact icon={Thermometer} gradient="accent" label="Feels like" value={show(feelsLike)} unit="°C" sublabel={m.windChill != null ? `chill ${show(m.windChill)}°` : "Apparent"} loading={wxLoading} />
      </div>
    </div>
  );
}
