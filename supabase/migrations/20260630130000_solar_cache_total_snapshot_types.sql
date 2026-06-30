-- Widen the solar_data_cache type check to allow the two new cache ranges the Growatt
-- service now persists:
--   TOTAL    — the 5-year overview (one energy total per year), 1-day TTL.
--   SNAPSHOT — the live "as of now" totals snapshot (current power / today / lifetime), 60-min TTL.
-- The original constraint only permitted DAY/WEEK/MONTH/YEAR, so these rows were rejected
-- with "violates check constraint solar_data_cache_type_check".

alter table public.solar_data_cache drop constraint solar_data_cache_type_check;

alter table public.solar_data_cache
  add constraint solar_data_cache_type_check
  check (type in ('DAY', 'WEEK', 'MONTH', 'YEAR', 'TOTAL', 'SNAPSHOT'));
