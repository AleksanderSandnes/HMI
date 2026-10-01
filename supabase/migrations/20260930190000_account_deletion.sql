-- Service-role-only helpers for self-service account deletion (delete-account Edge
-- Function). Every user table cascades from auth.users; these cover what does not:
-- the user's avatar objects and the Vault secrets referenced by user_settings.
create or replace function public.account_deletion_media(target_auth_id uuid)
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select o.bucket_id, o.name
    from storage.objects o
   where o.bucket_id = 'avatars'
     and (storage.foldername(o.name))[1] = target_auth_id::text;
$$;

create or replace function public.prepare_account_deletion(target_auth_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  secret_ids uuid[];
begin
  select array_remove(array[s.weather_api_key_secret_id, s.growatt_password_secret_id], null)
    into secret_ids
    from public.user_settings s
   where s.auth_id = target_auth_id;

  update public.user_settings
     set weather_api_key_secret_id = null, growatt_password_secret_id = null
   where auth_id = target_auth_id;

  if secret_ids is not null and cardinality(secret_ids) > 0 then
    delete from vault.secrets where id = any (secret_ids);
  end if;
end;
$$;

revoke all on function public.account_deletion_media(uuid),
  public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.account_deletion_media(uuid),
  public.prepare_account_deletion(uuid) to service_role;
