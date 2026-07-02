-- Avatar storage: add profiles.avatar_url + a public `avatars` Storage bucket.
-- Avatars replace the old device-local (AsyncStorage) mobile picture so the
-- image syncs across devices and to web. Public-read bucket keeps avatar URLs
-- as plain public URLs; writes are RLS-scoped to each user's own <auth.uid()>
-- folder.

-- 1. profiles.avatar_url ----------------------------------------------------
-- Nullable: existing rows and the handle_new_auth_user() trigger default to
-- null (no picture → initials fallback in the UI).
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Storage bucket ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MiB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. RLS on storage.objects for the avatars bucket --------------------------
-- storage.objects already has RLS enabled and the platform grants for the
-- `authenticated`/`anon` roles; only the policies below are project-specific.
-- Owner scoping: the object's first path segment must equal the user's auth
-- uid, i.e. keys look like `<auth.uid()>/avatar.<ext>`.
-- (storage.foldername(name))[1] is that first folder.

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
