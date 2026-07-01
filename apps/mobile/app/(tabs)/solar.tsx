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
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PageHeader } from "../../src/components/PageHeader";
import { SolarChart } from "../../src/components/charts";
import { DateSelector } from "../../src/components/ui/DateSelector";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { useCore } from "../../src/lib/useCore";

const EMPTY: SimpleChartData = { labels: [], datasets: [{ data: [] }] };

function Cap({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-[0.4px] text-text-muted">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        className="mt-1 text-[18px] font-extrabold tracking-[-0.3px] text-text-primary"
      >
        {value}
      </Text>
    </View>
  );
}

function peakText(peak: ReturnType<typeof getPeakOutput>): string {
  if (!peak) return "—";
  const v = `${formatPeak(peak.value)} ${peakUnit(peak.value, peak.unit)}`;
  return peak.label ? `${peak.label} · ${v}` : v;
}

function capValues(solar: SolarData | undefined, timespan: string) {
  const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
  const isHourly = timespan === "hourly";
  const peak = getPeakOutput(solar?.chartData as SimpleChartData, timespan);
  const totalKwh = isHourly
    ? (solar?.metrics.todayGeneration ?? 0)
    : vals.reduce((a, b) => a + (b || 0), 0);
  return {
    hasData: vals.length > 0,
    isHourly,
    peakText: peakText(peak),
    totalText: `${formatPeak(totalKwh)} ${peakUnit(totalKwh, "kWh")}`,
  };
}

/** Peak + period-total captions under the chart (design 1d). */
function StatCaps({ solar, timespan }: { solar?: SolarData; timespan: string }) {
  const c = capValues(solar, timespan);
  if (!c.hasData) return null;
  return (
    <GlassCard className="mt-3 flex-row items-stretch px-4 py-3.5">
      <Cap label={c.isHourly ? "Peak" : "Peak day"} value={c.peakText} />
      <View className="mx-4 w-px self-stretch bg-glass-border" />
      <Cap label={c.isHourly ? "Today total" : "Period total"} value={c.totalText} />
    </GlassCard>
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
      <ScrollView contentContainerClassName="gap-4 p-4">
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

        <GlassCard strong elevated className="p-[18px]">
          <View className="mb-3">
            <Text className="text-[19px] font-extrabold text-text-primary">Power Generation</Text>
            <Text className="mt-0.5 text-[13px] font-medium text-text-muted">
              {chartSubtitle(timespan, pickerDate)}
            </Text>
          </View>

          <View className="mb-4">
            <SegmentedControl value={timespan} onChange={setTimespan} />
          </View>

          <SolarChart data={chartData} timespan={timespan} loading={isLoading} height={300} />

          {!isLoading ? <StatCaps solar={solar} timespan={timespan} /> : null}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
