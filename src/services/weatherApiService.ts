/**
 * Weather service — reads cached history straight from Supabase (`weather_historical`, via
 * PostgREST, RLS-scoped to the user's station) and falls back to the `weather-history` Edge
 * Function on a cache miss. Current conditions come from the `weather-current` Edge Function
 * (a live Weather.com call). Replaces the Node `/api/weather/*` endpoints; return shapes are
 * preserved (`{ observations }`) so the existing frontend transforms are unchanged.
 */
import { supabase } from './supabaseClient';

function toYmd(d: Date): string {
  return (
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`
  );
}

function parseYmd(s: string): Date {
  return new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8))
  );
}

/** The 7 YYYYMMDD dates (oldest first) ending on `end` (or today). */
function weekDatesEnding(end?: string): string[] {
  const last = end ? parseYmd(end) : new Date();
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(last);
    d.setDate(last.getDate() - i);
    out.push(toYmd(d));
  }
  return out;
}

/** Hourly observations for one day: cache first (PostgREST), then the Edge Function. */
async function readDay(date: string): Promise<any[]> {
  const { data } = await supabase
    .from('weather_historical')
    .select('observations')
    .eq('date', date)
    .maybeSingle();
  if (data?.observations) return data.observations;

  const { data: fn, error } = await supabase.functions.invoke(
    'weather-history',
    { body: { date } }
  );
  if (error) return [];
  return fn?.observations ?? [];
}

/** Current conditions (live via Edge Function). */
export async function getCurrentWeatherData(): Promise<any> {
  const { data, error } = await supabase.functions.invoke('weather-current');
  if (error) throw new Error(error.message);
  return data;
}

/** Full-day observations for a date. */
export async function getHistoricalWeatherData(date: string): Promise<any> {
  return { observations: await readDay(date) };
}

/** Hourly observations for a date. */
export async function getHourlyWeatherData(date: string): Promise<any> {
  return { observations: await readDay(date) };
}

/** 7-day weekly view (observations across the week ending on `date`). */
export async function getWeeklyWeatherData(date?: string): Promise<any> {
  const dates = weekDatesEnding(date);
  let observations: any[] = [];
  for (const d of dates) {
    observations = observations.concat(await readDay(d));
  }
  return { observations, weekDates: dates };
}

/** Hourly observations across the week ending on `startDate`. */
export async function getWeeklyHourlyWeatherData(
  startDate: string,
  _endDate?: string
): Promise<any> {
  const dates = weekDatesEnding(startDate);
  let observations: any[] = [];
  for (const d of dates) {
    observations = observations.concat(await readDay(d));
  }
  return {
    weeklyData: observations,
    observations,
    weekDates: dates,
    selectedDate: startDate,
  };
}
