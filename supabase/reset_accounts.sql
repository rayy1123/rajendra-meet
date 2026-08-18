-- Reset password ke-2 akun dengan format bcrypt yang sama seperti admin@rajendra.id (terbukti login).
do $$
begin
  update auth.users
  set encrypted_password = extensions.crypt('Panitia#2026', extensions.gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
  where email = 'panitia@rajendra.id';

  update auth.users
  set encrypted_password = extensions.crypt('Penonton#2026', extensions.gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
  where email = 'penonton@rajendra.id';
end $$;
