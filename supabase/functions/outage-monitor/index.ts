// outage-monitor — periodic cron (pg_cron, e.g. every 2h). For each user + integration,
// checks the latest successful fetch in integration_health; if live data has been failing
// past the threshold, inserts ONE (deduped) warning notification -> push. Implements the
// solar/weather outage-alerts feature (the IP-block symptom: all live calls fail for days).
import { json } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

// How long without a success before we alert, per source (hours).
const THRESHOLD_HOURS: Record<string, number> = { growatt: 26, weather: 26 };

Deno.serve(async () => {
  const admin = adminClient();
  const now = Date.now();
  const alerts: unknown[] = [];

  // Distinct (auth_id, source) pairs that have ever reported health (i.e. are configured).
  const { data: rows, error } = await admin
    .from('integration_health')
    .select('auth_id, source, status, checked_at')
    .order('checked_at', { ascending: false });
  if (error) return json({ error: error.message }, 500);

  // Latest success + latest attempt per (auth_id, source).
  const latestOk = new Map<string, number>();
  const seen = new Set<string>();
  for (const r of rows ?? []) {
    const key = `${r.auth_id}:${r.source}`;
    seen.add(key);
    if (r.status === 'ok' && !latestOk.has(key)) {
      latestOk.set(key, new Date(r.checked_at).getTime());
    }
  }

  for (const key of seen) {
    const [authId, source] = key.split(':');
    const thresholdMs = (THRESHOLD_HOURS[source] ?? 26) * 3_600_000;
    const lastOk = latestOk.get(key);
    const stale = lastOk === undefined || now - lastOk > thresholdMs;
    if (!stale) continue;

    // Dedup: skip if a matching outage warning was already raised in the last 24h.
    const since = new Date(now - 24 * 3_600_000).toISOString();
    const { data: existing } = await admin
      .from('notifications')
      .select('id')
      .eq('auth_id', authId)
      .eq('type', 'system')
      .contains('meta', { source, kind: 'outage' })
      .gte('created_at', since)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const label = source === 'growatt' ? 'Solar (Growatt)' : 'Weather station';
    const hours = lastOk ? Math.round((now - lastOk) / 3_600_000) : null;
    await admin.from('notifications').insert({
      auth_id: authId,
      type: 'system',
      level: 'warning',
      title: `${label} data unavailable`,
      message: hours
        ? `No successful ${source} update in ${hours}h. The upstream service may be rate-limiting or blocking requests.`
        : `No successful ${source} update on record yet. Check your credentials or the upstream service.`,
      meta: { source, kind: 'outage', lastOkHoursAgo: hours },
    });
    alerts.push({ authId, source, hours });
  }

  // Housekeeping.
  await admin.rpc('prune_integration_health');

  return json({ alertsRaised: alerts.length, alerts });
});
