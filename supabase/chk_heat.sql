select ce.name, h.heat_number
from public.competition_events ce
join public.heats h on h.competition_event_id = ce.id
where ce.event_id = (select id from public.events where name='Kejurda Banten 2026' limit 1)
  and h.heat_number between 100 and 121
order by ce.name, h.heat_number;
