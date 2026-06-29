"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  chartSubtitle,
  formatPeak,
  getPeakOutput,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { useNavStats } from "@/lib/nav-stats";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DateSelector } from "@/components/ui/DateSelector";
import { SolarChart } from "@/components/charts/SolarChart";
import { PageHeader } from "@/components/PageHeader";

const ZERO = {
  todayGeneration: 0,
  totalGeneration: 0,
  todayRevenue: 0,
  totalRevenue: 0,
};

export default function SolarPage() {
  const { growatt } = useCore();
  const { setSolarStats } = useNavStats();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));

  const { data: solar, isLoading } = useQuery<SolarData>({
    queryKey: ["solar", timespan, pickerDate],
    queryFn: () => growatt.fetchSolarData(timespan as never, pickerDate, false),
  });

  const metrics = solar?.metrics ?? ZERO;
  const chartData = solar?.chartData ?? { labels: [], datasets: [{ data: [] }] };
  const peak = getPeakOutput(chartData, timespan);

  // Publish generation/peak to the top nav widget while this page is mounted.
  const generation = metrics.todayGeneration.toFixed(1);
  const peakValue = peak ? formatPeak(peak.value) : "—";
  const peakUnit = peak ? peak.unit : "W";
  useEffect(() => {
    setSolarStats({ generation, genUnit: "kWh", peak: peakValue, peakUnit });
    return () => setSolarStats(null);
  }, [generation, peakValue, peakUnit, setSolarStats]);

  return (
    <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-4">
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

      <GlassCard strong elevated className="flex min-h-0 flex-1 flex-col p-[22px]">
        <div className="mb-[18px] flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[19px] font-extrabold text-text-primary">
              Power Generation
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-text-muted">
              {chartSubtitle(timespan, pickerDate)}
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[300px]">
            <SegmentedControl value={timespan} onChange={setTimespan} />
          </div>
        </div>

        <div className="min-h-[220px] flex-1">
          <SolarChart
            data={chartData}
            timespan={timespan}
            loading={isLoading}
            heightClass="h-full"
          />
        </div>
      </GlassCard>
    </div>
  );
}
