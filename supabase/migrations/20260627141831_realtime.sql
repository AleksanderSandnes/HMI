-- Publish the notifications table to Realtime so the web notification center can
-- subscribe to live inserts/deletes (replaces the count/list polling).
-- REPLICA IDENTITY FULL so DELETE events carry the old row (needed to drop items live).

alter table public.notifications replica identity full;

alter publication supabase_realtime add table public.notifications;
