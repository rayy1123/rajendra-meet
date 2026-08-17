-- =====================================================================
-- SCMS — 0012 Fitur Pendaftaran Lomba & Verifikasi Pembayaran
-- TIDAK mengubah tabel/column yang sudah ada; hanya MENAMBAH:
--   1) kolom nullable registrant_id di registrations
--   2) tabel baru payment_verifications (pending/verified/rejected)
--   3) enum payment_status
-- =====================================================================

do $do$ begin
  create type payment_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $do$;

alter table public.registrations
  add column if not exists registrant_id uuid references auth.users(id) on delete set null;
create index if not exists idx_registrations_registrant
  on public.registrations(registrant_id);

create table if not exists public.payment_verifications (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  status          payment_status not null default 'pending',
  amount_due      int not null default 0 check (amount_due >= 0),
  proof_url       text,
  notes           text not null default '',
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_payver_reg on public.payment_verifications(registration_id);
create index if not exists idx_payver_status on public.payment_verifications(status);

create or replace function public.touch_payver_updated_at()
returns trigger language plpgsql as $func$
begin
  new.updated_at = now();
  return new;
end $func$;

drop trigger if exists payver_touch_updated_at on public.payment_verifications;
create trigger payver_touch_updated_at
  before update on public.payment_verifications
  for each row execute function public.touch_payver_updated_at();

alter table public.payment_verifications enable row level security;

drop policy if exists payver_read on public.payment_verifications;
create policy payver_read on public.payment_verifications
  for select using (true);

drop policy if exists payver_insert on public.payment_verifications;
create policy payver_insert on public.payment_verifications
  for insert with check (
    auth.uid() is not null
    and exists (
      select 1 from public.registrations r
      where r.id = registration_id and r.registrant_id = auth.uid()
    )
  );

drop policy if exists payver_update on public.payment_verifications;
create policy payver_update on public.payment_verifications
  for update using (public.can_operate())
  with check (public.can_operate());

drop policy if exists registrations_read_own on public.registrations;
create policy registrations_read_own on public.registrations
  for select using (
    public.is_authenticated()
    and (registrant_id = auth.uid() or public.can_operate())
  );
