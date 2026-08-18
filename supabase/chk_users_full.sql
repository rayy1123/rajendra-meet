select
  u.id, u.email, u.aud, u.role, u.instance_id,
  u.encrypted_password is not null as has_pw,
  u.email_confirmed_at, u.confirmed_at, u.last_sign_in_at,
  u.raw_app_meta_data, u.raw_user_meta_data, u.is_super_admin,
  u.created_at, u.updated_at, u.banned_until,
  (select count(*) from auth.identities i where i.user_id = u.id) as ident_count,
  (select provider from auth.identities i where i.user_id = u.id limit 1) as ident_provider
from auth.users u
where email in ('admin@rajendra.id','panitia@rajendra.id','penonton@rajendra.id')
order by email;
