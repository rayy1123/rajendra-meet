-- Isi school_id untuk atlet SEED agar klasemen medali per sekolah muncul bervariasi.
-- Idempoten: hanya update yang school_id masih NULL.
do $$
declare
  sch uuid[];
begin
  select array_agg(id) into sch from schools;
  if sch is null or array_length(sch, 1) = 0 then
    return;
  end if;

  with ranked as (
    select id,
           sch[1 + (row_number() over (partition by event_id order by id))::int % array_length(sch, 1)] as new_school
    from athletes
    where athlete_number like 'SEED-%' and school_id is null
  )
  update athletes a
  set school_id = r.new_school
  from ranked r
  where a.id = r.id;

  raise notice 'atlet seed diupdate dengan school';
end $$;
