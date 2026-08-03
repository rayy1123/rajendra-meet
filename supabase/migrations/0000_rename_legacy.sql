-- =====================================================================
-- SCMS — 0000 rename tabel Laravel lama menjadi legacy_*
--
-- Dijalankan SEBELUM 0001 supaya `create table if not exists` tidak
-- diam-diam melewati tabel SCMS karena tertutup tabel lama bernama sama.
--
-- Tidak ada data yang dihapus. Operasi ini sepenuhnya dapat dibalik:
--   alter table public.legacy_athletes rename to athletes;  -- dst.
--
-- Tabel Laravel murni (migrations, jobs, cache, sessions, users, ...)
-- sengaja TIDAK disentuh: namanya tidak bentrok dengan skema SCMS.
-- =====================================================================

do $$
declare
  t text;
  conflicting text[] := array[
    'schools',
    'events',
    'athletes',
    'competition_events',
    'registrations',
    'heats',
    'heat_assignments',
    'results',
    'rajendra_records'
  ];
begin
  foreach t in array conflicting loop
    -- Hanya rename bila tabel lama benar-benar ada DAN belum pernah dipindah
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) and not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'legacy_' || t
    ) then
      execute format('alter table public.%I rename to %I', t, 'legacy_' || t);
      raise notice 'Renamed public.% -> public.legacy_%', t, t;
    end if;
  end loop;
end $$;
