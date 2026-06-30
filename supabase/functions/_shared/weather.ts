// Weather.com PWS client + date helpers. Ported from backend/weatherAPI/services
// (weatherService.js + weatherHelpers.js). Endpoints and query params are unchanged so
// the upstream responses (and therefore the frontend transforms) stay identical.

const BASE_URL = "https://api.weather.com/v2/pws";

const PWS_ENDPOINTS = {
  CURRENT: "/observations/current",
  HOURLY: "/history/hourly",
  DAILY_ALL: "/history/all",
} as const;

/** Format a Date as YYYYMMDD using local time (matches the frontend's date format). */
export function toYyyyMmDd(d: Date): string {
  return (
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, "0")}` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}

export function todayAndYesterday(): { today: string; yesterday: string } {
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return { today: toYyyyMmDd(now), yesterday: toYyyyMmDd(y) };
}

/** Freshness window for "live" weather (current conditions + today/yesterday hourly). */
export const LIVE_TTL_MS = 5 * 60 * 1000;

/** Whether a stored ISO timestamp is still within `ttlMs` of now. */
export function isFresh(timestamp: string | null | undefined, ttlMs = LIVE_TTL_MS): boolean {
  if (!timestamp) return false;
  const t = new Date(timestamp).getTime();
  return Number.isFinite(t) && Date.now() - t < ttlMs;
}

// deno-lint-ignore no-explicit-any
async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather.com responded ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

/** Current observation. Returns the raw Weather.com payload (with `observations`). */
// deno-lint-ignore no-explicit-any
export function fetchCurrent(stationId: string, apiKey: string): Promise<any> {
  const url =
    `${BASE_URL}${PWS_ENDPOINTS.CURRENT}?stationId=${stationId}` +
    `&format=json&units=m&numericPrecision=decimal&apiKey=${apiKey}`;
  return getJson(url);
}

/** Hourly observations for a YYYYMMDD date. Returns the observations array. */
export async function fetchHourly(
  stationId: string,
  apiKey: string,
  date: string,
  // deno-lint-ignore no-explicit-any
): Promise<any[]> {
  const url =
    `${BASE_URL}${PWS_ENDPOINTS.HOURLY}?stationId=${stationId}` +
    `&format=json&units=m&date=${date}&apiKey=${apiKey}`;
  const data = await getJson(url);
  return data?.observations ?? [];
}
