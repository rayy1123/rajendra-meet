-- =====================================================================
-- SCMS — 0013 viewer boleh input sendiri
--
-- Permintaan: viewer (pengguna yang sudah login) boleh memasukkan data
-- sendiri — atlet, sekolah, registrasi, heat, lintasan, dan hasil lomba.
-- Tanpa login (anon) tetap read-only untuk data pertandingan.
--
-- Role default setiap user baru = 'viewer' (lihat trigger 0001), jadi
-- mendaftar lewat /register otomatis mendapat hak ini.
--
-- Policy lama (can_operate) tetap ada; yang di bawah ini MENAMBAH hak
-- untuk authenticated/viewer, bukan menggantikan.
-- =====================================================================

-- Viewer terautentikasi boleh menambah sekolah / atlet (master data ringan)
drop policy if exists schools_insert_viewer on public.schools;
create policy schools_insert_viewer on public.schools
  for insert with check (public.is_authenticated());

drop policy if exists athletes_write_viewer on public.athletes;
create policy athletes_write_viewer on public.athletes
  for insert with check (public.is_authenticated());
create policy athletes_update_viewer on public.athletes
  for update using (public.is_authenticated()) with check (public.is_authenticated());

-- Viewer boleh mendaftarkan peserta, menyusun heat, dan mengisi hasil
-- untuk nomor lomba mana pun (self-service). Ini memenuhi kebutuhan
-- "viewer yang isi sendiri dengan syarat login terlebih dahulu".
drop policy if exists registrations_write_viewer on public.registrations;
create policy registrations_write_viewer on public.registrations
  for insert with check (public.is_authenticated());
create policy registrations_update_viewer on public.registrations
  for update using (public.is_authenticated()) with check (public.is_authenticated());
create policy registrations_delete_viewer on public.registrations
  for delete using (public.is_authenticated());

drop policy if exists heats_write_viewer on public.heats;
create policy heats_write_viewer on public.heats
  for insert with check (public.is_authenticated());
create policy heats_update_viewer on public.heats
  for update using (public.is_authenticated()) with check (public.is_authenticated());
create policy heats_delete_viewer on public.heats
  for delete using (public.is_authenticated());

drop policy if exists heat_assignments_write_viewer on public.heat_assignments;
create policy heat_assignments_write_viewer on public.heat_assignments
  for insert with check (public.is_authenticated());
create policy heat_assignments_update_viewer on public.heat_assignments
  for update using (public.is_authenticated()) with check (public.is_authenticated());
create policy heat_assignments_delete_viewer on public.heat_assignments
  for delete using (public.is_authenticated());

drop policy if exists results_write_viewer on public.results;
create policy results_write_viewer on public.results
  for insert with check (public.is_authenticated());
create policy results_update_viewer on public.results
  for update using (public.is_authenticated()) with check (public.is_authenticated());
