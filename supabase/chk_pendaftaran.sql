select
  u.email,
  p.full_name,
  p.role
from auth.users u
join public.profiles p on p.id = u.id
where u.email in ('pendaftaran@rajendra.id','penonton@rajendra.id')
order by u.email;
