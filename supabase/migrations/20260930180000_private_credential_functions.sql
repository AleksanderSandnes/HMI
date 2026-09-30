-- Privileged credential RPCs move out of the Data API's exposed schema. Public
-- SECURITY INVOKER wrappers keep the client RPC names and argument names unchanged,
-- while the Vault-writing SECURITY DEFINER bodies live in the unexposed private schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.save_user_credentials(text, text, text, text) set schema private;
alter function public.clear_user_credentials(text) set schema private;

create function public.save_user_credentials(
  p_weather_station_id text default null,
  p_weather_api_key    text default null,
  p_growatt_email      text default null,
  p_growatt_password   text default null
)
returns void
language sql
security invoker
set search_path = pg_catalog
as $$
  select private.save_user_credentials(
    p_weather_station_id, p_weather_api_key, p_growatt_email, p_growatt_password);
$$;

create function public.clear_user_credentials(p_kind text)
returns void
language sql
security invoker
set search_path = pg_catalog
as $$ select private.clear_user_credentials(p_kind); $$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.save_user_credentials(text, text, text, text),
  private.clear_user_credentials(text) to authenticated, service_role;

revoke all on function public.save_user_credentials(text, text, text, text),
  public.clear_user_credentials(text) from public, anon;
grant execute on function public.save_user_credentials(text, text, text, text),
  public.clear_user_credentials(text) to authenticated, service_role;

-- pg_net cannot be relocated in place; its functions stay in the net schema, so
-- invoke_edge_function (search_path net, vault, public) keeps working.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
