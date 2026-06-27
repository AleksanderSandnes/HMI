-- Create the app profile + empty settings row on every new auth.users INSERT.
-- SECURITY DEFINER so it can write public.* regardless of the caller. Mirrors the
-- The_family_app handle_new_auth_user() pattern (avoids the PKCE/email-confirm FK race).

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (auth_id) do nothing;

  insert into public.user_settings (auth_id)
  values (new.id)
  on conflict (auth_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
