import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { buildWeatherSeries, buildWeatherDailyBands, isPhoneWeekly, toISO } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { ScrollView, Text, View, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PageHeader } from "../../src/components/PageHeader";
import { WeatherChart, type LineSeries } from "../../src/components/charts";
import { DateSelector } from "../../src/components/ui/DateSelector";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ScreenBackground } from "../../src/components/ui/ScreenBackground";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { cn } from "../../src/lib/cn";
import { useCore } from "../../src/lib/useCore";

interface MetricMeta {
  key: string;
  label: string;
  icon: (color: string, size: number) => ReactNode;
  unit: string;
  title: string;
  accent: string;
  series: { label: string; color: string }[];
}

const io =
  (name: keyof typeof Ionicons.glyphMap) =>
  // eslint-disable-next-line react/display-name -- render-prop, not a component
  (color: string, size: number): ReactNode => <Ionicons name={name} color={color} size={size} />;

const METRICS: MetricMeta[] = [
  {
    key: "temperature",
    label: "Temp",
    icon: io("thermometer"),
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
    icon: (c, s) => <MaterialCommunityIcons name="weather-windy" color={c} size={s} />,
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
    icon: io("rainy"),
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
    icon: io("water"),
    unit: "%",
    title: "Humidity",
    accent: "#22d3ee",
    series: [{ label: "Humidity", color: "#22d3ee" }],
  },
  {
    key: "pressure",
    label: "Press",
    icon: io("speedometer"),
    unit: "hPa",
    title: "Pressure",
    accent: "#a78bfa",
    series: [{ label: "Pressure", color: "#a78bfa" }],
  },
  {
    key: "solarRadiation",
    label: "Solar",
    icon: io("sunny"),
    unit: "W/m²",
    title: "Solar radiation",
    accent: "#fbbf24",
    series: [{ label: "Solar radiation", color: "#fbbf24" }],
  },
  {
    key: "uvIndex",
    label: "UV",
    icon: io("sunny-outline"),
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

function MetricChips({ active, onSelect }: { active: string; onSelect: (key: string) => void }) {
  return (
    <View className="mb-3 h-11">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2"
      >
        {METRICS.map((t) => {
          const on = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onSelect(t.key)}
              className={cn(
                "h-9 flex-row items-center gap-2 rounded-md border px-3.5",
                on
                  ? "border-transparent bg-glass-fill-strong"
                  : "border-glass-border bg-glass-fill",
              )}
            >
              {t.icon(on ? t.accent : "#71809a", 14)}
              <Text
                style={on ? { color: t.accent } : undefined}
                className={cn("text-[13px] font-bold", !on && "text-text-muted")}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function useWeatherChartData(dataType: string, timespan: string, ymd: string, meta: MetricMeta) {
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
  const chartSeries: LineSeries[] = series.series.map((data, i) => ({
    data,
    color: meta.series[i]?.color ?? meta.accent,
    label: meta.series[i]?.label ?? `Series ${i + 1}`,
  }));

  return { isLoading, series, bands, chartSeries };
}

export default function Weather() {
  const { width } = useWindowDimensions();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [dataType, setDataType] = useState("temperature");
  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));

  const meta = METRICS.find((d) => d.key === dataType) ?? METRICS[0];
  const ymd = pickerDate.replaceAll("-", "");
  // Phone weekly → 7 daily min/max/avg bands; tablet/hourly → dense series.
  const phoneWeekly = isPhoneWeekly(width, timespan);

  const { isLoading, series, bands, chartSeries } = useWeatherChartData(
    dataType,
    timespan,
    ymd,
    meta,
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <ScreenBackground />
      <View className="flex-1 gap-4 p-4">
        <PageHeader
          title="Weather Station"
          subtitle="Local conditions & history"
          right={
            <DateSelector
              selectedDate={pickerDate}
              onDateSelect={setPickerDate}
              disabled={isLoading}
            />
          }
        />

        <GlassCard strong elevated className="flex-1 p-[18px]">
          <MetricChips active={dataType} onSelect={setDataType} />

          {/* Timespan */}
          <View className="mb-4 w-full max-w-[260px]">
            <SegmentedControl value={timespan} onChange={setTimespan} options={TIME_OPTIONS} />
          </View>

          <Text className="mb-3 text-[19px] font-extrabold text-text-primary">
            {meta.title}
            {phoneWeekly ? (
              <Text className="text-[13px] font-semibold text-text-muted"> · daily range</Text>
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
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}
