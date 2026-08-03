-- =====================================================================
-- SCMS — 0004 seed default
-- Menyiapkan aturan default untuk SATU event. Ganti :event_id dulu.
--
-- Cara pakai di SQL Editor: ganti seluruh '00000000-0000-0000-0000-000000000000'
-- dengan id event Anda, lalu jalankan.
-- =====================================================================

do $$
declare
  v_event_id uuid := '00000000-0000-0000-0000-000000000000';  -- <<< GANTI INI
  v_base_year int;
begin
  if not exists (select 1 from public.events where id = v_event_id) then
    raise exception 'Event % tidak ditemukan. Ganti v_event_id terlebih dahulu.', v_event_id;
  end if;

  select extract(year from start_date)::int into v_base_year
  from public.events where id = v_event_id;

  -- -----------------------------------------------------------
  -- Kelompok Umur default (contoh 6 KU, berbasis tahun kelahiran)
  -- KU 1 = paling tua (tanpa batas bawah), KU 6 = paling muda.
  -- Panitia dapat mengubah tanggal, menambah, atau menghapus lewat Settings.
  -- -----------------------------------------------------------
  insert into public.age_group_rules
    (event_id, code, label, birth_date_from, birth_date_to, sort_order)
  values
    (v_event_id, 'KU 1', 'Kelompok Umur 1',
       null,                                  make_date(v_base_year - 17, 12, 31), 1),
    (v_event_id, 'KU 2', 'Kelompok Umur 2',
       make_date(v_base_year - 16, 1, 1),     make_date(v_base_year - 15, 12, 31), 2),
    (v_event_id, 'KU 3', 'Kelompok Umur 3',
       make_date(v_base_year - 14, 1, 1),     make_date(v_base_year - 13, 12, 31), 3),
    (v_event_id, 'KU 4', 'Kelompok Umur 4',
       make_date(v_base_year - 12, 1, 1),     make_date(v_base_year - 11, 12, 31), 4),
    (v_event_id, 'KU 5', 'Kelompok Umur 5',
       make_date(v_base_year - 10, 1, 1),     make_date(v_base_year - 9, 12, 31),  5),
    (v_event_id, 'KU 6', 'Kelompok Umur 6',
       make_date(v_base_year - 8, 1, 1),      null,                                6)
  on conflict (event_id, code, gender) do nothing;

  -- -----------------------------------------------------------
  -- Sistem poin default: 10, 8, 6, 5, 4, 3, 2, 1
  -- -----------------------------------------------------------
  insert into public.point_rules (event_id, rank, points)
  values
    (v_event_id, 1, 10), (v_event_id, 2, 8), (v_event_id, 3, 6), (v_event_id, 4, 5),
    (v_event_id, 5, 4),  (v_event_id, 6, 3), (v_event_id, 7, 2), (v_event_id, 8, 1)
  on conflict (event_id, rank) do nothing;

  -- -----------------------------------------------------------
  -- Tie-break default
  -- -----------------------------------------------------------
  insert into public.tie_break_rules (event_id, ordered)
  values (v_event_id, '["points","gold","silver","bronze"]'::jsonb)
  on conflict (event_id) do nothing;

  -- Terapkan KU ke atlet yang sudah ada
  perform public.reapply_age_groups(v_event_id);

  raise notice 'Seed default selesai untuk event %', v_event_id;
end $$;
