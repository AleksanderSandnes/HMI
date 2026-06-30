import {
  chartSubtitle,
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
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
