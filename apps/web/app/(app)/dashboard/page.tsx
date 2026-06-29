"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  type LucideIcon,
  Mountain,
  Sun,
  SunMedium,
  Thermometer,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  CO2_PER_KWH,
  formatCO2,
  formatPeak,
  getPeakOutput,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { WindDial } from "@/components/ui/WindDial";
import { SolarChart } from "@/components/charts/SolarChart";
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

/** Compact glass stat cell — denser than StatTile so everything fits one screen. */
function Metric({
  icon: Icon,
  accent,
  label,
  value,
  unit,
  sub,
}: {
  icon: LucideIcon;
  accent: string;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
}) {
  return (
    <GlassCard strong className="p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-text-muted">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-[21px] font-extrabold leading-none text-text-primary">
        {value}
        {unit ? (
          <span className="ml-1 text-[11px] font-bold text-text-muted">{unit}</span>
        ) : null}
      </p>
      {sub ? (
        <p className="mt-1 truncate text-[10.5px] font-medium text-text-muted">{sub}</p>
      ) : null}
    </GlassCard>
  );
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
  const utilisation =
    device?.capacity && currentPower > 0
      ? Math.round((currentPower / device.capacity) * 100)
      : null;

  const obs = weatherData?.observations?.[0];
  const m = obs?.metric ?? {};
  const feelsLike = m.heatIndex ?? m.windChill ?? m.temp;

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
        {device.deviceCount && device.deviceCount > 1
          ? ` · ${device.onlineCount ?? 0}/${device.deviceCount}`
          : ""}
      </span>
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      {/* Compact header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-text-primary">
            Home Production
          </h1>
          <p className="text-[13px] font-medium text-text-muted">
            {[device?.plantName, device?.model].filter(Boolean).join(" · ") ||
              "Live solar & weather overview"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {statusBadge}
          <WeatherChip />
        </div>
      </div>

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Zap} accent="#fbbf24" label="Today" value={show(todayGen, 1)} unit="kWh" sub="Generated" />
        <Metric
          icon={TrendingUp}
          accent="#34d399"
          label="Current"
          value={show(currentPower)}
          unit="W"
          sub={utilisation != null ? `${utilisation}% of capacity` : "Now"}
        />
        <Metric
          icon={SunMedium}
          accent="#facc15"
          label="Peak today"
          value={peak ? formatPeak(peak.value) : "—"}
          unit="W"
          sub={peak ? `at ${peak.label}` : "No data"}
        />
        <Metric icon={Mountain} accent="#fbbf24" label="Lifetime" value={show(lifetime, 1)} unit="kWh" sub="Total" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2.4fr_1fr]">
        <GlassCard strong className="p-3.5">
          <p className="mb-0.5 px-1 text-[10px] font-bold uppercase tracking-[0.4px] text-text-muted">
            Today&apos;s production
          </p>
          <SolarChart
            data={solar?.chartData ?? { labels: [], datasets: [{ data: [] }] }}
            timespan="hourly"
            loading={solarLoading}
            height={132}
            showAxes={false}
          />
        </GlassCard>
        <Metric
          icon={Leaf}
          accent="#4ade80"
          label="CO₂ avoided"
          value={co2 ? co2.value : "—"}
          unit={co2 ? co2.unit : undefined}
          sub="Estimate · today"
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
        <Metric icon={Thermometer} accent="#fbbf24" label="Temperature" value={show(m.temp)} unit="°C" sub={`Feels ${show(feelsLike)}°`} />
        <Metric icon={Droplets} accent="#4ade80" label="Humidity" value={show(obs?.humidity)} unit="%" sub={m.dewpt != null ? `dew pt ${show(m.dewpt)}°` : "—"} />
        <Metric icon={Gauge} accent="#facc15" label="Pressure" value={show(m.pressure, 1)} unit="hPa" sub="Sea level" />
        <Metric icon={SunMedium} accent="#fbbf24" label="Solar radiation" value={show(obs?.solarRadiation)} unit="W/m²" sub="Irradiance" />
        <Metric icon={Sun} accent="#facc15" label="UV index" value={show(obs?.uv)} sub="Now" />
        <Metric icon={CloudRain} accent="#34d399" label="Precip rate" value={show(m.precipRate, 1)} unit="mm/h" sub={m.precipTotal != null ? `${show(m.precipTotal, 1)} mm today` : "—"} />
        <Metric icon={Thermometer} accent="#4ade80" label="Feels like" value={show(feelsLike)} unit="°C" sub={m.windChill != null ? `chill ${show(m.windChill)}°` : "Apparent"} />
      </div>
    </div>
  );
}
