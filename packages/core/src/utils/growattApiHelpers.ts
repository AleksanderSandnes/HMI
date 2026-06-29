// Pure Growatt chart-math helpers (ported verbatim from mobile src/utils/growattApiHelpers.ts).
// No platform imports — safe for web (Next.js) and native (Expo).
import type { SolarMetrics } from '../types/solar';

/**
 * Clean and filter power data to handle null/undefined values
 */
export function cleanPowerData(powerValues: any[]): number[] {
  return powerValues.map((value: any) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return Number(value);
  });
}

/**
 * Generate time labels for 5-minute intervals (288 values = 24 hours * 12 intervals/hour)
 */
export function generateTimeLabels(): string[] {
  const labels = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      labels.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  return labels;
}

/**
 * Filter and optimize chart data for better visualization
 * Removes zero values and creates smart labeling
 */
export function optimizeChartData(
  powerValues: number[],
  labels: string[],
  timespan: string,
  isMobile: boolean = false
): { data: number[]; labels: string[] } {
  // Find the range of meaningful data (where power > 5W to avoid noise)
  const meaningfulThreshold = 5; // Watts
  const firstMeaningfulIndex = powerValues.findIndex(
    (value) => value > meaningfulThreshold
  );
  const lastMeaningfulIndex = powerValues
    .slice()
    .reverse()
    .findIndex((value) => value > meaningfulThreshold);
  const actualLastIndex =
    lastMeaningfulIndex >= 0
      ? powerValues.length - 1 - lastMeaningfulIndex
      : -1;

  if (firstMeaningfulIndex === -1 || actualLastIndex === -1) {
    // No meaningful data found
    return { data: [0], labels: ['No Data'] };
  }

  // Extract the meaningful range with minimal padding to avoid showing zeros
  const startIndex = Math.max(0, firstMeaningfulIndex - 6); // 30 minutes before first meaningful data
  const endIndex = Math.min(powerValues.length - 1, actualLastIndex + 6); // 30 minutes after last meaningful data

  const rangedData = powerValues.slice(startIndex, endIndex + 1);
  const rangedLabels = labels.slice(startIndex, endIndex + 1);

  // Determine optimal sampling based on timespan and device
  let samplingInterval: number;

  if (timespan === 'hourly') {
    // For hourly view: Mobile shows every hour, Desktop shows every hour too
    samplingInterval = isMobile ? 12 : 12; // Both show every hour (12 * 5min = 60min)
  } else {
    // For other timespans, use current logic
    samplingInterval = 12; // Every hour
  }

  // Sample the data at the determined interval
  const sampledData: number[] = [];
  const sampledLabels: string[] = [];

  for (let i = 0; i < rangedData.length; i += samplingInterval) {
    sampledData.push(rangedData[i]);
    // Format labels to show clean hour labels
    const label = rangedLabels[i];
    const [hour, minute] = label.split(':');

    // For hourly view, only show full hours
    if (timespan === 'hourly') {
      if (minute === '00') {
        sampledLabels.push(`${hour}:00`);
      } else {
        // Round to nearest hour for cleaner display
        const hourNum = parseInt(hour);
        const displayHour = minute >= '30' ? hourNum + 1 : hourNum;
        sampledLabels.push(`${displayHour.toString().padStart(2, '0')}:00`);
      }
    } else {
      // For other timespans, show hour:minute as before
      if (minute === '00') {
        sampledLabels.push(`${hour}:00`);
      } else if (minute === '30' && samplingInterval <= 6) {
        sampledLabels.push(`${hour}:30`);
      } else {
        sampledLabels.push(label);
      }
    }
  }

  return {
    data: sampledData,
    labels: sampledLabels,
  };
}

/**
 * Calculate metrics from power data
 */
export function calculateMetrics(
  powerValues: number[],
  timespan: string,
  pricePerKwh: number = 1,
  totalGenerationFromApi?: number,
  todayGenerationFromApi?: number,
  monthGenerationFromApi?: number
): SolarMetrics {
  // Sum power values and convert to kWh (5-minute intervals, so divide by 12 for hourly average)
  const totalGenerationWh =
    powerValues.reduce((sum, value) => sum + value, 0) / 12;
  const calculatedTodayGenerationKwh = totalGenerationWh / 1000;

  // Use API values if provided, otherwise fall back to calculated values
  let finalTodayGeneration: number;
  let finalTotalGeneration: number;

  // Determine what to show based on timespan
  switch (timespan) {
    case 'monthly':
      // For monthly view, show month generation as "today" and total as "total"
      finalTodayGeneration =
        monthGenerationFromApi ?? calculatedTodayGenerationKwh;
      finalTotalGeneration =
        totalGenerationFromApi ?? calculatedTodayGenerationKwh;
      break;
    case 'hourly':
    default:
      // For hourly view, show today's generation and total
      finalTodayGeneration =
        todayGenerationFromApi ?? calculatedTodayGenerationKwh;
      finalTotalGeneration =
        totalGenerationFromApi ?? calculatedTodayGenerationKwh;
      break;
  }

  return {
    todayGeneration: finalTodayGeneration,
    totalGeneration: finalTotalGeneration,
    todayRevenue: finalTodayGeneration * pricePerKwh,
    totalRevenue: finalTotalGeneration * pricePerKwh,
  };
}

/**
 * Weekday + month label sets for the aggregated bar charts.
 */
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Build x-axis labels for the aggregated (week/month/year) bar charts.
 * - weekly: weekday abbreviation for each calendar day (e.g. "Wed")
 * - monthly: day-of-month number (1..31)
 * - yearly: month abbreviation (Jan..Dec)
 */
export function buildAggregatedLabels(
  timespan: string,
  count: number,
  dayLabels?: string[]
): string[] {
  if (timespan === 'weekly') {
    if (dayLabels && dayLabels.length) {
      return dayLabels.map((d) => {
        const [year, month, day] = d.split('-').map(Number);
        const date = new Date(year, (month || 1) - 1, day || 1);
        return WEEKDAY_LABELS[date.getDay()] ?? d;
      });
    }
    return Array.from({ length: count }, (_, i) => `Day ${i + 1}`);
  }

  if (timespan === 'yearly') {
    return Array.from({ length: count }, (_, i) => MONTH_LABELS[i] ?? `${i + 1}`);
  }

  if (timespan === 'total') {
    // One label per year, ending on the current year (e.g. 2022..2026).
    const endYear = new Date().getFullYear();
    return Array.from({ length: count }, (_, i) => `${endYear - (count - 1) + i}`);
  }

  // monthly -> day of month
  return Array.from({ length: count }, (_, i) => `${i + 1}`);
}
