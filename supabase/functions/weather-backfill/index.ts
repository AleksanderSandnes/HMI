// weather-backfill — daily cron (pg_cron). Backfills YESTERDAY's hourly observations for
// every user with weather credentials, then inserts one notification per user (which the
// notifications->send-push webhook turns into an Expo push). Port of cron/weatherBackfill.js.
import { json } from "../_shared/cors.ts";
import { adminClient, getWeatherCredentials, recordHealth } from "../_shared/supabase.ts";
import { fetchHourly, todayAndYesterday } from "../_shared/weather.ts";

// A complete day of PWS hourly history is ~24 observations (one per hour). If yesterday's
// row already has this many, it's complete and we skip the redundant Weather.com call.
const COMPLETE_HOURLY_COUNT = 24;

const prettyDate = (yyyymmdd: string) =>
  yyyymmdd.length === 8
    ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
    : yyyymmdd;

Deno.serve(async () => {
  const admin = adminClient();
  const { yesterday } = todayAndYesterday();

  // Every user that has both a station and a Vault-stored API key configured.
  const { data: users, error } = await admin
    .from("user_settings")
    .select("auth_id, weather_station_id, weather_api_key_secret_id")
    .not("weather_station_id", "is", null)
    .not("weather_api_key_secret_id", "is", null);
  if (error) return json({ error: error.message }, 500);

  const results: unknown[] = [];
  for (const u of users ?? []) {
    const authId = u.auth_id as string;
    try {
      const { stationId, apiKey } = await getWeatherCredentials(admin, authId);

      // Skip the API call if yesterday is already complete in the cache.
      const { data: existing } = await admin
        .from("weather_historical")
        .select("observations")
        .eq("station_id", stationId)
        .eq("date", yesterday)
        .maybeSingle();
      if (existing && (existing.observations?.length ?? 0) >= COMPLETE_HOURLY_COUNT) {
        results.push({ authId, count: existing.observations.length, ok: true, skipped: true });
        continue;
      }

      const observations = await fetchHourly(stationId, apiKey, yesterday);
      const ok = observations.length > 0;
      const when = prettyDate(yesterday);

      if (ok) {
        await admin.from("weather_historical").upsert(
          {
            station_id: stationId,
            date: yesterday,
            observations,
            cached_at: new Date().toISOString(),
          },
          { onConflict: "station_id,date" },
        );
      }

      await admin.from("notifications").insert({
        auth_id: authId,
        type: "weather_sync",
        level: ok ? "success" : "warning",
        title: ok ? "Weather data synced" : "Weather sync finished — no data",
        message: ok
          ? `Saved ${observations.length} hourly observation${observations.length === 1 ? "" : "s"} for ${when} (station ${stationId}).`
          : `No weather observations were available for ${when}.`,
        meta: { source: "weather", date: yesterday, stationId, count: observations.length },
      });

      await recordHealth(
        admin,
        authId,
        "weather",
        ok ? "ok" : "error",
        ok ? undefined : "no observations",
      );
      results.push({ authId, count: observations.length, ok });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await admin.from("notifications").insert({
        auth_id: authId,
        type: "weather_sync",
        level: "error",
        title: "Weather sync failed",
        message,
        meta: { source: "weather", date: yesterday },
      });
      await recordHealth(admin, authId, "weather", "error", message);
      results.push({ authId, error: message });
    }
  }

  return json({ date: yesterday, processed: results.length, results });
});
