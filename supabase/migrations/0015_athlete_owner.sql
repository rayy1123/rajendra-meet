-- =====================================================================
-- SCMS — 0015 kepemilikan atlet (Atlet Saya)
--
-- Menambahkan kolom owner_id agar viewer hanya mengelola atlet miliknya
-- sendiri ("Atlet Saya"), sementara panitia/admin (can_operate) tetap
-- bebas mengelola seluruh atlet. Ini menggantikan policy viewer bebas
-- dari 0013 agar CRUD atlet viewer bersifat per-pemilik.
-- =====================================================================

alter table public.athletes add column if not exists owner_id uuid references auth.users(id) on delete cascade;
create index if not exists idx_athletes_owner on public.athletes(owner_id);

-- Hapus policy viewer bebas dari 0013 (insert/update tanpa batas pemilik)
drop policy if exists athletes_write_viewer on public.athletes;
drop policy if exists athletes_update_viewer on public.athletes;

-- Insert: viewer wajib mengisi owner_id = dirinya; panitia/admin bebas.
create policy athletes_write_viewer on public.athletes
  for insert with check (owner_id = auth.uid() or public.can_operate());

-- Update: viewer hanya atlet owner_id = dirinya; panitia/admin bebas.
drop policy if exists athletes_owner_update on public.athletes;
create policy athletes_owner_update on public.athletes
  for update using (owner_id = auth.uid() or public.can_operate())
  with check (owner_id = auth.uid() or public.can_operate());

-- Delete: viewer hanya atlet owner_id = dirinya; panitia/admin bebas.
drop policy if exists athletes_owner_delete on public.athletes;
create policy athletes_owner_delete on public.athletes
  for delete using (owner_id = auth.uid() or public.can_operate());
