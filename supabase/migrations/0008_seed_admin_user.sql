-- =====================================================================
-- SCMS — 0008 akun admin pertama
--
-- Login SCMS memakai Supabase Auth (BUKAN `php artisan` / tabel users
-- Laravel lama). Migrasi ini membuat satu akun super_admin supaya
-- panitia bisa masuk pertama kali, lalu menambah user lain dari UI.
--
--   Email    : admin@rajendra.id
--   Password : Rajendra#2026
--
-- GANTI PASSWORD INI setelah login pertama.
--
-- Dibuat langsung di auth.users karena signup lewat anon key dibatasi
-- rate limit pengiriman email. Email langsung ditandai terkonfirmasi
-- agar tidak perlu klik tautan verifikasi.
-- =====================================================================

do $$
declare
  v_user_id uuid;
  v_email   text := 'admin@rajendra.id';
  v_pass    text := 'Rajendra#2026';
begin
  -- pgcrypto menyediakan crypt() untuk hash bcrypt
  create extension if not exists pgcrypto with schema extensions;

  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_pass, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrator SCMS"}'::jsonb,
      now(),
      now()
    );

    -- Identity wajib ada agar login email/password berfungsi
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_user_id,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      'email',
      now(), now(), now()
    );

    raise notice 'Akun admin dibuat: %', v_email;
  else
    raise notice 'Akun admin sudah ada: %', v_email;
  end if;

  -- Pastikan profile ada dan berperan super_admin
  insert into public.profiles (id, full_name, role)
  values (v_user_id, 'Administrator SCMS', 'super_admin')
  on conflict (id) do update set role = 'super_admin';
end $$;
