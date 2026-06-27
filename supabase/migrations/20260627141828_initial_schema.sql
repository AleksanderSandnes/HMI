-- HMI initial schema (Supabase hybrid migration)
-- Tables: profiles, user_settings, notifications, weather_historical, weather_current, solar_data_cache
-- All timestamps UTC. JSONB used for the document-shaped weather/solar payloads so the
-- frontend's existing data transforms stay unchanged.

-- updated_at helper ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- profiles ------------------------------------------------------------------
-- App-level user row, 1:1 with auth.users. Populated by the auth trigger.
create table public.profiles (
  id               uuid primary key default gen_random_uuid(),
  auth_id          uuid not null unique references auth.users (id) on delete cascade,
  username         text not null,
  email            text not null,
  expo_push_tokens text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- user_settings -------------------------------------------------------------
-- Per-user integration config. Secrets live in Vault; only the secret UUIDs are stored here.
create table public.user_settings (
  id                         uuid primary key default gen_random_uuid(),
  auth_id                    uuid not null unique references auth.users (id) on delete cascade,
  growatt_email              text,
  growatt_plant_id           text,
  weather_station_id         text,
  growatt_password_secret_id uuid,
  weather_api_key_secret_id  uuid,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create index user_settings_weather_station_idx on public.user_settings (weather_station_id);
create index user_settings_growatt_plant_idx   on public.user_settings (growatt_plant_id);

-- notifications -------------------------------------------------------------
-- In-app notification center + push source. "Mark as read" == hard delete, so every
-- stored row is unread and the unread badge is simply the row count per user.
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null default 'system'  check (type  in ('weather_sync', 'solar_sync', 'system')),
  level      text not null default 'info'    check (level in ('success', 'error', 'info', 'warning')),
  title      text not null,
  message    text not null default '',
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index notifications_auth_created_idx on public.notifications (auth_id, created_at desc);

-- weather_historical --------------------------------------------------------
-- One cached hourly document per station per day (date = 'YYYYMMDD', unchanged from Mongo).
create table public.weather_historical (
  station_id   text not null,
  date         text not null,
  observations jsonb not null,
  cached_at    timestamptz not null default now(),
  primary key (station_id, date)
);

-- weather_current -----------------------------------------------------------
create table public.weather_current (
  station_id   text primary key,
  observations jsonb not null,
  fetched_at   timestamptz not null default now()
);

-- solar_data_cache ----------------------------------------------------------
-- Cache-aside for Growatt charts, keyed by (type, plant_id, date). Mirrors the Java
-- SolarDataCache. Only genuinely historical/complete periods are cached (see Java service).
create table public.solar_data_cache (
  type       text not null check (type in ('DAY', 'WEEK', 'MONTH', 'YEAR')),
  plant_id   text not null,
  date       text not null,
  payload    jsonb not null,
  cached_at  timestamptz not null default now(),
  primary key (type, plant_id, date)
);
