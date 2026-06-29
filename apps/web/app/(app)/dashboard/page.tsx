"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Coins, Leaf, Mountain, Sun, Zap } from "lucide-react";
import {
  CO2_PER_KWH,
  chartSubtitle,
  comparisonLabel,
  formatCO2,
  formatPeak,
  getPeakOutput,
  peakSublabel,
  periodLabel,
  previousPeriodDate,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatTile } from "@/components/ui/StatTile";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DateSelector } from "@/components/ui/DateSelector";
import { SolarChart } from "@/components/charts/SolarChart";

const ZERO = {
  todayGeneration: 0,
  totalGeneration: 0,
  todayRevenue: 0,
  totalRevenue: 0,
};

function pctDelta(curr: number, prev: number): number | null {
  return prev > 0 ? ((curr - prev) / prev) * 100 : null;
}

export default function DashboardPage() {
  const { growatt, weather } = useCore();

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

  const { data: weatherNow } = useQuery({
    queryKey: ["weather-current"],
    queryFn: () => weather.getCurrentWeatherData(),
    staleTime: 60_000,
  });

  const metrics = solar?.metrics ?? ZERO;
  const chartData = solar?.chartData ?? { labels: [], datasets: [{ data: [] }] };
  const peak = getPeakOutput(chartData, timespan);
  const co2 = formatCO2(metrics.todayGeneration * CO2_PER_KWH);
  const pLabel = periodLabel(timespan);

  const genDelta = prev
    ? pctDelta(metrics.todayGeneration, prev.metrics.todayGeneration)
    : null;
  const revDelta = prev
    ? pctDelta(metrics.todayRevenue, prev.metrics.todayRevenue)
    : null;

  const obs = weatherNow?.observations?.[0];
  const currentTemp = obs?.metric?.temp;
  const neighborhood = obs?.neighborhood;

  const prettyDate = new Date(pickerDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const controls = (
    <div className="flex flex-col gap-4">
      <GlassCard strong className="p-[18px]">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.5px] text-text-muted">
          Time range
        </p>
        <SegmentedControl value={timespan} onChange={setTimespan} />
      </GlassCard>
      <DateSelector
        selectedDate={pickerDate}
        onDateSelect={setPickerDate}
        disabled={isLoading}
      />
    </div>
  );

  const chartCard = (
    <GlassCard strong elevated className="p-[22px]">
      <div className="mb-[18px] flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-[19px] font-extrabold text-text-primary">
            Power Generation
          </h2>
          <p className="mt-0.5 text-[13px] font-medium text-text-muted">
            {chartSubtitle(timespan, pickerDate)}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-[var(--radius-pill)] border border-glass-border bg-glass-fill px-3.5 py-2 sm:flex">
          <CalendarDays size={12} className="text-text-secondary" />
          <span className="text-[13px] font-bold text-text-secondary">
            {prettyDate}
          </span>
        </div>
      </div>
      <SolarChart data={chartData} timespan={timespan} loading={isLoading} height={380} />
    </GlassCard>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">
            Solar Production
          </h1>
          <p className="mt-1 text-[14.5px] font-medium text-text-muted">
            Real-time photovoltaic intelligence
          </p>
        </div>
        <GlassCard className="flex items-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-2">
          <Sun size={13} className="text-solar-light" />
          <span className="text-[13px] font-bold text-text-secondary">
            {currentTemp != null
              ? `${Math.round(currentTemp)}° · ${neighborhood || "Sandnes"}`
              : "Loading…"}
          </span>
        </GlassCard>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Zap}
          gradient="energy"
          label="Generation"
          value={metrics.todayGeneration.toFixed(1)}
          unit="kWh"
          sublabel={genDelta != null ? comparisonLabel(timespan) : pLabel}
          delta={genDelta}
          loading={isLoading}
        />
        <StatTile
          icon={Coins}
          gradient="revenue"
          label="Revenue"
          value={metrics.todayRevenue.toFixed(0)}
          unit="kr"
          sublabel={revDelta != null ? comparisonLabel(timespan) : pLabel}
          delta={revDelta}
          loading={isLoading}
        />
        <StatTile
          icon={Leaf}
          gradient="co2"
          label="CO₂ avoided"
          value={co2.value}
          unit={co2.unit}
          sublabel="vs grid electricity"
          loading={isLoading}
        />
        <StatTile
          icon={Mountain}
          gradient="solar"
          label="Peak output"
          value={peak ? formatPeak(peak.value) : "—"}
          unit={peak?.unit}
          sublabel={peak ? peakSublabel(timespan, peak.label) : "No data"}
          loading={isLoading}
        />
      </div>

      {/* Chart + controls */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">{chartCard}</div>
        <div className="lg:col-span-1">{controls}</div>
      </div>
    </div>
  );
}
