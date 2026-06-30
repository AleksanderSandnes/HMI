// weather-current — live current observation for the signed-in user.
// Replaces GET /api/weather/current. Fetches from Weather.com (proxy-safe, no IP block),
// caches into weather_current, and records integration health.
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  adminClient,
  getWeatherCredentials,
  recordHealth,
  requireUser,
} from "../_shared/supabase.ts";
import { fetchCurrent, isFresh } from "../_shared/weather.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = adminClient();
  let authId: string | null = null;
  try {
    authId = await requireUser(req);
    const { stationId, apiKey } = await getWeatherCredentials(admin, authId);

    // Cache-aside with a short TTL: serve the stored observation if it was fetched within the
    // live window, so repeated dashboard polls don't each hit Weather.com.
    const { data: cached } = await admin
      .from("weather_current")
      .select("observations, fetched_at")
      .eq("station_id", stationId)
      .maybeSingle();
    if (cached && isFresh(cached.fetched_at)) {
      return json({ observations: cached.observations, cached: true });
    }

    const payload = await fetchCurrent(stationId, apiKey);
    const observations = payload?.observations ?? [];

    await admin
      .from("weather_current")
      .upsert(
        { station_id: stationId, observations, fetched_at: new Date().toISOString() },
        { onConflict: "station_id" },
      );

    await recordHealth(admin, authId, "weather", "ok");
    return json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (authId) await recordHealth(admin, authId, "weather", "error", message);
    return json({ error: message }, 500);
  }
});
