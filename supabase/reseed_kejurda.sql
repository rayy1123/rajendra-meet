-- Isi ulang nomor lomba + heat untuk Kejurda Banten 2026 (event yg masih ada).
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

  -- 50m Gaya Dada Putra SMP -> heats 101..110
  insert into public.heats (competition_event_id, heat_number)
  select ce.id, g.n
  from public.competition_events ce
  cross join generate_series(101, 110) as g(n)
  where ce.event_id = v_event_id and ce.name = '50m Breaststroke Putra SMP'
  on conflict do nothing;

  -- 50m Gaya Dada Putra (tanpa kelompok) -> heats 111..120
  insert into public.competition_events
    (event_id, name, stroke, distance_meters, gender, grade_level, age_group, session_no, order_no)
  select v_event_id, '50m Gaya Dada Putra', 'Breaststroke', 50, 'male'::gender_type, '', '', 1, 121
  where not exists (
    select 1 from public.competition_events where event_id = v_event_id and name = '50m Gaya Dada Putra'
  )
  on conflict do nothing;

  insert into public.heats (competition_event_id, heat_number)
  select ce.id, g.n
  from public.competition_events ce
  cross join generate_series(111, 120) as g(n)
  where ce.event_id = v_event_id and ce.name = '50m Gaya Dada Putra'
  on conflict do nothing;
end $$;

select e.name, count(ce.id) as nomor_lomba, count(distinct h.id) as heats
from public.events e
left join public.competition_events ce on ce.event_id = e.id
left join public.heats h on h.competition_event_id = ce.id
group by e.name order by e.name;
