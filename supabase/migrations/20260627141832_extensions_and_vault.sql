-- Extensions for scheduled jobs (pg_cron), outbound HTTP from Postgres (pg_net),
-- and secret storage (Vault). On Supabase these install into the `extensions`/`cron`/
-- `net`/`vault` schemas. Idempotent so local resets and re-runs are safe.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- Least-privilege accessor for the Java service to read a Growatt password by its
-- Vault secret id (the Java service stores the secret UUID alongside user settings).
-- SECURITY DEFINER + locked-down grants so only intended callers can decrypt.
create or replace function public.get_vault_secret(p_secret_id uuid)
returns text
language plpgsql
security definer
set search_path = vault, public
as $$
declare
  v text;
begin
  select decrypted_secret into v
  from vault.decrypted_secrets
  where id = p_secret_id;
  return v;
end;
$$;

revoke all on function public.get_vault_secret(uuid) from public;
revoke all on function public.get_vault_secret(uuid) from anon;
revoke all on function public.get_vault_secret(uuid) from authenticated;
-- Only the service_role (used by the Java backend connection) may call it.
grant execute on function public.get_vault_secret(uuid) to service_role;
