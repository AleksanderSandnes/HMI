"use client";

import {
  buildWeatherDailyBands,
  buildWeatherSeries,
  isPhoneWeekly,
  toISO,
  WEATHER_METRICS,
  WEATHER_TIME_OPTIONS,
  type WeatherMetricKey,
  type WeatherMetricMeta,
} from "@hmi/core";
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
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { WeatherChart, type LineSeries } from "@/components/charts/WeatherChart";
import { DateSelector } from "@/components/ui/DateSelector";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCore } from "@/lib/hooks/useCore";
import { useViewportWidth } from "@/lib/hooks/useViewportWidth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Shared metric metadata lives in @hmi/core; only the icons are web-specific.
const METRIC_ICONS: Record<WeatherMetricKey, LucideIcon> = {
  temperature: Thermometer,
  windSpeed: Wind,
  precip: CloudRain,
  humidity: Droplets,
  pressure: Gauge,
  solarRadiation: SunMedium,
  uvIndex: Sun,
};

function MetricChips({ active, onSelect }: { active: string; onSelect: (key: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
      {WEATHER_METRICS.map((m) => {
        const on = m.key === active;
        const Icon = METRIC_ICONS[m.key];
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2 text-[0.8125rem] font-bold transition",
              on
                ? "bg-glass-fill-strong"
                : "border-glass-border bg-glass-fill text-text-muted hover:text-text-secondary",
            )}
            style={on ? { color: m.accent, borderColor: `${m.accent}66` } : undefined}
          >
            <Icon size={14} className="size-[0.875rem]" />
            {t(m.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function useWeatherChartData(dataType: string, timespan: string, ymd: string) {
  const { weather } = useCore();
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

  const series = useMemo(
    () => buildWeatherSeries(observations ?? [], dataType, timespan),
    [observations, dataType, timespan],
  );
  const bands = useMemo(
    () => buildWeatherDailyBands(observations ?? [], dataType),
    [observations, dataType],
  );
  return { isLoading, series, bands };
}

/** Metric title (with the phone-weekly "daily range" suffix) + the chart itself. */
function WeatherChartPane({
  meta,
  phoneWeekly,
  data,
}: {
  meta: WeatherMetricMeta;
  phoneWeekly: boolean;
  data: ReturnType<typeof useWeatherChartData>;
}) {
  const { t } = useI18n();
  const { isLoading, series, bands } = data;
  const chartSeries: LineSeries[] = series.series.map((s, i) => {
    const sm = meta.series[i];
    return { data: s, color: sm?.color ?? meta.accent, label: sm ? t(sm.labelKey) : `${i + 1}` };
  });
  return (
    <>
      <h2 className="mb-[0.875rem] shrink-0 text-[1.1875rem] font-extrabold text-text-primary">
        {t(meta.titleKey)}
        {phoneWeekly ? (
          <span className="text-[0.8125rem] font-semibold text-text-muted">
            {" "}
            · {t("weather.dailyRange")}
          </span>
        ) : null}
      </h2>

      {/* Below md the chart takes whatever height keeps the whole page inside
          the initial viewport (~25rem of chrome above/below), so nothing
          needs scrolling. */}
      <div className="h-[clamp(9rem,calc(100dvh-29.5rem),36rem)] md:h-auto md:min-h-[13.75rem] md:flex-1">
        <WeatherChart
          key={phoneWeekly ? "band" : "series"}
          labels={phoneWeekly ? bands.labels : series.labels}
          series={phoneWeekly ? undefined : chartSeries}
          band={phoneWeekly ? { min: bands.min, max: bands.max, avg: bands.avg } : undefined}
          bandColor={meta.accent}
          ticks={phoneWeekly ? undefined : series.ticks}
          unit={meta.unit}
          loading={isLoading}
          heightClass="h-full"
        />
      </div>
    </>
  );
}

export default function WeatherPage() {
  const { t } = useI18n();
  const width = useViewportWidth();

  const [dataType, setDataType] = useState("temperature");
  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(new Date()));

  const meta = WEATHER_METRICS.find((d) => d.key === dataType) ?? WEATHER_METRICS[0];
  const ymd = pickerDate.replaceAll("-", "");
  // Phone weekly → 7 daily min/max/avg bands; desktop/hourly → dense series
  // (same <1024 boundary the mobile app uses).
  const phoneWeekly = isPhoneWeekly(width, timespan);

  const data = useWeatherChartData(dataType, timespan, ymd);
  const { isLoading } = data;

  return (
    <div className="mx-auto flex w-full max-w-[92.5rem] flex-col gap-4 md:h-full 3xl:max-w-[100rem]">
      <PageHeader
        title={t("weather.title")}
        subtitle={t("weather.subtitle")}
        right={
          <DateSelector
            selectedDate={pickerDate}
            onDateSelect={setPickerDate}
            disabled={isLoading}
          />
        }
      />

      {/* Chart card — fills the remaining viewport so nothing scrolls off-screen. */}
      <GlassCard strong elevated className="flex min-h-0 flex-1 flex-col p-[1.375rem]">
        {/* Data-type chips (left) + timespan (right) on one row. */}
        <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <MetricChips active={dataType} onSelect={setDataType} />
          <div className="w-full shrink-0 sm:w-[13.75rem]">
            <SegmentedControl
              value={timespan}
              onChange={setTimespan}
              options={WEATHER_TIME_OPTIONS.map(({ labelKey, value }) => ({
                label: t(labelKey),
                value,
              }))}
            />
          </div>
        </div>

        <WeatherChartPane meta={meta} phoneWeekly={phoneWeekly} data={data} />
      </GlassCard>
    </div>
  );
}
