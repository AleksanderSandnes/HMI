import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  buildWeatherSeries,
  buildWeatherDailyBands,
  isPhoneWeekly,
  toISO,
  WEATHER_METRICS,
  WEATHER_TIME_OPTIONS,
  type WeatherMetricKey,
  type WeatherMetricMeta,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { ScrollView, Text, View, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LandscapeShell } from "../../src/components/LandscapeShell";
import { PageHeader } from "../../src/components/PageHeader";
import { WeatherChart, type LineSeries } from "../../src/components/charts";
import { DateSelector } from "../../src/components/ui/DateSelector";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { cn } from "../../src/lib/cn";
import { useI18n } from "../../src/lib/i18n";
import { useThemeColors } from "../../src/lib/theme";
import { useCore } from "../../src/lib/useCore";
import { useLayoutMode } from "../../src/lib/useLayoutMode";

// Shared metric metadata lives in @hmi/core; only the icons are app-specific.
const io =
  (name: keyof typeof Ionicons.glyphMap) =>
  // eslint-disable-next-line react/display-name -- render-prop, not a component
  (color: string, size: number): ReactNode => <Ionicons name={name} color={color} size={size} />;

const METRIC_ICONS: Record<WeatherMetricKey, (color: string, size: number) => ReactNode> = {
  temperature: io("thermometer"),
  windSpeed: (c, s) => <MaterialCommunityIcons name="weather-windy" color={c} size={s} />,
  precip: io("rainy"),
  humidity: io("water"),
  pressure: io("speedometer"),
  solarRadiation: io("sunny"),
  uvIndex: io("sunny-outline"),
};

function MetricChip({
  meta,
  on,
  onSelect,
  compact = false,
}: {
  meta: WeatherMetricMeta;
  on: boolean;
  onSelect: (key: string) => void;
  compact?: boolean;
}) {
  const { colors } = useThemeColors();
  const { t } = useI18n();
  const accent = on ? meta.accent : colors.textMuted;
  const chipCls = cn(
    "flex-row items-center gap-2 rounded-md border",
    compact ? "h-8 px-3" : "h-9 px-3.5",
    on ? "bg-glass-fill-strong" : "border-glass-border bg-glass-fill",
  );
  return (
    <Pressable
      onPress={() => onSelect(meta.key)}
      className={chipCls}
      style={on ? { borderColor: `${meta.accent}66` } : undefined}
    >
      {METRIC_ICONS[meta.key]?.(accent, compact ? 13 : 14)}
      <Text
        style={{ color: accent }}
        className={cn("font-bold", compact ? "text-[12px]" : "text-[13px]")}
      >
        {t(meta.labelKey)}
      </Text>
    </Pressable>
  );
}

function MetricChips({
  active,
  onSelect,
  wrap = false,
  compact = false,
}: {
  active: string;
  onSelect: (key: string) => void;
  /** Wrap into rows (landscape side panel) instead of scrolling horizontally. */
  wrap?: boolean;
  /** Smaller chips (landscape phone side panel). */
  compact?: boolean;
}) {
  const chips = WEATHER_METRICS.map((m) => (
    <MetricChip key={m.key} meta={m} on={m.key === active} onSelect={onSelect} compact={compact} />
  ));
  if (wrap) {
    return <View className={cn("flex-row flex-wrap", compact ? "gap-1.5" : "gap-2")}>{chips}</View>;
  }
  return (
    <View className="mb-3 h-11">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2"
      >
        {chips}
      </ScrollView>
    </View>
  );
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
  const { isLoading, series, bands, chartSeries } = data;
  return (
    <>
      <Text className="mb-3 text-[19px] font-extrabold text-text-primary">
        {t(meta.titleKey)}
        {phoneWeekly ? (
          <Text className="text-[13px] font-semibold text-text-muted">
            {" "}
            · {t("weather.dailyRange")}
          </Text>
        ) : null}
      </Text>
      <WeatherChart
        key={phoneWeekly ? "band" : "series"}
        labels={phoneWeekly ? bands.labels : series.labels}
        series={phoneWeekly ? undefined : chartSeries}
        band={phoneWeekly ? { min: bands.min, max: bands.max, avg: bands.avg } : undefined}
        bandColor={meta.accent}
        unit={meta.unit}
        loading={isLoading}
      />
    </>
  );
}

function useWeatherChartData(
  dataType: string,
  timespan: string,
  ymd: string,
  meta: WeatherMetricMeta,
) {
  const { weather } = useCore();
  const { t } = useI18n();
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
  const chartSeries: LineSeries[] = series.series.map((data, i) => {
    const sm = meta.series[i];
    return {
      data,
      color: sm?.color ?? meta.accent,
      label: sm ? t(sm.labelKey) : `Series ${i + 1}`,
    };
  });

  return { isLoading, series, bands, chartSeries };
}

export default function Weather() {
  const { width } = useWindowDimensions();
  const { t } = useI18n();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [dataType, setDataType] = useState("temperature");
  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));

  const meta = WEATHER_METRICS.find((d) => d.key === dataType) ?? WEATHER_METRICS[0];
  const ymd = pickerDate.replaceAll("-", "");
  // Phone weekly → 7 daily min/max/avg bands; tablet/hourly → dense series.
  // Width-based on purpose: a landscape phone (< tablet breakpoint) keeps bands.
  const phoneWeekly = isPhoneWeekly(width, timespan);
  const { isLandscape, isPhoneLandscape } = useLayoutMode();

  const data = useWeatherChartData(dataType, timespan, ymd, meta);
  const { isLoading } = data;

  // Shared leaves for both arrangements (portrait stack / landscape side panel).
  const dateSelector = (
    <DateSelector
      selectedDate={pickerDate}
      onDateSelect={setPickerDate}
      disabled={isLoading}
      compact={isPhoneLandscape}
    />
  );
  const segmented = (
    <SegmentedControl
      value={timespan}
      onChange={setTimespan}
      options={WEATHER_TIME_OPTIONS.map(({ labelKey, value }) => ({ label: t(labelKey), value }))}
      compact={isPhoneLandscape}
    />
  );
  const chartPane = <WeatherChartPane meta={meta} phoneWeekly={phoneWeekly} data={data} />;

  return (
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
      {isLandscape ? (
        <LandscapeShell
          compact={isPhoneLandscape}
          chart={
            <GlassCard strong className="flex-1 p-[18px]">
              {chartPane}
            </GlassCard>
          }
          panel={
            <>
              <PageHeader
                title={t("weather.title")}
                subtitle={t("weather.subtitle")}
                compact={isPhoneLandscape}
              />
              {dateSelector}
              {segmented}
              <MetricChips
                active={dataType}
                onSelect={setDataType}
                wrap
                compact={isPhoneLandscape}
              />
            </>
          }
        />
      ) : (
        <View className="flex-1 gap-4 p-4">
          <PageHeader
            title={t("weather.title")}
            subtitle={t("weather.subtitle")}
            right={dateSelector}
          />

          <GlassCard strong className="flex-1 p-[18px]">
            <MetricChips active={dataType} onSelect={setDataType} />

            {/* Timespan */}
            <View className="mb-4 w-full max-w-[260px]">{segmented}</View>

            {chartPane}
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
}
