"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  chartSubtitle,
  formatPeak,
  getPeakOutput,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DateSelector } from "@/components/ui/DateSelector";
import { SolarChart } from "@/components/charts/SolarChart";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

const ZERO = {
  todayGeneration: 0,
  totalGeneration: 0,
  todayRevenue: 0,
  totalRevenue: 0,
};

/** One compact stat inside the top-right header widget. */
function HeaderStat({
  label,
  value,
  unit,
  loading,
}: {
  label: string;
  value: string;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.4px] text-text-muted">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mx-auto mt-1 h-4 w-12" />
      ) : (
        <p className="whitespace-nowrap text-[15px] font-extrabold leading-tight text-text-primary">
          {value}
          {unit ? (
            <span className="ml-0.5 text-[10px] font-bold text-text-muted">{unit}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}

export default function SolarPage() {
  const { growatt } = useCore();

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

  const headerWidget = (
    <GlassCard className="flex items-center gap-3.5 rounded-[var(--radius-md)] px-4 py-2">
      <HeaderStat
        label="Generation"
        value={metrics.todayGeneration.toFixed(1)}
        unit="kWh"
        loading={isLoading}
      />
      <span className="h-7 w-px bg-glass-border" />
      <HeaderStat
        label="Peak"
        value={peak ? formatPeak(peak.value) : "—"}
        unit={peak ? peak.unit : "W"}
        loading={isLoading}
      />
    </GlassCard>
  );

  return (
    <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-4">
      <PageHeader
        title="Solar Production"
        subtitle="Real-time photovoltaic intelligence"
        right={headerWidget}
      />

      <GlassCard strong elevated className="flex min-h-0 flex-1 flex-col p-[22px]">
        <div className="mb-[18px] flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[19px] font-extrabold text-text-primary">
              Power Generation
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-text-muted">
              {chartSubtitle(timespan, pickerDate)}
            </p>
          </div>
          <div className="flex w-full flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:w-auto">
            <div className="w-full sm:w-auto sm:min-w-[300px]">
              <SegmentedControl value={timespan} onChange={setTimespan} />
            </div>
            <DateSelector
              selectedDate={pickerDate}
              onDateSelect={setPickerDate}
              disabled={isLoading}
            />
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
