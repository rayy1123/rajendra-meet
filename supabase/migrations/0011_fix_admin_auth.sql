-- =====================================================================
-- SCMS — 0011 perbaikan akun admin
--
-- Login gagal dengan "Database error querying schema" (HTTP 500).
-- Penyebab: GoTrue (Supabase Auth) memindai kolom token di auth.users
-- ke tipe string non-nullable. Bila kolom tersebut NULL — seperti pada
-- baris yang disisipkan manual — pemindaian gagal dan seluruh permintaan
-- login error, bukan sekadar "password salah".
--
-- Perbaikannya: isi kolom token dengan string kosong, bukan NULL.
-- Berlaku untuk SEMUA user agar akun yang dibuat manual berikutnya aman.
-- =====================================================================

update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where confirmation_token is null
   or recovery_token is null
   or email_change is null
   or email_change_token_new is null
   or email_change_token_current is null
   or phone_change is null
   or phone_change_token is null
   or reauthentication_token is null;
