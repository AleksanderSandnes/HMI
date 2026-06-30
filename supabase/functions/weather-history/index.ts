// weather-history — on-demand hourly history for a single day, with cache-aside.
// Replaces the live-fetch path behind GET /api/weather/hourly/:date for uncached dates.
// Cached/completed days are normally read directly from weather_historical via PostgREST;
// this function is the fallback that fetches + persists a missing past day.
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  adminClient,
  getWeatherCredentials,
  recordHealth,
  requireUser,
} from "../_shared/supabase.ts";
import { fetchHourly, isFresh, todayAndYesterday } from "../_shared/weather.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  let authId: string | null = null;
  try {
    authId = await requireUser(req);
    const { date } = await req.json().catch(() => ({ date: undefined }));
    if (!date || !/^\d{8}$/.test(date)) {
      return json({ error: "Body must include date as YYYYMMDD" }, 400);
    }

    const { stationId, apiKey } = await getWeatherCredentials(admin, authId);
    const { today, yesterday } = todayAndYesterday();
    // Today/yesterday are still "live" (the day is incomplete / just ended), so they are
    // refreshed on the short TTL; older days are complete and cached permanently.
    const isLive = date === today || date === yesterday;

    // Cache-aside: serve a stored day if it is a completed past day, or a live day still fresh.
    const { data: cached } = await admin
      .from("weather_historical")
      .select("observations, cached_at")
      .eq("station_id", stationId)
      .eq("date", date)
      .maybeSingle();
    if (cached && (!isLive || isFresh(cached.cached_at))) {
      return json({ observations: cached.observations, cached: true });
    }

    // Miss / stale -> live fetch.
    const observations = await fetchHourly(stationId, apiKey, date);

    // Persist: live days always (even empty) so the TTL throttle holds; completed past days
    // only when they carry observations.
    if (isLive || observations.length > 0) {
      await admin.from("weather_historical").upsert(
        {
          station_id: stationId,
          date,
          observations,
          cached_at: new Date().toISOString(),
        },
        { onConflict: "station_id,date" },
      );
    }

    await recordHealth(admin, authId, "weather", "ok");
    return json({ observations, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (authId) await recordHealth(admin, authId, "weather", "error", message);
    return json({ error: message }, 500);
  }
});
