select count(*) as seed_with_school from athletes where athlete_number like 'SEED-%' and school_id is not null;
