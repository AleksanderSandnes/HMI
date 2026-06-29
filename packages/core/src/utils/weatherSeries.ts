// Weather observation → chart-series transform (ported/consolidated from mobile
// useHistoricalWeatherData). Pure: takes raw observations + metric + timespan and
// returns x-axis labels + one number[] per series. No platform imports.

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
  solarRadiation: [(it) => n(it.solarRadiationHigh)],
  uvIndex: [(it) => n(it.uvHigh)],
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface WeatherSeriesResult {
  labels: string[];
  series: number[][];
}

/**
 * Build x-axis labels + per-series value arrays for a weather metric.
 * - hourly: one point per observation, "HH:MM" labels (chart thins them).
 * - weekly: sampled every 3 hours, day-boundary labels.
 */
export function buildWeatherSeries(
  observations: Obs[],
  dataType: string,
  timespan: string
): WeatherSeriesResult {
  const extractors = EXTRACTORS[dataType] ?? EXTRACTORS.temperature;
  if (!observations?.length) return { labels: [], series: extractors.map(() => []) };

  const isWeekly = timespan === 'weekly';
  const data = isWeekly
    ? observations.filter((it) => {
        const d = new Date(it.obsTimeLocal || it.date);
        return d.getHours() % 3 === 0;
      })
    : observations;

  const labels = data.map((it, index) => {
    if (isWeekly) {
      const d = new Date(it.obsTimeLocal || it.date);
      const day = DAY_NAMES[d.getDay()];
      if (d.getHours() === 0) return `${day} ${d.getMonth() + 1}/${d.getDate()}`;
      if (index % 8 === 0) return day;
      return '';
    }
    const time = (it.obsTimeLocal || '').split(' ')[1] || '';
    const [hour, minute] = time.split(':');
    if (hour == null) return '';
    return `${hour}:${minute ?? '00'}`;
  });

  const series = extractors.map((fn) => data.map(fn));
  return { labels, series };
}
