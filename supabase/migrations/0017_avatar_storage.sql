-- =====================================================================
-- SCMS — 0017 foto profil (viewer & atlet)
--
-- 1. profiles.avatar_url (viewer)
-- 2. storage bucket 'avatars' (public) + policy: user hanya boleh
--    tulos ke folder miliknya: viewer/<uid>/*  dan  athlete/<uid>/*
-- =====================================================================

alter table public.profiles
  add column if not exists avatar_url text not null default '';

-- Bucket (public supaya foto bisa ditampilkan langsung via URL)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Baca: publik
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Tulis viewer folder: segment[1]='viewer', segment[2]=auth.uid()
drop policy if exists "avatars_viewer_write" on storage.objects;
create policy "avatars_viewer_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'viewer'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "avatars_viewer_update" on storage.objects;
create policy "avatars_viewer_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'viewer'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "avatars_viewer_delete" on storage.objects;
create policy "avatars_viewer_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'viewer'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Tulis athlete folder: segment[1]='athlete', segment[2]=auth.uid()
drop policy if exists "avatars_athlete_write" on storage.objects;
create policy "avatars_athlete_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'athlete'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "avatars_athlete_update" on storage.objects;
create policy "avatars_athlete_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'athlete'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "avatars_athlete_delete" on storage.objects;
create policy "avatars_athlete_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'athlete'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
