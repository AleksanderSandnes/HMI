-- POST-DEPLOY ONLY — run in the Supabase SQL editor (or psql) AFTER the project exists,
-- the Edge Functions are deployed, and you have the project ref + service-role key.
-- NOT a numbered migration, because it references the live Functions URL and a secret,
-- so it must never run during a local `supabase db reset`.
--
-- Replace:
--   <PROJECT_REF>          e.g. abcdefghijklmnop
--   <SERVICE_ROLE_JWT>     the project's service_role key (store via Vault ideally)
--
-- pg_cron schedules are in UTC.

-- Store the service-role key in Vault once, then read it in each job (avoids inlining the secret).
-- select vault.create_secret('<SERVICE_ROLE_JWT>', 'edge_service_role_key', 'pg_cron -> edge fns');

-- Helper: invoke an edge function by name via pg_net using the Vault-stored key.
create or replace function public.invoke_edge_function(fn text, body jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = net, vault, public
as $$
declare
  key text;
  req_id bigint;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'edge_service_role_key';
  select net.http_post(
    url     := 'https://xdttfrknoazcqcelieck.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || key),
    body    := body
  ) into req_id;
  return req_id;
end;
$$;
revoke all on function public.invoke_edge_function(text, jsonb) from public, anon, authenticated;

-- Daily weather backfill at 00:10 UTC.
select cron.schedule('weather-backfill-daily', '10 0 * * *',
  $$ select public.invoke_edge_function('weather-backfill'); $$);

-- Outage monitor every 2 hours (flags Growatt/Weather live-data failures -> notification + push).
select cron.schedule('outage-monitor', '0 */2 * * *',
  $$ select public.invoke_edge_function('outage-monitor'); $$);

-- To inspect / remove:
--   select * from cron.job;
--   select cron.unschedule('weather-backfill-daily');
