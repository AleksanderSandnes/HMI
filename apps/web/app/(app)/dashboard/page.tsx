"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  Mountain,
  Sun,
  SunMedium,
  Thermometer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import {
  CO2_PER_KWH,
  formatCO2,
  formatPeak,
  getPeakOutput,
  toISO,
  windCompass,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatTile } from "@/components/ui/StatTile";
import { SolarChart } from "@/components/charts/SolarChart";
import { PageHeader } from "@/components/PageHeader";
import { WeatherChip } from "@/components/WeatherChip";

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
  const { data: weatherData } = useQuery<CurrentWeather>({
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
  const co2 = todayGen != null ? formatCO2(todayGen * CO2_PER_KWH) : null;
  const device = solar?.device;
  const capacityKw = device?.capacity ? round(device.capacity / 1000, 1) : null;
  // Live inverter utilisation: current AC power vs rated PV capacity.
  const utilisation =
    device?.capacity && currentPower > 0
      ? Math.round((currentPower / device.capacity) * 100)
      : null;

  const obs = weatherData?.observations?.[0];
  const m = obs?.metric ?? {};
  const feelsLike = m.heatIndex ?? m.windChill ?? m.temp;
  const dir = windCompass(obs?.winddir);

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
      <PageHeader
        title="Dashboard"
        subtitle="Your home at a glance"
        right={<WeatherChip />}
      />

      {/* Solar overview */}
      <GlassCard strong elevated className="p-[22px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sun size={20} className="text-solar-light" />
            <h2 className="text-[19px] font-extrabold text-text-primary">
              Solar
            </h2>
            {device?.plantName || device?.model ? (
              <span className="text-[13px] font-semibold text-text-muted">
                · {[device?.plantName, device?.model].filter(Boolean).join(" · ")}
              </span>
            ) : null}
          </div>
          {device?.online != null ? (
            <span
              className={`flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold ${
                device.online
                  ? "bg-[rgba(52,211,153,0.13)] text-positive"
                  : "bg-[rgba(251,113,133,0.13)] text-negative"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  device.online ? "bg-positive" : "bg-negative"
                }`}
              />
              {device.online ? "Online" : "Offline"}
              {device.deviceCount && device.deviceCount > 1
                ? ` · ${device.onlineCount ?? 0}/${device.deviceCount}`
                : ""}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon={Zap}
            gradient="solar"
            label="Today"
            value={solarLoading && todayGen == null ? "—" : show(todayGen, 1)}
            unit="kWh"
            sublabel="Generated"
            loading={solarLoading}
          />
          <StatTile
            icon={TrendingUp}
            gradient="energy"
            label="Current power"
            value={show(currentPower)}
            unit="W"
            sublabel={
              utilisation != null && capacityKw != null
                ? `${utilisation}% of ${capacityKw} kW`
                : capacityKw != null
                  ? `${capacityKw} kW system`
                  : device?.lastUpdate
                    ? `as of ${device.lastUpdate.split(" ")[1] ?? ""}`
                    : "Now"
            }
            loading={solarLoading}
          />
          <StatTile
            icon={SunMedium}
            gradient="revenue"
            label="Peak today"
            value={peak ? formatPeak(peak.value) : "—"}
            unit="W"
            sublabel={peak ? `at ${peak.label}` : "No data"}
            loading={solarLoading}
          />
          <StatTile
            icon={Mountain}
            gradient="solar"
            label="Lifetime"
            value={show(lifetime, 1)}
            unit="kWh"
            sublabel="Total generated"
            loading={solarLoading}
          />
        </div>

        {/* Today's production sparkline + CO2 estimate */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-[var(--radius-md)] border border-glass-border bg-glass-fill-subtle p-3">
            <p className="mb-1 px-1 text-xs font-bold uppercase tracking-[0.5px] text-text-muted">
              Today&apos;s production
            </p>
            <SolarChart
              data={solar?.chartData ?? { labels: [], datasets: [{ data: [] }] }}
              timespan="hourly"
              loading={solarLoading}
              height={150}
            />
          </div>
          <StatTile
            icon={Leaf}
            gradient="co2"
            label="CO₂ avoided"
            value={co2 ? co2.value : "—"}
            unit={co2 ? co2.unit : undefined}
            sublabel="Estimate · today"
            loading={solarLoading}
          />
        </div>
      </GlassCard>

      {/* Current weather */}
      <GlassCard strong elevated className="p-[22px]">
        <div className="mb-4 flex items-center gap-2.5">
          <CloudRain size={20} className="text-solar-light" />
          <h2 className="text-[19px] font-extrabold text-text-primary">
            Current weather
          </h2>
          {obs?.obsTimeLocal ? (
            <span className="text-[13px] font-semibold text-text-muted">
              · updated {obs.obsTimeLocal.split(" ")[1] ?? ""}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatTile icon={Thermometer} gradient="solar" label="Temperature" value={show(m.temp)} unit="°C" sublabel={`Feels ${show(feelsLike)}°`} />
          <StatTile icon={Wind} gradient="energy" label="Wind" value={show(m.windSpeed)} unit="km/h" sublabel={dir ? `${dir}${m.windGust != null ? ` · gust ${show(m.windGust)}` : ""}` : "—"} />
          <StatTile icon={Droplets} gradient="co2" label="Humidity" value={show(obs?.humidity)} unit="%" sublabel={m.dewpt != null ? `dew pt ${show(m.dewpt)}°` : "—"} />
          <StatTile icon={Gauge} gradient="revenue" label="Pressure" value={show(m.pressure, 1)} unit="hPa" sublabel="Sea level" />
          <StatTile icon={SunMedium} gradient="solar" label="Solar radiation" value={show(obs?.solarRadiation)} unit="W/m²" sublabel="Irradiance" />
          <StatTile icon={Sun} gradient="revenue" label="UV index" value={show(obs?.uv)} sublabel="Now" />
          <StatTile icon={CloudRain} gradient="energy" label="Precip rate" value={show(m.precipRate, 1)} unit="mm/h" sublabel={m.precipTotal != null ? `${show(m.precipTotal, 1)} mm today` : "—"} />
          <StatTile icon={Thermometer} gradient="co2" label="Feels like" value={show(feelsLike)} unit="°C" sublabel={m.windChill != null ? `chill ${show(m.windChill)}°` : "Apparent"} />
        </div>
      </GlassCard>
    </div>
  );
}
