-- Cek state sebelum seed
select 'heats' as t, count(*) from heats
union all select 'heat_assignments', count(*) from heat_assignments
union all select 'results', count(*) from results
union all select 'registrations', count(*) from registrations
union all select 'athletes', count(*) from athletes
union all select 'competition_events', count(*) from competition_events;
