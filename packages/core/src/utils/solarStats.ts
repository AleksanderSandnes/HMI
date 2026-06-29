// Pure solar dashboard stat/label helpers (ported from mobile
// src/utils/solarStats.ts). No platform imports.

export const CO2_PER_KWH = 0.4; // kg CO₂ avoided per kWh of solar (grid average)

export type SimpleChartData = {
  labels: string[];
  datasets: { data: number[] }[];
};

export type PeakOutput = {
  value: number;
  label: string;
  unit: string;
};

export const toISO = (d: Date) => d.toISOString().split('T')[0];

export function previousPeriodDate(timespan: string, dateStr: string): string {
  const d = new Date(dateStr);
  switch (timespan) {
    case 'hourly':
      d.setDate(d.getDate() - 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() - 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() - 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return toISO(d);
}

export function periodLabel(timespan: string): string {
  return timespan === 'hourly'
    ? 'Today'
    : timespan === 'weekly'
      ? 'This week'
      : timespan === 'monthly'
        ? 'This month'
        : 'This year';
}

export function comparisonLabel(timespan: string): string {
  return timespan === 'hourly'
    ? 'vs yesterday'
    : timespan === 'weekly'
      ? 'vs last week'
      : timespan === 'monthly'
        ? 'vs last month'
        : 'vs last year';
}

export function chartSubtitle(timespan: string, dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'long' });
  if (timespan === 'hourly')
    return `Power output · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  if (timespan === 'weekly') return `7-day output from ${month} ${d.getDate()}`;
  if (timespan === 'monthly') return `Daily output · ${month} ${d.getFullYear()}`;
  return `Monthly output · ${d.getFullYear()}`;
}

export function formatCO2(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(2), unit: 't' };
  return { value: kg.toFixed(kg < 10 ? 1 : 0), unit: 'kg' };
}

export function formatPeak(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1);
  return v.toFixed(v < 10 ? 1 : 0);
}

const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const MONTH_NAMES: Record<string, string> = {
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

/** Human-friendly "when" for the peak-output tile. */
export function peakSublabel(timespan: string, label: string): string {
  if (!label) return 'No data';
  if (timespan === 'hourly') return `at ${label}`;
  if (timespan === 'weekly') return `on ${DAY_NAMES[label] ?? label}`;
  if (timespan === 'monthly') return `on day ${label}`;
  return `in ${MONTH_NAMES[label] ?? label}`;
}

export function getPeakOutput(
  data: SimpleChartData,
  timespan: string
): PeakOutput | null {
  const vals = data?.datasets?.[0]?.data ?? [];
  if (!vals.length) return null;
  const max = Math.max(...vals);
  if (max <= 0) return null;
  const idx = vals.indexOf(max);
  return {
    value: max,
    label: data.labels[idx] ?? '',
    unit: timespan === 'hourly' ? 'W' : 'kWh',
  };
}

/** Compact axis number format (e.g. 1.2k, 3M). */
export function formatNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `${Math.round(v)}`;
}
