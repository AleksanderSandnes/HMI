-- Fictional store/review demo account for DISPOSABLE databases only (local stack or a
-- Supabase preview branch). Applied by scripts/capture-store-screenshots.mjs.
--
-- Everything here is invented: "Emma Nordmann", demo@example.com (RFC 2606 reserved
-- domain), a made-up plant and weather station. The guard below refuses to run on any
-- database that already contains a non-example.com account, so it cannot touch
-- production by accident. The production reviewer account is created separately with a
-- secret password that is never committed (see store/README.md).

do $$
begin
  if exists (select 1 from auth.users where email not like '%@example.com') then
    raise exception 'seed_demo.sql only runs on disposable databases (real accounts found)';
  end if;
end;
$$;

do $$
declare
  demo_id constant uuid := '00000000-0000-4000-8000-00000000d3e0';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
    'demo@example.com', extensions.crypt('store-demo-local-only', extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"username":"Emma Nordmann"}',
    now(), now(), '', '', '', ''
  ) on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    demo_id, demo_id, demo_id::text,
    jsonb_build_object('sub', demo_id::text, 'email', 'demo@example.com', 'email_verified', true),
    'email', now(), now(), now()
  ) on conflict do nothing;

  -- handle_new_auth_user() created the profile + settings rows; fill in fictional values.
  update public.profiles set username = 'Emma Nordmann' where auth_id = demo_id;
  update public.user_settings
     set growatt_email = 'demo@example.com',
         growatt_plant_id = 'DEMO-PLANT-1',
         weather_station_id = 'IDEMO1',
         -- Placeholder ids so the UI reads "Connected"; no Vault secret exists behind them.
         growatt_password_secret_id = '00000000-0000-4000-8000-00000000d3e1',
         weather_api_key_secret_id = '00000000-0000-4000-8000-00000000d3e2'
   where auth_id = demo_id;

  delete from public.notifications where auth_id = demo_id;
  insert into public.notifications (auth_id, type, level, title, message, created_at) values
    (demo_id, 'solar_sync', 'success', 'Solar data synced', 'Today''s production is up to date.', now() - interval '12 minutes'),
    (demo_id, 'weather_sync', 'info', 'Weather updated', 'New observations from your station.', now() - interval '1 hour'),
    (demo_id, 'system', 'info', 'Welcome to HMI', 'Your dashboard is ready.', now() - interval '2 days');
end;
$$;
