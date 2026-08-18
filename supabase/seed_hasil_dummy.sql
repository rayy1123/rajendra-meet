-- =====================================================================
-- seed_hasil_dummy.sql
-- Isi heat_assignments + results agar layar /heat-lane, /live, /sertifikat,
-- perangkingan hidup. JUGA isi equipment_maintenance + audit_log.
-- Idempoten: pakai marker athlete_number 'SEED-...' dan skip heat yg sudah
-- punya assignment. Aman dijalankan berulang kali.
-- =====================================================================

do $$
declare
  ev record;
  ce_rec record;
  ht record;
  ath_id uuid;
  reg_id uuid;
  lane_no int;
  n int;
  base_ms int;
  idx int;
  ath_count int;
  pick_ids uuid[];
begin
  -- 1) Pastikan tiap event punya >= 24 atlet SEED
  for ev in select * from events loop
    select count(*) into ath_count from athletes where event_id = ev.id and athlete_number like 'SEED-%';
    if ath_count < 24 then
      for n in 1..(24 - ath_count) loop
        insert into athletes (event_id, athlete_number, full_name, gender, birth_date, grade_level, class_name, age_group)
        values (
          ev.id,
          'SEED-' || substring(ev.id::text, 1, 8) || '-' || lpad((n + ath_count)::text, 3, '0'),
          'Atlet Seed ' || (n + ath_count),
          case when n % 2 = 0 then 'male'::gender_type else 'female'::gender_type end,
          ('2012-01-01'::date + (n % 12 || ' months')::interval)::date,
          case when n % 3 = 0 then 'TK' when n % 3 = 1 then 'SD' else 'SMP' end,
          'Kelas ' || (n % 6 + 1),
          'SEED'
        );
      end loop;
    end if;
  end loop;

  -- 2) Loop heats, isi assignments + results
  for ht in select h.*, ce.event_id, ce.distance_meters from heats h
            join competition_events ce on ce.id = h.competition_event_id
            order by h.heat_number loop

    -- skip kalau sudah ada assignment
    if exists (select 1 from heat_assignments where heat_id = ht.id) then
      continue;
    end if;

    -- ambil 8 atlet SEED dari event ini (rotasi pakai heat_number)
    select array_agg(id) into pick_ids
    from (
      select id from athletes
      where event_id = ht.event_id and athlete_number like 'SEED-%'
      order by id
      offset ((ht.heat_number - 1) * 0)
      limit 8
    ) t;

    if pick_ids is null or array_length(pick_ids, 1) = 0 then
      continue;
    end if;

    base_ms := case
      when ht.distance_meters <= 50 then 26000
      when ht.distance_meters <= 100 then 58000
      when ht.distance_meters <= 200 then 125000
      else 250000
    end;

    for idx in 1..array_length(pick_ids, 1) loop
      ath_id := pick_ids[idx];
      lane_no := idx;

      -- registration (unique athlete+comp_event)
      insert into registrations (event_id, athlete_id, competition_event_id, seed_time_ms)
      values (ht.event_id, ath_id, ht.competition_event_id, base_ms + (idx * 350) + (ht.heat_number * 120))
      on conflict (athlete_id, competition_event_id) do nothing
      returning id into reg_id;

      if reg_id is null then
        select id into reg_id from registrations
        where athlete_id = ath_id and competition_event_id = ht.competition_event_id;
      end if;

      if reg_id is null then
        continue;
      end if;

      -- assignment
      insert into heat_assignments (heat_id, registration_id, lane_number)
      values (ht.id, reg_id, lane_no);

      -- result finished (waktu bervariasi, terurut agar ada ranking)
      insert into results (heat_assignment_id, time_ms, status, is_new_record)
      values (
        (select id from heat_assignments where heat_id = ht.id and lane_number = lane_no),
        base_ms + (idx * 420) + (ht.heat_number * 90) + (random() * 300)::int,
        'finished',
        false
      );
    end loop;
  end loop;

  -- 3) equipment_maintenance (seed, hanya kalau kosong)
  if not exists (select 1 from equipment_maintenance) then
    insert into equipment_maintenance (name, location, category, status, due_date, technician, note) values
      ('Touchpad A1-A8', 'Kolam Utama - Sisi Dalam', 'timing', 'scheduled', current_date + 3, 'J. Smith', 'Kalibrasi rutin touchpad.'),
      ('Starting Blocks 1-8', 'Kolam Utama', 'block', 'overdue', current_date - 2, 'T. Miller', 'Pemeriksaan karet pijakan.'),
      ('Konsol Waktu Cadangan', 'Ruang Kontrol', 'timing', 'done', current_date - 10, 'A. Davis', 'Tes fungsional selesai.'),
      ('Sensor Lane 4', 'Kolam Utama', 'sensor', 'in_progress', current_date + 1, 'M. Rivera', 'Ganti kabel sensor.');
  end if;

  -- 4) audit_log (seed, hanya kalau kosong)
  if not exists (select 1 from audit_log) then
    insert into audit_log (actor_email, action, entity, detail) values
      ('admin@rajendra.id', 'login', 'System Access', 'Login sukses via SSO.'),
      ('admin@rajendra.id', 'time_override', 'Event #45, Heat 3, Lane 4', 'Ubah waktu final 24.56 -> 24.52 (touchpad error).'),
      ('panitia@rajendra.id', 'seeding_edit', 'Event #46, Heat 1', 'Tukar Lane 2 & 3 (scratch mendadak).'),
      ('unknown@203.0.113.45', 'login', 'System Access', 'Login gagal: password salah.');
  end if;

  raise notice 'SEED SELESAI: assignments=% results=%',
    (select count(*) from heat_assignments),
    (select count(*) from results);
end $$;
