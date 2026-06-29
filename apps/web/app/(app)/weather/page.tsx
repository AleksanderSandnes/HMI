"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CloudRain,
  Droplets,
  Gauge,
  Sun,
  SunMedium,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { buildWeatherSeries, toISO } from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DateSelector } from "@/components/ui/DateSelector";
import { WeatherChart, type LineSeries } from "@/components/charts/WeatherChart";
import { PageHeader } from "@/components/PageHeader";
import { WeatherChip } from "@/components/WeatherChip";
import { cn } from "@/lib/utils";

interface MetricMeta {
  key: string;
  label: string;
  icon: LucideIcon;
  unit: string;
  title: string;
  accent: string;
  series: { label: string; color: string }[];
}

const METRICS: MetricMeta[] = [
  {
    key: "temperature",
    label: "Temp",
    icon: Thermometer,
    unit: "°C",
    title: "Temperature",
    accent: "#fb7185",
    series: [
      { label: "Temperature", color: "#fb7185" },
      { label: "Dew point", color: "#34d399" },
    ],
  },
  {
    key: "windSpeed",
    label: "Wind",
    icon: Wind,
    unit: "km/h",
    title: "Wind",
    accent: "#60a5fa",
    series: [
      { label: "Wind speed", color: "#60a5fa" },
      { label: "Wind gust", color: "#fbbf24" },
    ],
  },
  {
    key: "precip",
    label: "Rain",
    icon: CloudRain,
    unit: "mm",
    title: "Precipitation",
    accent: "#38bdf8",
    series: [
      { label: "Accum. total", color: "#38bdf8" },
      { label: "Rate", color: "#34d399" },
    ],
  },
  {
    key: "humidity",
    label: "Humidity",
    icon: Droplets,
    unit: "%",
    title: "Humidity",
    accent: "#22d3ee",
    series: [{ label: "Humidity", color: "#22d3ee" }],
  },
  {
    key: "pressure",
    label: "Press",
    icon: Gauge,
    unit: "hPa",
    title: "Pressure",
    accent: "#a78bfa",
    series: [{ label: "Pressure", color: "#a78bfa" }],
  },
  {
    key: "solarRadiation",
    label: "Solar",
    icon: SunMedium,
    unit: "W/m²",
    title: "Solar radiation",
    accent: "#fbbf24",
    series: [{ label: "Solar radiation", color: "#fbbf24" }],
  },
  {
    key: "uvIndex",
    label: "UV",
    icon: Sun,
    unit: "UV",
    title: "UV index",
    accent: "#c084fc",
    series: [{ label: "UV index", color: "#c084fc" }],
  },
];

const TIME_OPTIONS = [
  { label: "Hourly", value: "hourly" },
  { label: "Weekly", value: "weekly" },
];

export default function WeatherPage() {
  const { weather } = useCore();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [dataType, setDataType] = useState("temperature");
  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));

  const meta = METRICS.find((d) => d.key === dataType) ?? METRICS[0];
  const ymd = pickerDate.replaceAll("-", "");

  const { data: observations, isLoading } = useQuery({
    queryKey: ["wx-hist", timespan, ymd],
    queryFn: async () => {
      const res =
        timespan === "weekly"
          ? await weather.getWeeklyHourlyWeatherData(ymd)
          : await weather.getHourlyWeatherData(ymd);
      return (res.observations ?? []) as Record<string, unknown>[];
    },
  });

  const { labels, series, ticks } = useMemo(
    () => buildWeatherSeries(observations ?? [], dataType, timespan),
    [observations, dataType, timespan]
  );

  const chartSeries: LineSeries[] = series.map((data, i) => ({
    data,
    color: meta.series[i]?.color ?? meta.accent,
    label: meta.series[i]?.label ?? `Series ${i + 1}`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
      <PageHeader
        title="Weather Station"
        subtitle="Local conditions &amp; history"
        right={<WeatherChip />}
      />

      {/* Chart card */}
      <GlassCard strong elevated className="p-[22px]">
        {/* Metric type chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {METRICS.map((t) => {
            const active = t.key === dataType;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setDataType(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2 text-[13px] font-bold transition",
                  active
                    ? "border-transparent bg-glass-fill-strong"
                    : "border-glass-border bg-glass-fill text-text-muted hover:text-text-secondary"
                )}
                style={active ? { color: t.accent } : undefined}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[19px] font-extrabold text-text-primary">
            {meta.title}
          </h2>
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <SegmentedControl
              value={timespan}
              onChange={setTimespan}
              options={TIME_OPTIONS}
            />
          </div>
        </div>

        <WeatherChart
          labels={labels}
          series={chartSeries}
          ticks={ticks}
          unit={meta.unit}
          loading={isLoading}
          heightClass="h-[clamp(260px,46vh,560px)]"
        />

        <div className="mt-4">
          <DateSelector
            selectedDate={pickerDate}
            onDateSelect={setPickerDate}
            disabled={isLoading}
          />
        </div>
      </GlassCard>
    </div>
  );
}
