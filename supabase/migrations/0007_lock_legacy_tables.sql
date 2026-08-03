-- =====================================================================
-- SCMS — 0007 kunci tabel legacy_*
--
-- Tabel legacy_* disimpan sebagai cadangan hasil migrasi, tetapi tanpa
-- RLS tabel tersebut terbaca publik lewat REST API (anon key) — termasuk
-- data pribadi atlet. Migrasi ini menutupnya: RLS aktif tanpa satu pun
-- policy, sehingga hanya service_role (yang melewati RLS) bisa mengakses.
--
-- Tabel bawaan Laravel ikut dikunci: `users` berisi hash password dan
-- `sessions` berisi payload sesi — keduanya tidak boleh terbaca publik.
-- =====================================================================

do $$
declare
  t text;
  targets text[] := array[
    'legacy_schools',
    'legacy_events',
    'legacy_athletes',
    'legacy_competition_events',
    'legacy_registrations',
    'legacy_heats',
    'legacy_heat_assignments',
    'legacy_results',
    'legacy_rajendra_records',
    'legacy_registration_map',
    'users',
    'sessions',
    'password_reset_tokens',
    'cache',
    'cache_locks',
    'jobs',
    'job_batches',
    'failed_jobs',
    'migrations'
  ];
begin
  foreach t in array targets loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table public.%I enable row level security', t);
      -- Sengaja TIDAK dibuatkan policy: default-deny untuk semua peran
      -- kecuali service_role. Data tetap ada dan bisa dipulihkan.
      raise notice 'RLS diaktifkan (default-deny) pada public.%', t;
    end if;
  end loop;
end $$;
