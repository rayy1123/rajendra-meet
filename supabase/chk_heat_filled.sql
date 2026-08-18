select h.competition_event_id, ce.name, count(ha.id) as lanes
from heats h
join heat_assignments ha on ha.heat_id = h.id
join competition_events ce on ce.id = h.competition_event_id
group by h.competition_event_id, ce.name
limit 5;
