select e.name,
       count(ce.id) as nomor_lomba,
       count(distinct h.id) as heats,
       min(ce.order_no) as order_min,
       max(ce.order_no) as order_max
from public.events e
left join public.competition_events ce on ce.event_id = e.id
left join public.heats h on h.competition_event_id = ce.id
group by e.name order by e.name;

select ce.name as nomor, h.heat_number
from public.competition_events ce
join public.heats h on h.competition_event_id = ce.id
where ce.name in ('50m Breaststroke Putra SMP','50m Gaya Dada Putra')
order by ce.name, h.heat_number;
