-- =====================================================================
-- SCMS — Seed akun admin (manual, siap tempel ke Supabase SQL Editor)
-- =====================================================================
-- CARA PAKAI:
--   1. Buka Supabase Dashboard > project kamu > SQL Editor.
--   2. Tempel isi file ini.
--   3. GANTI nilai v_pass di bawah dengan password yang KAMU pilih
--      (jangan biarkan placeholder, dan jangan bagikan ke siapa pun).
--   4. Klik Run.
--   5. Login di app dengan email di bawah + password yang kamu tulis.
--
-- Catatan keamanan:
--   - Kolom encrypted_password memakai bcrypt (extensions.crypt), sama
--     seperti migrasi 0008 resmi project ini.
--   - Email langsung ditandai terkonfirmasi agar tidak perlu verifikasi.
--   - Setelah login pertama, sebaiknya ganti password lewat app / Supabase.
--   - File ini sengaja diletakkan DI LUAR folder migrations/ supaya tidak
--     kejalankan otomatis saat `supabase db push` / deploy.
-- =====================================================================

do $$
declare
  v_user_id uuid;
  v_email   text := 'admin@rajendra.id';   -- ganti kalau mau email lain
  v_pass    text := 'GANTI_DENGAN_PASSWORD_KAMU';  -- <-- ISI SENDIRI
  v_name    text := 'Administrator SCMS';
begin
  -- pgcrypto menyediakan crypt() untuk hash bcrypt
  create extension if not exists pgcrypto with schema extensions;

  if v_pass = 'GANTI_DENGAN_PASSWORD_KAMU' or length(v_pass) < 8 then
    raise exception 'PASSWORD BELUM DIISI. Edit v_pass di atas sebelum menjalankan.';
  end if;

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
      jsonb_build_object('full_name', v_name),
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
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email',
      now(), now(), now()
    );

    raise notice 'Akun admin dibuat: %', v_email;
  else
    raise notice 'Akun admin sudah ada: %', v_email;
  end if;

  -- Pastikan profile ada dan berperan super_admin
  -- (trigger on_auth_user_created sudah bikin profile default 'viewer',
  --  jadi kita naikkan role-nya di sini)
  insert into public.profiles (id, full_name, role)
  values (v_user_id, v_name, 'super_admin')
  on conflict (id) do update set role = 'super_admin', full_name = v_name;
end $$;
