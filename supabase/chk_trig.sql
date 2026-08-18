-- Trigger pada auth.users
select tgname, tgrelid::regclass::text as tbl
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- Trigger pada public.profiles
select tgname, tgrelid::regclass::text as tbl
from pg_trigger
where tgrelid = 'public.profiles'::regclass and not tgisinternal;

-- Fungsi trigger terkait profiles
select routine_name, routine_definition
from information_schema.routines
where routine_name like '%profile%' or routine_name like '%user%'
limit 20;
