-- Maintenance and trigger functions must not be callable through the public API.
revoke execute on function public.prune_integration_health() from public, anon, authenticated;
grant execute on function public.prune_integration_health() to service_role;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
alter function public.set_updated_at() set search_path = pg_catalog;
