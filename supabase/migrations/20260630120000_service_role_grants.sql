-- service_role table GRANTs.
-- The Edge Functions (weather-current / weather-history / weather-backfill / send-push /
-- outage-monitor) use the service-role client. Bypassing RLS does NOT confer table-level
-- privileges, and the original rls_and_grants migration only granted DML to `authenticated`.
-- Without these grants every service-role query fails with "permission denied for table ...",
-- so weather_current / weather_historical / integration_health never get populated.

grant usage on schema public to service_role;

grant select, insert, update, delete on public.profiles           to service_role;
grant select, insert, update, delete on public.user_settings       to service_role;
grant select, insert, update, delete on public.notifications       to service_role;
grant select, insert, update, delete on public.weather_historical  to service_role;
grant select, insert, update, delete on public.weather_current     to service_role;
grant select, insert, update, delete on public.solar_data_cache    to service_role;
grant select, insert, update, delete on public.integration_health  to service_role;
