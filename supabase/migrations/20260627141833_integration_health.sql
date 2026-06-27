-- Integration health signal for the outage-alerts feature.
-- Both the weather Edge Functions and the Java solar job append a row on every fetch
-- attempt (ok/error). The outage-monitor cron reads the latest success per (user, source)
-- and raises a notification when live data has been failing for too long.

create table public.integration_health (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid not null references auth.users (id) on delete cascade,
  source     text not null check (source in ('growatt', 'weather')),
  status     text not null check (status in ('ok', 'error')),
  detail     text,
  checked_at timestamptz not null default now()
);

create index integration_health_lookup_idx
  on public.integration_health (auth_id, source, checked_at desc);

alter table public.integration_health enable row level security;

-- Users may read their own health history; writes are service-role only (Edge Fns / Java).
create policy integration_health_self_read on public.integration_health
  for select using (auth.uid() = auth_id);

grant select on public.integration_health to authenticated;

-- Retain ~30 days of health rows (best-effort housekeeping via the outage-monitor cron).
create or replace function public.prune_integration_health()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.integration_health where checked_at < now() - interval '30 days';
$$;
