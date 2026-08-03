-- =====================================================================
-- SCMS — 0005 migrasi data dari tabel legacy_* (Laravel) ke skema SCMS
--
-- Prasyarat: 0000 (rename legacy) lalu 0001–0003 sudah dijalankan.
-- Idempotent: memakai on conflict do nothing, aman dijalankan ulang.
--
-- Konversi yang dilakukan:
--   athletes.name          -> full_name
--   gender 'MALE'/'FEMALE' -> enum male/female
--   grade (SMA/SMK)        -> grade_level
--   grade_category         -> grade_level pada competition_events
--   registrations.id bigint-> uuid (dipetakan lewat legacy_registration_map)
--   status 'FINISHED'      -> enum finished
--
-- Kolom yang tidak ada di data lama (city, province, class_name) diisi
-- string kosong agar tidak melanggar NOT NULL; panitia melengkapi via UI.
-- =====================================================================

-- Tabel pemetaan id registrasi lama (bigint) ke uuid baru.
create table if not exists public.legacy_registration_map (
  legacy_id bigint primary key,
  new_id    uuid not null
);

do $$
declare
  v_event_id uuid;
begin
  -- Berhenti diam-diam bila tidak ada data legacy (mis. database bersih)
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'legacy_events'
  ) then
    raise notice 'Tidak ada tabel legacy_*; migrasi data dilewati.';
    return;
  end if;

  -- -----------------------------------------------------------
  -- 1. EVENTS
  -- -----------------------------------------------------------
  insert into public.events (
    id, name, logo_url, organizer, location, start_date, end_date,
    description, pool_type, pool_length_meters, lane_count, pool_count,
    is_published, created_at
  )
  select
    e.id,
    e.name,
    e.logo_url,
    coalesce(e.organizer, ''),
    coalesce(e.location, ''),
    e.start_date,
    e.end_date,
    coalesce(e.description, ''),
    'Long Course',
    coalesce(e.pool_length_meters, 50),
    coalesce(e.lane_count, 8),
    1,
    coalesce(e.is_active, true),
    coalesce(e.created_at::timestamptz, now())
  from public.legacy_events e
  on conflict (id) do nothing;

  -- -----------------------------------------------------------
  -- 2. SCHOOLS
  -- -----------------------------------------------------------
  insert into public.schools (id, name, city, province, coach_name, created_at)
  select
    s.id,
    s.name,
    coalesce(s.city, ''),
    coalesce(s.province, ''),
    s.coach_name,
    coalesce(s.created_at::timestamptz, now())
  from public.legacy_schools s
  on conflict (id) do nothing;

  -- Event acuan untuk atlet (data lama hanya punya satu event)
  select id into v_event_id from public.events order by created_at limit 1;

  -- -----------------------------------------------------------
  -- 3. ATHLETES
  -- -----------------------------------------------------------
  insert into public.athletes (
    id, event_id, athlete_number, full_name, gender, birth_date,
    grade_level, class_name, age_group, school_id, photo_url, created_at
  )
  select
    a.id,
    v_event_id,
    a.athlete_number,
    a.name,
    case upper(a.gender) when 'FEMALE' then 'female'::gender_type
                         else 'male'::gender_type end,
    a.birth_date,
    coalesce(a.grade, ''),
    '',            -- class_name belum ada di data lama
    '',            -- age_group diisi trigger dari age_group_rules
    a.school_id,
    a.photo_url,
    coalesce(a.created_at::timestamptz, now())
  from public.legacy_athletes a
  on conflict (id) do nothing;

  -- -----------------------------------------------------------
  -- 4. COMPETITION EVENTS
  -- -----------------------------------------------------------
  insert into public.competition_events (
    id, event_id, name, stroke, distance_meters, gender,
    grade_level, class_name, age_group, session_no, order_no, created_at
  )
  select
    c.id,
    c.event_id,
    c.name,
    coalesce(c.stroke, 'Freestyle'),
    coalesce(c.distance_meters, 50),
    case upper(c.gender) when 'FEMALE' then 'female'::gender_type
                         else 'male'::gender_type end,
    coalesce(c.grade_category, ''),
    '',
    coalesce(c.age_group, ''),
    1,
    row_number() over (order by c.created_at, c.name),
    coalesce(c.created_at::timestamptz, now())
  from public.legacy_competition_events c
  on conflict (id) do nothing;

  -- -----------------------------------------------------------
  -- 5. REGISTRATIONS (bigint id -> uuid)
  -- -----------------------------------------------------------
  insert into public.legacy_registration_map (legacy_id, new_id)
  select r.id, gen_random_uuid()
  from public.legacy_registrations r
  on conflict (legacy_id) do nothing;

  insert into public.registrations (
    id, event_id, athlete_id, competition_event_id, seed_time_ms, created_at
  )
  select
    m.new_id,
    v_event_id,
    r.athlete_id,
    r.competition_event_id,
    coalesce(r.seed_time_ms, 0),
    coalesce(r.created_at::timestamptz, now())
  from public.legacy_registrations r
  join public.legacy_registration_map m on m.legacy_id = r.id
  where r.competition_event_id is not null
    and exists (select 1 from public.athletes a where a.id = r.athlete_id)
    and exists (select 1 from public.competition_events ce where ce.id = r.competition_event_id)
  on conflict (athlete_id, competition_event_id) do nothing;

  -- -----------------------------------------------------------
  -- 6. HEATS
  -- -----------------------------------------------------------
  insert into public.heats (id, competition_event_id, heat_number, created_at)
  select
    h.id,
    h.competition_event_id,
    coalesce(h.heat_number, 1),
    coalesce(h.created_at::timestamptz, now())
  from public.legacy_heats h
  where h.competition_event_id is not null
    and exists (select 1 from public.competition_events ce where ce.id = h.competition_event_id)
  on conflict (competition_event_id, heat_number) do nothing;

  -- -----------------------------------------------------------
  -- 7. HEAT ASSIGNMENTS
  -- -----------------------------------------------------------
  insert into public.heat_assignments (id, heat_id, registration_id, lane_number, created_at)
  select
    ha.id,
    ha.heat_id,
    m.new_id,
    ha.lane_number,
    coalesce(ha.created_at::timestamptz, now())
  from public.legacy_heat_assignments ha
  join public.legacy_registration_map m on m.legacy_id = ha.registration_id
  where ha.heat_id is not null
    and ha.lane_number is not null
    and exists (select 1 from public.heats h where h.id = ha.heat_id)
    and exists (select 1 from public.registrations r where r.id = m.new_id)
  on conflict (heat_id, lane_number) do nothing;

  -- -----------------------------------------------------------
  -- 8. RESULTS (tabel lama kosong, tetap ditangani bila ada isinya)
  -- -----------------------------------------------------------
  insert into public.results (id, heat_assignment_id, time_ms, status, created_at)
  select
    res.id,
    res.heat_assignment_id,
    case when lower(res.status) = 'finished' then res.time_ms else null end,
    lower(res.status)::result_status,
    coalesce(res.created_at::timestamptz, now())
  from public.legacy_results res
  where res.heat_assignment_id is not null
    and exists (select 1 from public.heat_assignments ha where ha.id = res.heat_assignment_id)
    -- lewati baris yang melanggar aturan waktu/status
    and (lower(res.status) <> 'finished' or res.time_ms is not null)
  on conflict (heat_assignment_id) do nothing;

  raise notice 'Migrasi data legacy selesai untuk event %', v_event_id;
end $$;
