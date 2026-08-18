select (select count(*) from public.events) as events,
       (select count(*) from public.competition_events) as comp_events,
       (select count(*) from public.heats) as heats,
       (select count(*) from public.heats where heat_number between 101 and 120) as heats_101_120;
