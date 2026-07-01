import {
  chartSubtitle,
  formatPeak,
  getPeakOutput,
  peakUnit,
  toISO,
  type SimpleChartData,
  type SolarData,
  type SolarTimespan,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PageHeader } from "../../src/components/PageHeader";
import { SolarChart } from "../../src/components/charts";
import { DateSelector } from "../../src/components/ui/DateSelector";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ScreenBackground } from "../../src/components/ui/ScreenBackground";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { useCore } from "../../src/lib/useCore";

const EMPTY: SimpleChartData = { labels: [], datasets: [{ data: [] }] };

function Cap({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
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

const CAP_LABELS: Record<string, [string, string]> = {
  hourly: ["Peak", "Today total"],
  weekly: ["Peak day", "Week total"],
  monthly: ["Peak day", "Month total"],
  yearly: ["Best month", "Year total"],
  total: ["Best year", "5-year total"],
};

function peakText(peak: ReturnType<typeof getPeakOutput>): string {
  if (!peak) return "—";
  const v = `${formatPeak(peak.value)} ${peakUnit(peak.value, peak.unit)}`;
  return peak.label ? `${peak.label} · ${v}` : v;
}

function totalKwh(solar: SolarData | undefined, timespan: string): number {
  if (timespan === "hourly") return solar?.metrics.todayGeneration ?? 0;
  const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
  return vals.reduce((a, b) => a + (b || 0), 0);
}

function capValues(solar: SolarData | undefined, timespan: string) {
  const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
  const peak = getPeakOutput(solar?.chartData as SimpleChartData, timespan);
  const total = totalKwh(solar, timespan);
  return {
    hasData: vals.length > 0,
    labels: CAP_LABELS[timespan] ?? ["Peak", "Total"],
    peakText: peakText(peak),
    totalText: `${formatPeak(total)} ${peakUnit(total, "kWh")}`,
  };
}

/** Peak + period-total captions under the chart (design 1d). */
function StatCaps({ solar, timespan }: { solar?: SolarData; timespan: string }) {
  const c = capValues(solar, timespan);
  if (!c.hasData) return null;
  return (
    <View className="mt-3 flex-row items-stretch rounded-md border border-glass-border px-4 py-3.5">
      <Cap label={c.labels[0]} value={c.peakText} />
      <View className="mx-4 w-px self-stretch bg-glass-border" />
      <Cap label={c.labels[1]} value={c.totalText} />
    </View>
  );
}

export default function Solar() {
  const { growatt } = useCore();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));

  const { data: solar, isLoading } = useQuery<SolarData>({
    queryKey: ["solar", timespan, pickerDate],
    queryFn: () => growatt.fetchSolarData(timespan as SolarTimespan, pickerDate),
  });

  const chartData = solar?.chartData ?? EMPTY;

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <ScreenBackground />
      <View className="flex-1 gap-4 p-4">
        <PageHeader
          title="Solar Production"
          subtitle="Real-time photovoltaic intelligence"
          right={
            <DateSelector
              selectedDate={pickerDate}
              onDateSelect={setPickerDate}
              disabled={isLoading}
            />
          }
        />

        <GlassCard strong elevated className="flex-1 p-[18px]">
          <View className="mb-3">
            <Text className="text-[19px] font-extrabold text-text-primary">Power Generation</Text>
            <Text className="mt-0.5 text-[13px] font-medium text-text-muted">
              {chartSubtitle(timespan, pickerDate)}
            </Text>
          </View>

          <View className="mb-4">
            <SegmentedControl value={timespan} onChange={setTimespan} />
          </View>

          <SolarChart data={chartData} timespan={timespan} date={pickerDate} loading={isLoading} />

          {!isLoading ? <StatCaps solar={solar} timespan={timespan} /> : null}
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}
