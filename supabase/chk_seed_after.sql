select 'assignments' as t, count(*) from heat_assignments
union all select 'results', count(*) from results
union all select 'registrations', count(*) from registrations
union all select 'athletes_seed', (select count(*) from athletes where athlete_number like 'SEED-%')
union all select 'equipment', count(*) from equipment_maintenance
union all select 'audit', count(*) from audit_log;
