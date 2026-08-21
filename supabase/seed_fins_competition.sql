-- =====================================================================
-- SCMS — Seed nomor perlombaan gaya (TK/SD/SMP/SMA + Fins)
-- Jalankan via: supabase db query --linked -f supabase/seed_fins_competition.sql
--
-- 1) Hapus SELURUH competition_events (cascade -> registrations, heats,
--    heat_assignments, results ikut terhapus). Athletes & schools tetap.
-- 2) Seed nomor dari list user ke event "Festival Renang Pelajar 2026"
--    (fallback: event pertama jika nama tidak ketemu).
--    Kombinasi: 10 kelompok usia (gender-split = 20) x 8 nomor gaya = 160 nomor.
-- 3) Isi 16 peserta ke 1 nomor: "25M Gaya Bebas Fins Putra SD Kelas 1".
-- =====================================================================

-- 0) Bersihkan nomor lama (instruksi: "sisanya dihapus saja")
delete from public.competition_events;

-- 1) Seed nomor + 16 peserta
do $$
declare
  v_event   uuid;
  v_schools uuid[];
  v_sch     uuid;
  v_ce      uuid;
  v_ath     uuid;
  i         int;
  j         int;
  k         int;
  g         text;
  glabel    text;
  ord       int := 0;

  -- Kelompok usia (index paralel)
  grades  text[] := array['TK','TK','SD','SD','SD','SD','SD','SD','SMP','SMA'];
  classes text[] := array['PAUD','TK','Kelas 1','Kelas 2','Kelas 3','Kelas 4','Kelas 5','Kelas 6','','',''];
  ags     text[] := array['PAUD','TK','SD Kelas 1','SD Kelas 2','SD Kelas 3','SD Kelas 4','SD Kelas 5','SD Kelas 6','SMP','SMA'];

  -- Nomor gaya (persis dari list user)
  nms     text[] := array[
    '25M Papan Kaki Bebas Fins','25M Gaya Bebas Fins','25M Gaya Dada','25M Gaya Kupu Fins',
    '25M Gaya Punggung Fins','50M Gaya Bebas Fins','50M Gaya Dada','50M Gaya Kupu Fins'
  ];
  strokes text[] := array['Freestyle','Freestyle','Breaststroke','Butterfly','Backstroke','Freestyle','Breaststroke','Butterfly'];
  dists   int[]  := array[25,25,25,25,25,50,50,50];
begin
  -- Event target
  select id into v_event from public.events where name = 'Festival Renang Pelajar 2026' limit 1;
  if v_event is null then
    select id into v_event from public.events order by created_at limit 1;
  end if;

  -- Ambil daftar sekolah untuk peserta
  select array_agg(id) into v_schools
  from (select id from public.schools order by created_at limit 10) s;

  -- Seed competition_events: kelompok usia x gender x nomor gaya
  for j in 1..array_length(grades, 1) loop
    foreach g in array array['male','female'] loop
      glabel := case when g = 'male' then 'Putra' else 'Putri' end;
      for k in 1..array_length(nms, 1) loop
        ord := ord + 1;
        insert into public.competition_events
          (event_id, name, stroke, distance_meters, gender, grade_level, class_name, age_group, session_no, order_no)
        values
          (v_event,
           nms[k] || ' ' || glabel || ' ' || ags[j],
           strokes[k], dists[k], g::gender_type,
           grades[j], classes[j], ags[j], 1, ord)
        on conflict do nothing;
      end loop;
    end loop;
  end loop;

  -- 2) 16 peserta untuk 1 nomor pilihan
  select id into v_ce
  from public.competition_events
  where event_id = v_event
    and name = '25M Gaya Bebas Fins Putra SD Kelas 1'
  limit 1;

  for i in 1..16 loop
    v_sch := v_schools[((i - 1) % coalesce(array_length(v_schools, 1), 1)) + 1];
    insert into public.athletes
      (event_id, athlete_number, full_name, gender, birth_date, grade_level, class_name, age_group, school_id)
    values
      (v_event,
       'FINS-' || lpad(i::text, 2, '0'),
       'Peserta Fins ' || i,
       'male'::gender_type,
       ('2019-0' || ((i % 9) + 1) || '-15')::date,
       'SD', 'Kelas 1', 'SD Kelas 1', v_sch)
    on conflict (event_id, athlete_number) do update set full_name = excluded.full_name
    returning id into v_ath;

    insert into public.registrations (event_id, athlete_id, competition_event_id, seed_time_ms)
    values (v_event, v_ath, v_ce, 30000 + i * 120)
    on conflict (athlete_id, competition_event_id) do nothing;
  end loop;
end $$;

-- 3) Verifikasi
select
  (select count(*) from public.competition_events) as total_nomor,
  (select count(*) from public.competition_events where name like '%Fins%') as nomor_fins,
  (select count(*) from public.registrations) as total_registrasi,
  (select count(*) from public.registrations
     where competition_event_id = (
       select id from public.competition_events
       where name = '25M Gaya Bebas Fins Putra SD Kelas 1' limit 1)) as peserta_nomor_target;
