-- Row-Level Security + explicit GRANTs.
-- Lesson carried from The_family_app: RLS policies WITHOUT table GRANTs still produce
-- "permission denied" for `authenticated` — so we grant explicitly here.

-- Writes to weather_* and solar_data_cache come from Edge Functions / the Java service
-- using the service role (which bypasses RLS), so `authenticated` only needs read there.

alter table public.profiles          enable row level security;
alter table public.user_settings     enable row level security;
alter table public.notifications     enable row level security;
alter table public.weather_historical enable row level security;
alter table public.weather_current   enable row level security;
alter table public.solar_data_cache  enable row level security;

-- profiles: a user sees and edits only their own row -----------------------
create policy profiles_self on public.profiles
  for all
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);

-- user_settings: self only --------------------------------------------------
create policy user_settings_self on public.user_settings
  for all
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);

-- notifications: self only (select + delete from the client; insert via service role)
create policy notifications_self on public.notifications
  for all
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);

-- weather_historical: readable when the row's station matches the user's configured station
create policy weather_historical_read on public.weather_historical
  for select
  using (
    exists (
      select 1 from public.user_settings s
      where s.auth_id = auth.uid()
        and s.weather_station_id = weather_historical.station_id
    )
  );

-- weather_current: same station-scoped read
create policy weather_current_read on public.weather_current
  for select
  using (
    exists (
      select 1 from public.user_settings s
      where s.auth_id = auth.uid()
        and s.weather_station_id = weather_current.station_id
    )
  );

-- solar_data_cache: readable when the row's plant matches the user's configured plant
create policy solar_data_cache_read on public.solar_data_cache
  for select
  using (
    exists (
      select 1 from public.user_settings s
      where s.auth_id = auth.uid()
        and s.growatt_plant_id = solar_data_cache.plant_id
    )
  );

-- Grants --------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, delete                 on public.notifications  to authenticated;
grant select                         on public.weather_historical to authenticated;
grant select                         on public.weather_current    to authenticated;
grant select                         on public.solar_data_cache   to authenticated;
