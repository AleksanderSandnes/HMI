-- Realtime for cross-device settings sync. When a user edits their settings/profile on one
-- device, other open devices get the change live. REPLICA IDENTITY FULL is required so
-- Realtime can evaluate the row's RLS policy (self-access) before delivering the event — a
-- user only ever receives changes to their own rows.

alter table public.user_settings replica identity full;
alter table public.profiles      replica identity full;

alter publication supabase_realtime add table public.user_settings;
alter publication supabase_realtime add table public.profiles;
