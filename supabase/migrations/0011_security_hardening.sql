-- =====================================================================
-- SCMS — 0011 penguatan keamanan (hardening)
--
-- Masalah yang diperbaiki:
--   * events_read sebelumnya: is_published OR is_authenticated().
--     Artinya SETIAP user login (viewer/operator) bisa melihat event
--     DRAFT / BELUM DIPUBLIKASIKAN milik panitia lain. Pada skala
--     1000+ acara ini membocorkan data latihan/rahasia antar-panitia.
--   * Solusi: draft hanya boleh dilihat oleh super_admin dan event_admin
--     yang ditugaskan ke event tersebut. Publik & user login lain hanya
--     melihat event yang sudah dipublikasikan.
--
-- Ini aman dijalankan berulang kali (idempoten: drop lalu create).
-- =====================================================================

drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select using (
    is_published
    or public.is_super_admin()
    or public.is_event_admin(id)
  );
