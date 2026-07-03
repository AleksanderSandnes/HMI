// Pure solar dashboard stat/label helpers (ported from mobile
// src/utils/solarStats.ts). No platform imports.
import { MONTH_ABBR, WEEKDAY_ABBR } from "../constants";
import {
  DEFAULT_LOCALE,
  formatDayMonth,
  formatDayMonthLong,
  monthName,
  translate,
  weekdayName,
  type Locale,
  type TranslationKey,
} from "../i18n";
import type { SolarData } from "../types/solar";

export const CO2_PER_KWH = 0.4; // kg CO₂ avoided per kWh of solar (grid average)

export interface SimpleChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

export interface PeakOutput {
  value: number;
  label: string;
  unit: string;
}

export const toISO = (d: Date) => d.toISOString().split("T")[0];

export function previousPeriodDate(timespan: string, dateStr: string): string {
  const d = new Date(dateStr);
  switch (timespan) {
    case "hourly":
      d.setDate(d.getDate() - 1);
      break;
    case "weekly":
      d.setDate(d.getDate() - 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() - 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() - 1);
      break;
    case "total":
      d.setFullYear(d.getFullYear() - 5);
      break;
  }
  return toISO(d);
}

export function periodLabel(timespan: string, locale: Locale = DEFAULT_LOCALE): string {
  if (timespan === "hourly") return translate(locale, "solar.period.today");
  if (timespan === "weekly") return translate(locale, "solar.period.thisWeek");
  if (timespan === "monthly") return translate(locale, "solar.period.thisMonth");
  if (timespan === "total") return translate(locale, "solar.period.last5Years");
  return translate(locale, "solar.period.thisYear");
}

export function comparisonLabel(timespan: string, locale: Locale = DEFAULT_LOCALE): string {
  if (timespan === "hourly") return translate(locale, "solar.compare.vsYesterday");
  if (timespan === "weekly") return translate(locale, "solar.compare.vsLastWeek");
  if (timespan === "monthly") return translate(locale, "solar.compare.vsLastMonth");
  if (timespan === "total") return translate(locale, "solar.compare.vsPrior5Years");
  return translate(locale, "solar.compare.vsLastYear");
}

export function chartSubtitle(
  timespan: string,
  dateStr: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const d = new Date(dateStr);
  if (timespan === "hourly")
    return translate(locale, "solar.chart.powerOutput", { date: formatDayMonth(locale, d) });
  if (timespan === "weekly")
    return translate(locale, "solar.chart.weekOutput", { date: formatDayMonthLong(locale, d) });
  if (timespan === "monthly")
    return translate(locale, "solar.chart.dailyOutput", {
      month: monthName(locale, d.getMonth()),
      year: d.getFullYear(),
    });
  if (timespan === "total") return translate(locale, "solar.chart.yearlyOutput");
  return translate(locale, "solar.chart.monthlyOutput", { year: d.getFullYear() });
}

export function formatCO2(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(2), unit: "t" };
  return { value: kg.toFixed(kg < 10 ? 1 : 0), unit: "kg" };
}

export function formatPeak(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1);
  return v.toFixed(v < 10 ? 1 : 0);
}

/** Dashboard hero label: watts → kW with 2 decimals under 10 kW, else 1. */
export function kwLabel(watts: number | null | undefined): string {
  if (watts == null) return "—";
  const kw = watts / 1000;
  return kw.toFixed(kw >= 10 ? 1 : 2);
}

/**
 * The unit that matches {@link formatPeak} after its k-scaling, so a 10 900 W
 * peak reads "10.9 kW" (not "10.9 W") and a 1 500 kWh total reads "1.5 MWh".
 */
export function peakUnit(value: number, unit: string): string {
  if (value < 1000) return unit;
  if (unit === "W") return "kW";
  if (unit === "kWh") return "MWh";
  return unit;
}

// Chart data labels arrive as the English abbreviations from WEEKDAY_ABBR /
// MONTH_ABBR (they double as data keys); display names localize via the
// i18n date tables.
function fullDayName(label: string, locale: Locale): string {
  const idx = (WEEKDAY_ABBR as readonly string[]).indexOf(label);
  return idx >= 0 ? weekdayName(locale, idx) : label;
}

function fullMonthName(label: string, locale: Locale): string {
  const idx = (MONTH_ABBR as readonly string[]).indexOf(label);
  return idx >= 0 ? monthName(locale, idx) : label;
}

/** Human-friendly "when" for the peak-output tile. */
export function peakSublabel(
  timespan: string,
  label: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!label) return translate(locale, "solar.peak.noData");
  if (timespan === "hourly") return translate(locale, "solar.peak.atTime", { label });
  if (timespan === "weekly")
    return translate(locale, "solar.peak.onDay", { label: fullDayName(label, locale) });
  if (timespan === "monthly") return translate(locale, "solar.peak.onDayNumber", { label });
  if (timespan === "total") return translate(locale, "solar.peak.inPeriod", { label });
  return translate(locale, "solar.peak.inPeriod", { label: fullMonthName(label, locale) });
}

export function getPeakOutput(data: SimpleChartData, timespan: string): PeakOutput | null {
  const vals = data?.datasets?.[0]?.data ?? [];
  if (!vals.length) return null;
  const max = Math.max(...vals);
  if (max <= 0) return null;
  const idx = vals.indexOf(max);
  return {
    value: max,
    label: data.labels[idx] ?? "",
    unit: timespan === "hourly" ? "W" : "kWh",
  };
}

/** Compact axis number format (e.g. 1.2k, 3M). */
export function formatNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `${Math.round(v)}`;
}

/**
 * Range-aware number format for axis ticks/tooltips: more decimals for small
 * ranges, whole numbers for large ones. (Used by the weather chart.)
 */
export function formatMetric(v: number, range: number): string {
  if (Math.abs(v) >= 1000) {
    return range >= 100 ? `${Math.round(v)}` : `${(v / 1000).toFixed(1)}k`;
  }
  if (range >= 20) return `${Math.round(v)}`;
  if (range >= 2) return `${Math.round(v * 10) / 10}`;
  return `${Math.round(v * 100) / 100}`;
}

/** Percentage change of `curr` vs `prev`, or null when `prev` is non-positive. */
export function percentDelta(curr: number, prev: number): number | null {
  return prev > 0 ? ((curr - prev) / prev) * 100 : null;
}

// --- Chart stat caps (peak + period total under the solar chart) ---

/** Per-timespan label keys for the two stat caps: [peak, total]. */
export const SOLAR_CAP_LABELS: Record<string, [TranslationKey, TranslationKey]> = {
  hourly: ["solar.cap.peak", "solar.cap.todayTotal"],
  weekly: ["solar.cap.peakDay", "solar.cap.weekTotal"],
  monthly: ["solar.cap.peakDay", "solar.cap.monthTotal"],
  yearly: ["solar.cap.bestMonth", "solar.cap.yearTotal"],
  total: ["solar.cap.bestYear", "solar.cap.fiveYearTotal"],
};

function capPeakText(peak: PeakOutput | null): string {
  if (!peak) return "—";
  const v = `${formatPeak(peak.value)} ${peakUnit(peak.value, peak.unit)}`;
  return peak.label ? `${peak.label} · ${v}` : v;
}

/** Period total in kWh: today's metric for hourly, else the dataset sum. */
export function solarTotalKwh(solar: SolarData | undefined, timespan: string): number {
  if (timespan === "hourly") return solar?.metrics.todayGeneration ?? 0;
  const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
  return vals.reduce((a, b) => a + (b || 0), 0);
}

/**
 * Everything the StatCaps row needs: label keys (translate app-side) plus
 * formatted peak/total strings.
 */
export function solarCapValues(solar: SolarData | undefined, timespan: string) {
  const vals = solar?.chartData?.datasets?.[0]?.data ?? [];
  const peak = getPeakOutput(solar?.chartData as SimpleChartData, timespan);
  const total = solarTotalKwh(solar, timespan);
  return {
    hasData: vals.length > 0,
    labels: SOLAR_CAP_LABELS[timespan] ?? (["solar.cap.peak", "solar.cap.total"] as const),
    peakText: capPeakText(peak),
    totalText: `${formatPeak(total)} ${peakUnit(total, "kWh")}`,
  };
}
