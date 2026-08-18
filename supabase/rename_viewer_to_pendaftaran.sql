-- Ganti akun viewer (penonton@rajendra.id) -> akun pendaftaran (pendaftaran@rajendra.id)
-- Role tetap 'viewer' (sudah diizinkan insert registrations via registrations_write_viewer / 0013).
-- Password & id tetap sama; hanya label/email diubah agar akun dipakai untuk mendaftar lomba.

do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'penonton@rajendra.id';
  if v_uid is null then
    raise notice 'Akun penonton@rajendra.id tidak ditemukan, skip.';
    return;
  end if;

  -- update auth.users
  update auth.users
  set
    email = 'pendaftaran@rajendra.id',
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', 'Akun Pendaftaran'),
    email_confirmed_at = now(),
    updated_at = now()
  where id = v_uid;

  -- update profile
  update public.profiles
  set full_name = 'Akun Pendaftaran'
  where id = v_uid;

  raise notice 'Akun viewer diubah -> pendaftaran@rajendra.id (id=%).', v_uid;
end $$;
