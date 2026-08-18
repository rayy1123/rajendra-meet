select id, email, email_confirmed_at,
       (select role from public.profiles p where p.id = u.id) as role,
       length(encrypted_password) as pw_len,
       left(encrypted_password, 10) as pw_head
from auth.users u
where email in ('panitia@rajendra.id','penonton@rajendra.id','admin@rajendra.id');
