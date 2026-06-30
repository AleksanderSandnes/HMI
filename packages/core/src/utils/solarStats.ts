// Pure solar dashboard stat/label helpers (ported from mobile
// src/utils/solarStats.ts). No platform imports.

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

export function periodLabel(timespan: string): string {
  if (timespan === "hourly") return "Today";
  if (timespan === "weekly") return "This week";
  if (timespan === "monthly") return "This month";
  if (timespan === "total") return "Last 5 years";
  return "This year";
}

export function comparisonLabel(timespan: string): string {
  if (timespan === "hourly") return "vs yesterday";
  if (timespan === "weekly") return "vs last week";
  if (timespan === "monthly") return "vs last month";
  if (timespan === "total") return "vs prior 5 years";
  return "vs last year";
}

export function chartSubtitle(timespan: string, dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString("en-US", { month: "long" });
  if (timespan === "hourly")
    return `Power output · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (timespan === "weekly") return `7-day output from ${month} ${d.getDate()}`;
  if (timespan === "monthly") return `Daily output · ${month} ${d.getFullYear()}`;
  if (timespan === "total") return `Yearly output · last 5 years`;
  return `Monthly output · ${d.getFullYear()}`;
}

export function formatCO2(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(2), unit: "t" };
  return { value: kg.toFixed(kg < 10 ? 1 : 0), unit: "kg" };
}

export function formatPeak(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1);
  return v.toFixed(v < 10 ? 1 : 0);
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

const DAY_NAMES: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const MONTH_NAMES: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

/** Human-friendly "when" for the peak-output tile. */
export function peakSublabel(timespan: string, label: string): string {
  if (!label) return "No data";
  if (timespan === "hourly") return `at ${label}`;
  if (timespan === "weekly") return `on ${DAY_NAMES[label] ?? label}`;
  if (timespan === "monthly") return `on day ${label}`;
  if (timespan === "total") return `in ${label}`;
  return `in ${MONTH_NAMES[label] ?? label}`;
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
