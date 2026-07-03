"use client";

import {
  chartSubtitle,
  formatPeak,
  getPeakOutput,
  peakUnit,
  solarCapValues,
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

function Cap({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[0.625rem] font-bold uppercase tracking-[0.4px] text-text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-[1.125rem] font-extrabold tracking-[-0.3px] text-text-primary">
        {value}
      </p>
    </div>
  );
}

/**
 * Peak + period-total captions under the chart (mirror of the mobile app's
 * StatCaps). Below lg only — desktop surfaces gen/peak in the nav widget.
 */
function StatCaps({ solar, timespan }: { solar?: SolarData; timespan: string }) {
  const { t } = useI18n();
  const c = solarCapValues(solar, timespan);
  if (!c.hasData) return null;
  return (
    <div className="mt-3 flex shrink-0 items-stretch rounded-[var(--radius-md)] border border-glass-border px-4 py-3.5 lg:hidden">
      <Cap label={t(c.labels[0])} value={c.peakText} />
      <div className="mx-4 w-px self-stretch bg-glass-border" />
      <Cap label={t(c.labels[1])} value={c.totalText} />
    </div>
  );
}

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

        {/* Below md the page scrolls naturally, so the chart needs a definite
            height (percent heights collapse against min-h alone). */}
        <div className="h-[clamp(15rem,45vh,32.5rem)] md:h-auto md:min-h-[13.75rem] md:flex-1">
          <SolarChart
            data={chartData}
            timespan={timespan}
            loading={isLoading}
            heightClass="h-full"
          />
        </div>

        {!isLoading ? <StatCaps solar={solar} timespan={timespan} /> : null}
      </GlassCard>
    </div>
  );
}
