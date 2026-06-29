"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  chartSubtitle,
  comparisonLabel,
  formatPeak,
  getPeakOutput,
  peakSublabel,
  percentDelta,
  periodLabel,
  previousPeriodDate,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DateSelector } from "@/components/ui/DateSelector";
import { SolarChart } from "@/components/charts/SolarChart";
import { PageHeader } from "@/components/PageHeader";
import { WeatherChip } from "@/components/WeatherChip";
import { Skeleton } from "@/components/ui/Skeleton";

const ZERO = {
  todayGeneration: 0,
  totalGeneration: 0,
  todayRevenue: 0,
  totalRevenue: 0,
};

/** Compact right-aligned stat readout shown in the chart header. */
function Readout({
  label,
  value,
  unit,
  sub,
  loading,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-text-muted">
        {label}
      </p>
      {loading ? (
        <Skeleton className="ml-auto mt-1.5 h-6 w-16" />
      ) : (
        <p className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-[-0.4px] text-text-primary">
          {value}
          {unit ? (
            <span className="ml-1 text-[11px] font-bold text-text-muted">{unit}</span>
          ) : null}
        </p>
      )}
      {sub && !loading ? (
        <p className="mt-0.5 text-[10px] font-medium text-text-muted">{sub}</p>
      ) : null}
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

  const { data: prev } = useQuery<SolarData>({
    queryKey: ["solar-cmp", timespan, pickerDate],
    queryFn: () =>
      growatt.fetchSolarData(
        timespan as never,
        previousPeriodDate(timespan, pickerDate),
        false
      ),
    enabled: !!solar,
  });

  const metrics = solar?.metrics ?? ZERO;
  const chartData = solar?.chartData ?? { labels: [], datasets: [{ data: [] }] };
  const peak = getPeakOutput(chartData, timespan);

  const genDelta = prev
    ? percentDelta(metrics.todayGeneration, prev.metrics.todayGeneration)
    : null;
  const genSub =
    genDelta != null
      ? `${genDelta >= 0 ? "+" : ""}${genDelta.toFixed(0)}% ${comparisonLabel(timespan)}`
      : periodLabel(timespan);

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
      <PageHeader
        title="Solar Production"
        subtitle="Real-time photovoltaic intelligence"
        right={<WeatherChip />}
      />

      <GlassCard strong elevated className="p-[22px]">
        <div className="mb-[18px] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[19px] font-extrabold text-text-primary">
              Power Generation
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-text-muted">
              {chartSubtitle(timespan, pickerDate)}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3.5 lg:items-end">
            <div className="flex items-start justify-end gap-7">
              <Readout
                label="Generation"
                value={metrics.todayGeneration.toFixed(1)}
                unit="kWh"
                sub={genSub}
                loading={isLoading}
              />
              <Readout
                label="Peak output"
                value={peak ? formatPeak(peak.value) : "—"}
                unit={peak?.unit}
                sub={peak ? peakSublabel(timespan, peak.label) : "No data"}
                loading={isLoading}
              />
            </div>
            <div className="w-full lg:w-auto lg:min-w-[320px]">
              <SegmentedControl value={timespan} onChange={setTimespan} />
            </div>
          </div>
        </div>

        <SolarChart
          data={chartData}
          timespan={timespan}
          loading={isLoading}
          heightClass="h-[clamp(260px,46vh,560px)]"
        />

        <div className="mt-4">
          <DateSelector
            selectedDate={pickerDate}
            onDateSelect={setPickerDate}
            disabled={isLoading}
          />
        </div>
      </GlassCard>
    </div>
  );
}
