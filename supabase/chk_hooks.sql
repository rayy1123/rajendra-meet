-- Cek auth hooks & trigger yang mungkin error saat login
select hook_table, hook_name, hook_type, created_at
from auth.hooks
order by created_at;

-- Cek trigger pada auth.users
select tgname, tgtype, tgrelid::regclass
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;

-- Cek trigger pada public.profiles
select tgname, tgrelid::regclass
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and not tgisinternal;
