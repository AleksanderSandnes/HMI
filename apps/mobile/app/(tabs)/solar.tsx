import {
  chartSubtitle,
  solarCapValues,
  toISO,
  type SimpleChartData,
  type SolarData,
  type SolarTimespan,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LandscapeShell } from "../../src/components/LandscapeShell";
import { PageHeader } from "../../src/components/PageHeader";
import { SolarChart } from "../../src/components/charts";
import { DateSelector } from "../../src/components/ui/DateSelector";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { cn } from "../../src/lib/cn";
import { useI18n } from "../../src/lib/i18n";
import { useCore } from "../../src/lib/useCore";
import { useLayoutMode } from "../../src/lib/useLayoutMode";

const EMPTY: SimpleChartData = { labels: [], datasets: [{ data: [] }] };

function Cap({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    // The peak cap ("14:00 · 3.1 kW") is longer than the total, so it gets a
    // wider share (mirrors web).
    <View className={wide ? "min-w-0 flex-[1.6]" : "min-w-0 flex-1"}>
      <Text
        numberOfLines={1}
        className="text-[10px] font-bold uppercase tracking-[0.4px] text-text-muted"
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        className="mt-1 text-[18px] font-extrabold tracking-[-0.3px] text-text-primary"
      >
        {value}
      </Text>
    </View>
  );
}

/** Peak + period-total captions under the chart (design 1d). */
function StatCaps({
  solar,
  timespan,
  compact = false,
}: {
  solar?: SolarData;
  timespan: string;
  /** Tighter box (landscape phone side panel — the panel gap replaces the margin). */
  compact?: boolean;
}) {
  const { t } = useI18n();
  const c = solarCapValues(solar, timespan);
  if (!c.hasData) return null;
  return (
    <View
      className={cn(
        "flex-row items-stretch rounded-md border border-glass-border px-4",
        compact ? "py-2.5" : "mt-3 py-3.5",
      )}
    >
      <Cap label={t(c.labels[0])} value={c.peakText} wide />
      <View className="mx-4 w-px self-stretch bg-glass-border" />
      <Cap label={t(c.labels[1])} value={c.totalText} />
    </View>
  );
}

/** Chart card heading: fixed title + timespan/date subtitle. */
function ChartTitle({ timespan, date }: { timespan: string; date: string }) {
  const { locale, t } = useI18n();
  return (
    <View className="mb-3">
      <Text className="text-[19px] font-extrabold text-text-primary">
        {t("solar.powerGeneration")}
      </Text>
      <Text className="mt-0.5 text-[13px] font-medium text-text-muted">
        {chartSubtitle(timespan, date, locale)}
      </Text>
    </View>
  );
}

export default function Solar() {
  const { growatt } = useCore();
  const { t } = useI18n();

  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(new Date()));

  const { data: solar, isLoading } = useQuery<SolarData>({
    queryKey: ["solar", timespan, pickerDate],
    queryFn: () => growatt.fetchSolarData(timespan as SolarTimespan, pickerDate),
  });

  const chartData = solar?.chartData ?? EMPTY;
  const { isLandscape, isPhoneLandscape } = useLayoutMode();

  // Shared leaves for both arrangements (portrait stack / landscape side panel).
  const chartTitle = <ChartTitle timespan={timespan} date={pickerDate} />;
  const dateSelector = (
    <DateSelector
      selectedDate={pickerDate}
      onDateSelect={setPickerDate}
      disabled={isLoading}
      compact={isPhoneLandscape}
    />
  );
  const segmented = (
    <SegmentedControl value={timespan} onChange={setTimespan} compact={isPhoneLandscape} />
  );
  const chart = (
    <SolarChart data={chartData} timespan={timespan} date={pickerDate} loading={isLoading} />
  );
  const caps = !isLoading ? (
    <StatCaps solar={solar} timespan={timespan} compact={isPhoneLandscape} />
  ) : null;

  return (
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
      {isLandscape ? (
        <LandscapeShell
          compact={isPhoneLandscape}
          chart={
            <GlassCard strong className="flex-1 p-[18px]">
              {chartTitle}
              {chart}
            </GlassCard>
          }
          panel={
            <>
              <PageHeader
                title={t("solar.title")}
                subtitle={t("solar.subtitle")}
                compact={isPhoneLandscape}
              />
              {dateSelector}
              {segmented}
              {caps}
            </>
          }
        />
      ) : (
        <View className="flex-1 gap-4 p-4">
          <PageHeader
            title={t("solar.title")}
            subtitle={t("solar.subtitle")}
            right={dateSelector}
          />

          <GlassCard strong className="flex-1 p-[18px]">
            {chartTitle}
            <View className="mb-4">{segmented}</View>
            {chart}
            {caps}
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
}
