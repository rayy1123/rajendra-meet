select ce.event_id, e.name as event_name, ce.id as ce_id, ce.name as ce_name,
       (select count(*) from heat_assignments ha join heats h on h.id=ha.heat_id where h.competition_event_id=ce.id) as lanes
from competition_events ce
join events e on e.id = ce.event_id
where ce.id in ('0d92d8e0-2d16-45e4-a64c-378db43949c9','1062764a-e80b-4ffc-a6f1-9a66263c59f7');
