-- Buat akun Admin (super_admin) + akun User (viewer) untuk testing.
-- Pola sama dengan seed_admin.sql (insert auth.users + identities + profiles).

do $$
declare
  v_admin uuid;
  v_user  uuid;
begin
  create extension if not exists pgcrypto with schema extensions;

  -- ---------- ADMIN ----------
  select id into v_admin from auth.users where email = 'panitia@rajendra.id';
  if v_admin is null then
    v_admin := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_admin,
      'authenticated', 'authenticated', 'panitia@rajendra.id',
      extensions.crypt('Panitia#2026', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Panitia SCMS'),
      now(), now()
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_admin, v_admin,
      jsonb_build_object('sub', v_admin::text, 'email', 'panitia@rajendra.id', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
  insert into public.profiles (id, full_name, role)
  values (v_admin, 'Panitia SCMS', 'super_admin')
  on conflict (id) do update set role = 'super_admin', full_name = 'Panitia SCMS';

  -- ---------- USER (viewer) ----------
  select id into v_user from auth.users where email = 'penonton@rajendra.id';
  if v_user is null then
    v_user := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user,
      'authenticated', 'authenticated', 'penonton@rajendra.id',
      extensions.crypt('Penonton#2026', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Penonton SCMS'),
      now(), now()
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_user, v_user,
      jsonb_build_object('sub', v_user::text, 'email', 'penonton@rajendra.id', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
  -- profile otomatis jadi 'viewer' via trigger; pastikan ada
  insert into public.profiles (id, full_name, role)
  values (v_user, 'Penonton SCMS', 'viewer')
  on conflict (id) do update set full_name = 'Penonton SCMS';

  raise notice 'ADMIN: panitia@rajendra.id | USER: penonton@rajendra.id';
end $$;

select email, (select role from public.profiles p where p.id = u.id) as role
from auth.users u
where email in ('panitia@rajendra.id','penonton@rajendra.id','admin@rajendra.id');
