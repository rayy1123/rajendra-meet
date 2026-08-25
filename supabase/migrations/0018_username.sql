-- =====================================================================
-- SCMS — 0018 username = nama asli
--
-- Field username di profiles. Aturan bisnis: username harus sama
-- dengan nama lengkap (nama asli) agar akun mudah dikenali.
-- =====================================================================

alter table public.profiles
  add column if not exists username text not null default '';
