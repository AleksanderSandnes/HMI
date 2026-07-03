"use client";

import {
  chartSubtitle,
  formatPeak,
  getPeakOutput,
  peakUnit,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { SolarChart } from "@/components/charts/SolarChart";
import { DateSelector } from "@/components/ui/DateSelector";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCore } from "@/lib/hooks/useCore";
import { useI18n } from "@/lib/i18n";
import { useNavStats } from "@/lib/nav-stats";

const ZERO = {
  todayGeneration: 0,
  totalGeneration: 0,
  todayRevenue: 0,
  totalRevenue: 0,
};

export default function SolarPage() {
  const { growatt } = useCore();
  const { locale, t } = useI18n();
  const { setSolarStats } = useNavStats();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [timespan, setTimespan] = useState("hourly");
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));

  const { data: solar, isLoading } = useQuery<SolarData>({
    queryKey: ["solar", timespan, pickerDate],
    queryFn: () => growatt.fetchSolarData(timespan as never, pickerDate),
  });

  const metrics = solar?.metrics ?? ZERO;
  const chartData = solar?.chartData ?? { labels: [], datasets: [{ data: [] }] };
  const peak = getPeakOutput(chartData, timespan);

  // Publish generation/peak to the top nav widget while this page is mounted.
  const generation = metrics.todayGeneration.toFixed(1);
  const peakValue = peak ? formatPeak(peak.value) : "—";
  const peakUnitStr = peak ? peakUnit(peak.value, peak.unit) : "W";
  useEffect(() => {
    setSolarStats({
      generation,
      genUnit: "kWh",
      peak: peakValue,
      peakUnit: peakUnitStr,
    });
    return () => setSolarStats(null);
  }, [generation, peakValue, peakUnitStr, setSolarStats]);

  return (
    <div className="mx-auto flex w-full max-w-[92.5rem] flex-col gap-4 md:h-full 3xl:max-w-[100rem]">
      <PageHeader
        title={t("solar.title")}
        subtitle={t("solar.subtitle")}
        right={
          <DateSelector
            selectedDate={pickerDate}
            onDateSelect={setPickerDate}
            disabled={isLoading}
          />
        }
      />

      <GlassCard strong elevated className="flex min-h-0 flex-1 flex-col p-[1.375rem]">
        <div className="mb-[1.125rem] flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[1.1875rem] font-extrabold text-text-primary">
              {t("solar.powerGeneration")}
            </h2>
            <p className="mt-0.5 text-[0.8125rem] font-medium text-text-muted">
              {chartSubtitle(timespan, pickerDate, locale)}
            </p>
          </div>
          <div className="w-full sm:w-[28.75rem]">
            <SegmentedControl value={timespan} onChange={setTimespan} />
          </div>
        </div>

        <div className="min-h-[13.75rem] flex-1">
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
