-- =====================================================================
-- SCMS — 0016 kolom tambahan untuk data atlet (manajemen viewer)
--
-- Menambah field yang berguna untuk manajemen atlet di akun viewer:
-- tinggi/berat (Fins/renang), kontak orang tua, dan catatan medis.
-- =====================================================================

alter table public.athletes
  add column if not exists height_cm numeric,
  add column if not exists weight_kg numeric,
  add column if not exists parent_phone text not null default '',
  add column if not exists medical_notes text not null default '';
