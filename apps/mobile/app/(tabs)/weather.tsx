import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  buildWeatherSeries,
  buildWeatherDailyBands,
  isPhoneWeekly,
  toISO,
  type TranslationKey,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { ScrollView, Text, View, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PageHeader } from "../../src/components/PageHeader";
import { WeatherChart, type LineSeries } from "../../src/components/charts";
import { DateSelector } from "../../src/components/ui/DateSelector";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { cn } from "../../src/lib/cn";
import { useI18n } from "../../src/lib/i18n";
import { useThemeColors } from "../../src/lib/theme";
import { useCore } from "../../src/lib/useCore";

interface MetricMeta {
  key: string;
  labelKey: TranslationKey;
  icon: (color: string, size: number) => ReactNode;
  unit: string;
  titleKey: TranslationKey;
  accent: string;
  series: { labelKey: TranslationKey; color: string }[];
}

const io =
  (name: keyof typeof Ionicons.glyphMap) =>
  // eslint-disable-next-line react/display-name -- render-prop, not a component
  (color: string, size: number): ReactNode => <Ionicons name={name} color={color} size={size} />;

const METRICS: MetricMeta[] = [
  {
    key: "temperature",
    labelKey: "weather.chip.temp",
    icon: io("thermometer"),
    unit: "°C",
    titleKey: "weather.temperature",
    accent: "#fb7185",
    series: [
      { labelKey: "weather.temperature", color: "#fb7185" },
      { labelKey: "weather.dewPoint", color: "#34d399" },
    ],
  },
  {
    key: "windSpeed",
    labelKey: "weather.chip.wind",
    icon: (c, s) => <MaterialCommunityIcons name="weather-windy" color={c} size={s} />,
    unit: "km/h",
    titleKey: "weather.wind",
    accent: "#60a5fa",
    series: [
      { labelKey: "weather.windSpeed", color: "#60a5fa" },
      { labelKey: "weather.windGust", color: "#fbbf24" },
    ],
  },
  {
    key: "precip",
    labelKey: "weather.chip.rain",
    icon: io("rainy"),
    unit: "mm",
    titleKey: "weather.precipitation",
    accent: "#38bdf8",
    series: [
      { labelKey: "weather.accumTotal", color: "#38bdf8" },
      { labelKey: "weather.rate", color: "#34d399" },
    ],
  },
  {
    key: "humidity",
    labelKey: "weather.chip.humidity",
    icon: io("water"),
    unit: "%",
    titleKey: "weather.humidity",
    accent: "#22d3ee",
    series: [{ labelKey: "weather.humidity", color: "#22d3ee" }],
  },
  {
    key: "pressure",
    labelKey: "weather.chip.pressure",
    icon: io("speedometer"),
    unit: "hPa",
    titleKey: "weather.pressure",
    accent: "#a78bfa",
    series: [{ labelKey: "weather.pressure", color: "#a78bfa" }],
  },
  {
    key: "solarRadiation",
    labelKey: "weather.chip.solar",
    icon: io("sunny"),
    unit: "W/m²",
    titleKey: "weather.solarRadiation",
    accent: "#fbbf24",
    series: [{ labelKey: "weather.solarRadiation", color: "#fbbf24" }],
  },
  {
    key: "uvIndex",
    labelKey: "weather.chip.uv",
    icon: io("sunny-outline"),
    unit: "UV",
    titleKey: "weather.uvIndex",
    accent: "#c084fc",
    series: [{ labelKey: "weather.uvIndex", color: "#c084fc" }],
  },
];

const TIME_OPTION_KEYS: { labelKey: TranslationKey; value: string }[] = [
  { labelKey: "timespan.hourly", value: "hourly" },
  { labelKey: "timespan.weekly", value: "weekly" },
];

function MetricChips({ active, onSelect }: { active: string; onSelect: (key: string) => void }) {
  const { colors } = useThemeColors();
  const { t } = useI18n();
  return (
    <View className="mb-3 h-11">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2"
      >
        {METRICS.map((m) => {
          const on = m.key === active;
          return (
            <Pressable
              key={m.key}
              onPress={() => onSelect(m.key)}
              className={cn(
                "h-9 flex-row items-center gap-2 rounded-md border px-3.5",
                on ? "bg-glass-fill-strong" : "border-glass-border bg-glass-fill",
              )}
              style={on ? { borderColor: `${m.accent}66` } : undefined}
            >
              {m.icon(on ? m.accent : colors.textMuted, 14)}
              <Text
                style={on ? { color: m.accent } : undefined}
                className={cn("text-[13px] font-bold", !on && "text-text-muted")}
              >
                {t(m.labelKey)}
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
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1 gap-4 p-4">
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

        <GlassCard strong className="flex-1 p-[18px]">
          <MetricChips active={dataType} onSelect={setDataType} />

          {/* Timespan */}
          <View className="mb-4 w-full max-w-[260px]">
            <SegmentedControl
              value={timespan}
              onChange={setTimespan}
              options={TIME_OPTION_KEYS.map(({ labelKey, value }) => ({
                label: t(labelKey),
                value,
              }))}
            />
          </View>

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
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}
