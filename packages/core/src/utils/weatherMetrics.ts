import type { TranslationKey } from "../i18n";

// Weather-page metric metadata shared by web and mobile. Icons are
// platform-specific (lucide vs Ionicons render props), so each app keeps its
// own icon map keyed by `WeatherMetricKey`.

export interface WeatherMetricMeta {
  key: string;
  labelKey: TranslationKey;
  unit: string;
  titleKey: TranslationKey;
  accent: string;
  series: { labelKey: TranslationKey; color: string }[];
}

export const WEATHER_METRICS: WeatherMetricMeta[] = [
  {
    key: "temperature",
    labelKey: "weather.chip.temp",
    unit: "°C",
    titleKey: "weather.temperature",
    accent: "#fb7185",
    series: [
      { labelKey: "weather.temperature", color: "#fb7185" },
      { labelKey: "weather.dewPoint", color: "#34d399" },
    ],
  },
  {
    key: "windSpeed",
    labelKey: "weather.chip.wind",
    unit: "km/h",
    titleKey: "weather.wind",
    accent: "#60a5fa",
    series: [
      { labelKey: "weather.windSpeed", color: "#60a5fa" },
      { labelKey: "weather.windGust", color: "#fbbf24" },
    ],
  },
  {
    key: "precip",
    labelKey: "weather.chip.rain",
    unit: "mm",
    titleKey: "weather.precipitation",
    accent: "#38bdf8",
    series: [
      { labelKey: "weather.accumTotal", color: "#38bdf8" },
      { labelKey: "weather.rate", color: "#34d399" },
    ],
  },
  {
    key: "humidity",
    labelKey: "weather.chip.humidity",
    unit: "%",
    titleKey: "weather.humidity",
    accent: "#22d3ee",
    series: [{ labelKey: "weather.humidity", color: "#22d3ee" }],
  },
  {
    key: "pressure",
    labelKey: "weather.chip.pressure",
    unit: "hPa",
    titleKey: "weather.pressure",
    accent: "#a78bfa",
    series: [{ labelKey: "weather.pressure", color: "#a78bfa" }],
  },
  {
    key: "solarRadiation",
    labelKey: "weather.chip.solar",
    unit: "W/m²",
    titleKey: "weather.solarRadiation",
    accent: "#fbbf24",
    series: [{ labelKey: "weather.solarRadiation", color: "#fbbf24" }],
  },
  {
    key: "uvIndex",
    labelKey: "weather.chip.uv",
    unit: "UV",
    titleKey: "weather.uvIndex",
    accent: "#c084fc",
    series: [{ labelKey: "weather.uvIndex", color: "#c084fc" }],
  },
];

export type WeatherMetricKey = (typeof WEATHER_METRICS)[number]["key"];

/** Timespan options for the weather chart's segmented control. */
export const WEATHER_TIME_OPTIONS: { labelKey: TranslationKey; value: string }[] = [
  { labelKey: "timespan.hourly", value: "hourly" },
  { labelKey: "timespan.weekly", value: "weekly" },
];
