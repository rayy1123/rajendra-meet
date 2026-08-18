-- =====================================================================
-- SCMS — Seed data dummy kejuaraan (jalankan via: supabase db execute)
-- Buat beberapa event dengan variasi lintasan + nomor lomba berurutan.
-- Termasuk contoh: 50m Gaya Dada Putra SMP -> heat 101..110,
--                  50m Gaya Dada Putra      -> heat 111..120.
-- =====================================================================

-- ---------------------------------------------------------------
-- 1) EVENTS (variasi pool_type & lane_count)
-- ---------------------------------------------------------------
insert into public.events
  (name, organizer, location, start_date, end_date, pool_type, pool_length_meters, lane_count, is_published)
values
  ('Kejurda Banten 2026', 'Pengprov PRSI Banten', 'Kolam Renang Bulungan, Jakarta Selatan',
   '2026-07-28', '2026-07-29', 'Long Course', 50, 8, true),
  ('POPDA DKI Jakarta 2026', 'Dispora DKI', 'Aqua Indonesia, Cibubur',
   '2026-08-10', '2026-08-12', 'Short Course', 25, 10, true),
  ('Festival Renang Pelajar 2026', 'Rajendra Meet', 'Kolam Renang Pelajar, Surabaya',
   '2026-09-05', '2026-09-06', 'Long Course', 50, 6, true)
on conflict do nothing;

-- ---------------------------------------------------------------
-- 2) COMPETITION EVENTS — berurutan order_no 1..N per event
--    Kombinasi siklikal: stroke x jarak x gender x kelompok
-- ---------------------------------------------------------------
do $$
declare
  v_event_id uuid;
  v_strokes text[] := array['Freestyle','Backstroke','Breaststroke','Butterfly','Individual Medley'];
  v_dists   int[]    := array[50,100,200];
  v_genders text[]   := array['male','female'];
  v_grades  text[]   := array['TK','SD','SMP','SMA'];
  v_stroke  text;
  v_dist    int;
  v_gender  text;
  v_glabel  text;
  v_grade   text;
  v_name    text;
  v_n       int;
  v_idx     int;
begin
  -- Event 1: 120 nomor lomba berurutan
  select id into v_event_id from public.events where name = 'Kejurda Banten 2026' limit 1;
  for v_n in 1..120 loop
    v_idx := v_n - 1;
    v_stroke := v_strokes[((v_idx % 5) + 1)];
    v_dist   := v_dists[((v_idx / 5 % 3) + 1)];
    v_gender := v_genders[((v_idx / 15 % 2) + 1)];
    v_grade  := v_grades[((v_idx / 30 % 4) + 1)];
    v_glabel := case when v_gender = 'male' then 'Putra' else 'Putri' end;
    v_name   := v_dist || 'm ' || v_stroke || ' ' || v_glabel || ' ' || v_grade;
    insert into public.competition_events
      (event_id, name, stroke, distance_meters, gender, grade_level, age_group, session_no, order_no)
    values
      (v_event_id, v_name, v_stroke, v_dist, v_gender::gender_type, v_grade, v_grade, 1, v_n)
    on conflict do nothing;
  end loop;

  -- Event 2: 80 nomor
  select id into v_event_id from public.events where name = 'POPDA DKI Jakarta 2026' limit 1;
  for v_n in 1..80 loop
    v_idx := v_n - 1;
    v_stroke := v_strokes[((v_idx % 5) + 1)];
    v_dist   := v_dists[((v_idx / 5 % 3) + 1)];
    v_gender := v_genders[((v_idx / 15 % 2) + 1)];
    v_grade  := v_grades[((v_idx / 30 % 4) + 1)];
    v_glabel := case when v_gender = 'male' then 'Putra' else 'Putri' end;
    v_name   := v_dist || 'm ' || v_stroke || ' ' || v_glabel || ' ' || v_grade;
    insert into public.competition_events
      (event_id, name, stroke, distance_meters, gender, grade_level, age_group, session_no, order_no)
    values
      (v_event_id, v_name, v_stroke, v_dist, v_gender::gender_type, v_grade, v_grade, 1, v_n)
    on conflict do nothing;
  end loop;

  -- Event 3: 50 nomor
  select id into v_event_id from public.events where name = 'Festival Renang Pelajar 2026' limit 1;
  for v_n in 1..50 loop
    v_idx := v_n - 1;
    v_stroke := v_strokes[((v_idx % 5) + 1)];
    v_dist   := v_dists[((v_idx / 5 % 3) + 1)];
    v_gender := v_genders[((v_idx / 15 % 2) + 1)];
    v_grade  := v_grades[((v_idx / 30 % 4) + 1)];
    v_glabel := case when v_gender = 'male' then 'Putra' else 'Putri' end;
    v_name   := v_dist || 'm ' || v_stroke || ' ' || v_glabel || ' ' || v_grade;
    insert into public.competition_events
      (event_id, name, stroke, distance_meters, gender, grade_level, age_group, session_no, order_no)
    values
      (v_event_id, v_name, v_stroke, v_dist, v_gender::gender_type, v_grade, v_grade, 1, v_n)
    on conflict do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------
-- 3) HEATS CONTOH — 50m Gaya Dada Putra SMP -> 101..110
--                    50m Gaya Dada Putra      -> 111..120
-- ---------------------------------------------------------------
insert into public.heats (competition_event_id, heat_number)
select ce.id, g.n
from public.competition_events ce
cross join generate_series(101, 110) as g(n)
where ce.event_id = (select id from public.events where name = 'Kejurda Banten 2026' limit 1)
  and ce.name = '50m Breaststroke Putra SMP'
on conflict do nothing;

-- Nomor gaya dada putra (tanpa kelompok) khusus untuk contoh 111..120
insert into public.competition_events
  (event_id, name, stroke, distance_meters, gender, grade_level, age_group, session_no, order_no)
select
  (select id from public.events where name = 'Kejurda Banten 2026' limit 1),
  '50m Gaya Dada Putra', 'Breaststroke', 50, 'male'::gender_type, '', '', 1, 121
where not exists (
  select 1 from public.competition_events
  where event_id = (select id from public.events where name = 'Kejurda Banten 2026' limit 1)
    and name = '50m Gaya Dada Putra'
)
on conflict do nothing;

insert into public.heats (competition_event_id, heat_number)
select ce.id, g.n
from public.competition_events ce
cross join generate_series(111, 120) as g(n)
where ce.event_id = (select id from public.events where name = 'Kejurda Banten 2026' limit 1)
  and ce.name = '50m Gaya Dada Putra'
on conflict do nothing;

-- ---------------------------------------------------------------
-- 4) SAMPLE ATHLETES + HASIL agar scoreboard punya isi (event 1)
-- ---------------------------------------------------------------
do $$
declare
  v_event uuid;
  v_school uuid;
  v_ce1 uuid; v_ce2 uuid; v_ce3 uuid;
  v_ath uuid;
  v_reg uuid;
  v_heat uuid;
  i int;
  v_names text[] := array['Andi Wibowo','Budi Santoso','Caca Hermawan','Dedi Pratama','Eko Saputra','Fajar Nugroho'];
  v_times int[] := array[28500, 29120, 27640, 30210, 26880, 29990];
begin
  select id into v_event from public.events where name = 'Kejurda Banten 2026' limit 1;

  insert into public.schools (name, city, province)
  values ('SMPN 1 Renang', 'Jakarta', 'DKI Jakarta')
  on conflict (name) do update set name = excluded.name
  returning id into v_school;

  select id into v_ce1 from public.competition_events where event_id = v_event and name = '50m Freestyle Putra SMP' limit 1;
  select id into v_ce2 from public.competition_events where event_id = v_event and name = '50m Breaststroke Putra SMP' limit 1;
  select id into v_ce3 from public.competition_events where event_id = v_event and name = '50m Butterfly Putra SMP' limit 1;

  for i in 1..6 loop
    insert into public.athletes
      (event_id, athlete_number, full_name, gender, birth_date, grade_level, class_name, age_group, school_id)
    values
      (v_event, 'SMP' || i, v_names[i], 'male'::gender_type, '2011-05-10', 'SMP', 'Kelas 8', 'SMP', v_school)
    on conflict (event_id, athlete_number) do update set full_name = excluded.full_name
    returning id into v_ath;

    -- registrasi ke 3 nomor
    for j in 1..3 loop
      insert into public.registrations (event_id, athlete_id, competition_event_id, seed_time_ms)
      values (v_event, v_ath,
        (array[v_ce1, v_ce2, v_ce3])[j],
        v_times[i])
      on conflict (athlete_id, competition_event_id) do nothing;
    end loop;
  end loop;

  -- buat heat + hasil untuk 50m Freestyle Putra SMP (1 heat, 6 lane)
  insert into public.heats (competition_event_id, heat_number)
  values (v_ce1, 1)
  on conflict (competition_event_id, heat_number) do nothing
  returning id into v_heat;

  for i in 1..6 loop
    select r.id into v_reg from public.registrations r
    where r.athlete_id = (select id from public.athletes where event_id = v_event and athlete_number = 'SMP' || i)
      and r.competition_event_id = v_ce1;
    insert into public.heat_assignments (heat_id, registration_id, lane_number)
    values (v_heat, v_reg, i)
    on conflict (heat_id, lane_number) do nothing;
  end loop;

  insert into public.results (heat_assignment_id, time_ms, status)
  select ha.id, v_times[i], 'finished'
  from public.heat_assignments ha
  join public.registrations r on r.id = ha.registration_id
  where ha.heat_id = v_heat
    and r.athlete_id = (select id from public.athletes where event_id = v_event and athlete_number = 'SMP' || i)
  on conflict (heat_assignment_id) do nothing;
end $$;

-- ---------------------------------------------------------------
-- 5) VERIFIKASI (return ringkasan)
-- ---------------------------------------------------------------
select
  (select count(*) from public.events) as events,
  (select count(*) from public.competition_events) as competition_events,
  (select count(*) from public.heats) as heats,
  (select count(*) from public.athletes) as athletes;
