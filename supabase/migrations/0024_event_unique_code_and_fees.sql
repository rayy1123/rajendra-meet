-- =====================================================================
-- SCMS — 0024 Fitur Pengaturan Kode Unik & Biaya Pendaftaran per Event
-- =====================================================================

-- 1. Tambah kolom konfigurasi kode unik, biaya, dan rekening pada tabel 'events'
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS use_unique_code boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unique_code_mode text NOT NULL DEFAULT 'random_3_digit',
  ADD COLUMN IF NOT EXISTS unique_code_fixed int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_code_min int NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS unique_code_max int NOT NULL DEFAULT 999,
  ADD COLUMN IF NOT EXISTS fee_per_event int NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT 'Bank Central Asia (BCA)',
  ADD COLUMN IF NOT EXISTS bank_account_no text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_name text NOT NULL DEFAULT 'Panitia Pelaksana Renang';

-- 2. Tambah kolom kode unik, nominal pokok, dan nomor invoice pada 'payment_verifications'
ALTER TABLE public.payment_verifications
  ADD COLUMN IF NOT EXISTS unique_code int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_amount int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_no text;

CREATE INDEX IF NOT EXISTS idx_payver_unique_code ON public.payment_verifications(unique_code);
