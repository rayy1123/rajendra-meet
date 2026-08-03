-- Diagnostik sementara: memeriksa kondisi akun admin yang baru dibuat.
-- Hasil dibaca lewat tabel bantu karena CLI tidak punya `db query`.

drop table if exists public._diag;
create table public._diag (k text, v text);
alter table public._diag enable row level security;

do $$
declare
  u record;
  i record;
  cnt int;
begin
  select * into u from auth.users where email = 'admin@rajendra.id';
  if u is null then
    insert into public._diag values ('user','TIDAK ADA');
    return;
  end if;

  insert into public._diag values ('user.id', u.id::text);
  insert into public._diag values ('user.aud', coalesce(u.aud,'<null>'));
  insert into public._diag values ('user.role', coalesce(u.role,'<null>'));
  insert into public._diag values ('email_confirmed_at', coalesce(u.email_confirmed_at::text,'<null>'));
  insert into public._diag values ('encrypted_password_len', coalesce(length(u.encrypted_password)::text,'<null>'));
  insert into public._diag values ('confirmation_token_isnull', (u.confirmation_token is null)::text);
  insert into public._diag values ('recovery_token_isnull', (u.recovery_token is null)::text);
  insert into public._diag values ('email_change_isnull', (u.email_change is null)::text);
  insert into public._diag values ('email_change_token_new_isnull', (u.email_change_token_new is null)::text);
  insert into public._diag values ('email_change_token_current_isnull', (u.email_change_token_current is null)::text);
  insert into public._diag values ('phone_change_isnull', (u.phone_change is null)::text);
  insert into public._diag values ('phone_change_token_isnull', (u.phone_change_token is null)::text);
  insert into public._diag values ('reauthentication_token_isnull', (u.reauthentication_token is null)::text);

  select count(*) into cnt from auth.identities where user_id = u.id;
  insert into public._diag values ('identities_count', cnt::text);

  select * into i from auth.identities where user_id = u.id limit 1;
  if i is not null then
    insert into public._diag values ('identity.provider', coalesce(i.provider,'<null>'));
    insert into public._diag values ('identity.provider_id', coalesce(i.provider_id,'<null>'));
    insert into public._diag values ('identity.identity_data', coalesce(i.identity_data::text,'<null>'));
  end if;

  select count(*) into cnt from public.profiles where id = u.id;
  insert into public._diag values ('profiles_count', cnt::text);
end $$;
