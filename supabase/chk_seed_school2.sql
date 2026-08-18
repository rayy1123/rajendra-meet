select a.full_name, a.athlete_number, a.school_id is not null as has_school
from athletes a
where a.athlete_number like 'SEED-%'
limit 5;
-- berapa seed yg masih null
select count(*) as still_null from athletes where athlete_number like 'SEED-%' and school_id is null;
