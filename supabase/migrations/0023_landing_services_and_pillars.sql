-- =====================================================================
-- SCMS — 0023 landing_services_and_pillars
--
-- Memperluas tipe landing_showcases agar mendukung:
-- - service (Layanan & Paket harga kejuaraan)
-- - pillar (Mengapa Memilih Kami / Pilar Keunggulan)
-- - about (Tentang Kami)
-- - client (Mitra & Klien Kami)
-- =====================================================================

alter table public.landing_showcases drop constraint if exists landing_showcases_type_check;

alter table public.landing_showcases add constraint landing_showcases_type_check 
  check (type in ('poster', 'stat', 'gallery', 'service', 'pillar', 'about', 'client'));
