select
  email,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  banned_until,
  raw_app_meta_data,
  encrypted_password is not null as has_pw,
  (select count(*) from auth.identities i where i.user_id = u.id) as ident_count
from auth.users u
where email in ('panitia@rajendra.id','penonton@rajendra.id','admin@rajendra.id');
