// Deterministic, fictional solar + weather payloads for store screenshots. Nothing here
// comes from a real plant, station or person: values follow smooth synthetic curves so
// every regeneration produces identical, plausible-looking charts.

const PEAK_WATTS = 7_400;
const SUNRISE_HOUR = 5.5;
const SUNSET_HOUR = 21.5;

/** Bell-shaped irradiance factor (0..1) for a fractional hour of the day. */
function daylight(hour: number): number {
  if (hour <= SUNRISE_HOUR || hour >= SUNSET_HOUR) return 0;
  const progress = (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);
  return Math.sin(Math.PI * progress) ** 2;
}

/** Small repeatable ripple so the curve looks measured rather than drawn. */
function ripple(index: number): number {
  return 1 + 0.06 * Math.sin(index * 1.7) + 0.04 * Math.cos(index * 0.53);
}

/** Samples up to 14:35, a live day viewed mid-afternoon, so "producing now" is high. */
const LIVE_SAMPLE_COUNT = 176;

/** Five-minute AC power samples (W) for a fictional summer day, up to mid-afternoon. */
export function dayPowerSamples(): number[] {
  return Array.from({ length: LIVE_SAMPLE_COUNT }, (_, i) =>
    Math.round(PEAK_WATTS * daylight(i / 12) * ripple(i)),
  );
}

/** Daily energy (kWh) values for `count` consecutive fictional days. */
export function dailyEnergy(count: number, offset = 0): number[] {
  return Array.from({ length: count }, (_, i) => {
    const day = i + offset;
    return Math.round((38 + 9 * Math.sin(day * 0.9) + 4 * Math.cos(day * 2.3)) * 10) / 10;
  });
}

/** Monthly energy (kWh) for a fictional Norwegian year (low winter, high summer). */
export function monthlyEnergy(): number[] {
  return [92, 210, 520, 860, 1_120, 1_240, 1_210, 980, 640, 330, 120, 60];
}

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DEMO_DEVICE = {
  status: "1",
  deviceModel: "Demo Inverter 8K",
  plantName: "Demo Rooftop",
  lastUpdateTime: "2026-06-21 14:35:00",
  nominalPower: 8000,
  deviceNum: 1,
  onlineNum: 1,
};

export const DEMO_TOTALS = { eToday: 41.6, eMonth: 812.4, eTotal: 18_734.2 };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function ymdToLocal(ymd: string, hour: number): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)} ${pad(hour)}:00:00`;
}

/** Hourly fictional observations for one YYYYMMDD date. */
export function hourlyObservations(ymd: string): Record<string, unknown>[] {
  const seed = Number(ymd.slice(6, 8));
  return Array.from({ length: 24 }, (_, hour) => {
    const sun = daylight(hour);
    const temp = 13 + 9 * sun + 1.5 * Math.sin((seed + hour) * 0.4);
    return {
      obsTimeLocal: ymdToLocal(ymd, hour),
      humidityAvg: Math.round(78 - 30 * sun),
      winddirAvg: (200 + seed * 7 + hour * 3) % 360,
      solarRadiationHigh: Math.round(850 * sun),
      uvHigh: Math.round(7 * sun * 10) / 10,
      metric: {
        tempAvg: Math.round(temp * 10) / 10,
        tempHigh: Math.round((temp + 0.8) * 10) / 10,
        tempLow: Math.round((temp - 0.8) * 10) / 10,
        dewptAvg: Math.round((temp - 6) * 10) / 10,
        windspeedAvg: Math.round((7 + 5 * sun) * 10) / 10,
        windgustAvg: Math.round((12 + 7 * sun) * 10) / 10,
        pressureMax: Math.round((1014 + 3 * Math.sin(seed * 0.3)) * 10) / 10,
        precipRate: hour >= 17 && hour <= 18 && seed % 3 === 0 ? 0.6 : 0,
        precipTotal: hour >= 17 && seed % 3 === 0 ? 1.2 : 0,
      },
    };
  });
}

/** Current conditions in the Weather.com "observations" envelope. */
export function currentConditions(now: Date): Record<string, unknown> {
  return {
    observations: [
      {
        obsTimeLocal: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} 14:30:00`,
        neighborhood: "Demo Station",
        humidity: 52,
        winddir: 225,
        uv: 6,
        solarRadiation: 812,
        metric: {
          temp: 21.4,
          heatIndex: 21.4,
          dewpt: 11.2,
          windChill: 21.4,
          windSpeed: 11,
          windGust: 18,
          pressure: 1016.2,
          precipRate: 0,
          precipTotal: 0,
        },
      },
    ],
  };
}
