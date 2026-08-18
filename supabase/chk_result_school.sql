select distinct a.full_name, a.school_id, s.name as school_name
from results r
join heat_assignments ha on ha.id = r.heat_assignment_id
join registrations reg on reg.id = ha.registration_id
join athletes a on a.id = reg.athlete_id
left join schools s on s.id = a.school_id
limit 10;
