// Weather observation → chart-series transform (ported/consolidated from mobile
// useHistoricalWeatherData). Pure: takes raw observations + metric + timespan and
// returns x-axis labels + one number[] per series. No platform imports.
import { WEEKDAY_ABBR } from "../constants";

type Obs = Record<string, any>;

const n = (v: any): number => (v == null || isNaN(Number(v)) ? 0 : Number(v));
const m = (it: Obs) => it.metric ?? {};

/** Per-metric series extractors, in the same order as the UI's series config. */
const EXTRACTORS: Record<string, ((it: Obs) => number)[]> = {
  temperature: [
    (it) => n(m(it).tempAvg ?? m(it).tempHigh ?? it.tempHigh),
    (it) => n(m(it).dewptAvg ?? m(it).dewptHigh ?? it.dewptHigh),
  ],
  windSpeed: [
    (it) => n(m(it).windspeedAvg ?? m(it).windspeedHigh ?? it.windspeedHigh),
    (it) => n(m(it).windgustAvg ?? m(it).windgustHigh ?? it.windgustHigh),
  ],
  precip: [
    (it) => n(m(it).precipTotal ?? it.precipTotal),
    (it) => n(m(it).precipRate ?? it.precipRate),
  ],
  pressure: [(it) => n(m(it).pressureMax ?? it.pressureMax ?? it.pressureHigh)],
  humidity: [(it) => n(it.humidityAvg ?? it.humidityHigh ?? it.humidity)],
  solarRadiation: [(it) => n(it.solarRadiationHigh)],
  uvIndex: [(it) => n(it.uvHigh)],
};

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

/** Wind direction in degrees → 16-point compass label (e.g. 213 → "SSW"). */
export function windCompass(deg: number | null | undefined): string | null {
  if (deg == null || isNaN(Number(deg))) return null;
  return COMPASS[Math.round((Number(deg) % 360) / 22.5) % 16];
}

export interface WeatherSeriesResult {
  labels: string[];
  series: number[][];
  /**
   * The subset of `labels` that should be rendered as x-axis ticks. For weekly
   * views this is one label per day boundary, so the chart can render every day
   * (instead of relying on width-based tick thinning, which dropped most days).
   * Undefined for hourly (the chart thins those itself).
   */
  ticks?: string[];
}

/**
 * Build x-axis labels + per-series value arrays for a weather metric.
 * - hourly: one point per observation, "HH:MM" labels (chart thins them).
 * - weekly: sampled every 3 hours, day-boundary labels.
 */
export function buildWeatherSeries(
  observations: Obs[],
  dataType: string,
  timespan: string,
): WeatherSeriesResult {
  const extractors = EXTRACTORS[dataType] ?? EXTRACTORS.temperature;
  if (!observations?.length) return { labels: [], series: extractors.map(() => []) };

  const isWeekly = timespan === "weekly";
  const data = isWeekly
    ? observations.filter((it) => {
        const d = new Date(it.obsTimeLocal || it.date);
        return d.getHours() % 3 === 0;
      })
    : observations;

  let lastDayKey = "";
  const labels = data.map((it) => {
    if (isWeekly) {
      const d = new Date(it.obsTimeLocal || it.date);
      const dayKey = `${d.getMonth()}-${d.getDate()}`;
      // First sample of each calendar day carries the day-boundary label; the
      // rest are blank so the line stays smooth but the axis isn't crowded.
      if (dayKey !== lastDayKey) {
        lastDayKey = dayKey;
        return `${WEEKDAY_ABBR[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
      }
      return "";
    }
    const time = (it.obsTimeLocal || "").split(" ")[1] || "";
    const [hh, mm] = time.split(":");
    if (hh == null || hh === "") return "";
    // Round to the nearest hour so the :59 PWS readings read as clean hours
    // (00:59 -> 01:00, 23:59 -> 00:00).
    let h = Number(hh);
    if (Number(mm) >= 30) h = (h + 1) % 24;
    return `${String(h).padStart(2, "0")}:00`;
  });

  const series = extractors.map((fn) => data.map(fn));

  // Weekly: hand the chart the exact day labels to tick on (deduped, blanks
  // dropped) so all seven days render regardless of pixel width.
  const ticks = isWeekly ? Array.from(new Set(labels.filter((l) => l !== ""))) : undefined;

  return { labels, series, ticks };
}

export interface WeatherDailyBands {
  /** Abbreviated weekday label per day (e.g. "Mon"), oldest → newest. */
  labels: string[];
  /** Daily minimum of the primary metric. */
  min: number[];
  /** Daily maximum of the primary metric. */
  max: number[];
  /** Daily mean of the primary metric. */
  avg: number[];
}

/**
 * Collapse weekly observations into up to 7 daily points (min / max / avg of the
 * primary metric) for the phone weekly view — a min–max band + average line —
 * instead of the dense ~3-hourly series the tablet/web shows. Uses the same
 * primary extractor as {@link buildWeatherSeries} so the values agree.
 */
export function buildWeatherDailyBands(observations: Obs[], dataType: string): WeatherDailyBands {
  const extract = (EXTRACTORS[dataType] ?? EXTRACTORS.temperature)[0];
  if (!observations?.length) return { labels: [], min: [], max: [], avg: [] };

  // Group readings by calendar day, preserving chronological order.
  const byDay = new Map<string, { date: Date; values: number[] }>();
  for (const it of observations) {
    const d = new Date(it.obsTimeLocal || it.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let bucket = byDay.get(key);
    if (!bucket) {
      bucket = { date: d, values: [] };
      byDay.set(key, bucket);
    }
    bucket.values.push(extract(it));
  }

  const days = Array.from(byDay.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-7);

  return {
    labels: days.map((day) => WEEKDAY_ABBR[day.date.getDay()]),
    min: days.map((day) => Math.min(...day.values)),
    max: days.map((day) => Math.max(...day.values)),
    avg: days.map((day) => day.values.reduce((s, v) => s + v, 0) / day.values.length),
  };
}
