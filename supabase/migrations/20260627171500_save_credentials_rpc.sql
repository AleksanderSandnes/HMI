-- Client-callable credential management. SECURITY DEFINER so it can write Vault + settings;
-- it derives the user from auth.uid(), so an authenticated client can only ever change its
-- own credentials. The frontend calls these via supabase.rpc(...) — no plaintext secret is
-- ever stored client-side or in a plain column (only the Vault secret uuid is kept).

create or replace function public.save_user_credentials(
  p_weather_station_id text default null,
  p_weather_api_key    text default null,
  p_growatt_email      text default null,
  p_growatt_password   text default null
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  uid    uuid := auth.uid();
  wkey   uuid;
  gpw    uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_settings (auth_id) values (uid) on conflict (auth_id) do nothing;

  select weather_api_key_secret_id, growatt_password_secret_id
    into wkey, gpw
  from public.user_settings where auth_id = uid;

  -- Weather.com API key -> Vault (create or update).
  if p_weather_api_key is not null and length(p_weather_api_key) > 0 then
    if wkey is not null then
      perform vault.update_secret(wkey, p_weather_api_key);
    else
      wkey := vault.create_secret(p_weather_api_key, 'weather_api_key_' || uid);
    end if;
  end if;

  -- Growatt password -> Vault (create or update).
  if p_growatt_password is not null and length(p_growatt_password) > 0 then
    if gpw is not null then
      perform vault.update_secret(gpw, p_growatt_password);
    else
      gpw := vault.create_secret(p_growatt_password, 'growatt_password_' || uid);
    end if;
  end if;

  update public.user_settings
     set weather_station_id        = coalesce(p_weather_station_id, weather_station_id),
         growatt_email             = coalesce(p_growatt_email, growatt_email),
         weather_api_key_secret_id = wkey,
         growatt_password_secret_id = gpw,
         updated_at                = now()
   where auth_id = uid;
end;
$$;

revoke all on function public.save_user_credentials(text, text, text, text) from public, anon;
grant execute on function public.save_user_credentials(text, text, text, text) to authenticated;

-- Clear one integration's credentials (nulls the settings + Vault references).
create or replace function public.clear_user_credentials(p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_kind = 'growatt' then
    update public.user_settings
       set growatt_email = null, growatt_plant_id = null,
           growatt_password_secret_id = null, updated_at = now()
     where auth_id = uid;
  elsif p_kind = 'weather' then
    update public.user_settings
       set weather_station_id = null,
           weather_api_key_secret_id = null, updated_at = now()
     where auth_id = uid;
  else
    raise exception 'Unknown credential kind: %', p_kind;
  end if;
end;
$$;

revoke all on function public.clear_user_credentials(text) from public, anon;
grant execute on function public.clear_user_credentials(text) to authenticated;
