-- =====================================================================
-- SCMS — 0019 perbaiki RLS read agar privat per user
--
-- Sebelumnya athletes_read & registrations_read punya qual = true,
-- sehingga SEMUA user (termasuk viewer) bisa SELECT semua baris lewat
-- API -> bocor privasi. Fix: viewer hanya baris miliknya, admin
-- (can_operate()) bisa lihat semua.
-- =====================================================================

-- athletes: ganti policy read
drop policy if exists athletes_read on public.athletes;
create policy athletes_read on public.athletes
  for select using ((owner_id = auth.uid()) or can_operate());

-- registrations: policy read bocor (qual = true) dihapus; sisakan
-- registrations_read_own yang sudah benar (milik sendiri atau admin).
drop policy if exists registrations_read on public.registrations;
