-- =====================================================================
-- SCMS — 0021 sponsorship
--
-- Tabel sponsors untuk mendukung penempatan logo sponsorship pada
-- Sertifikat Kejuaraan, Buku Acara (Start List), dan Buku Juknis (Petunjuk Teknis).
-- =====================================================================

create table if not exists public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade,
  name        text not null,
  tier        text not null default 'gold' check (tier in ('title', 'platinum', 'gold', 'silver', 'partner')),
  logo_url    text not null default '',
  website_url text,
  is_active   boolean not null default true,
  order_no    int not null default 1,
  created_at  timestamptz not null default now()
);

create index if not exists idx_sponsors_event on public.sponsors(event_id);
create index if not exists idx_sponsors_tier on public.sponsors(tier);

alter table public.sponsors enable row level security;

-- Publik boleh membaca data sponsor aktif
drop policy if exists sponsors_read on public.sponsors;
create policy sponsors_read on public.sponsors
  for select using (true);

-- Panitia & Admin boleh mengelola data sponsor
drop policy if exists sponsors_write on public.sponsors;
create policy sponsors_write on public.sponsors
  for insert with check (
    public.is_super_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'admin_kejuaraan', 'admin_keuangan', 'operator'))
  );

drop policy if exists sponsors_update on public.sponsors;
create policy sponsors_update on public.sponsors
  for update using (
    public.is_super_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'admin_kejuaraan', 'admin_keuangan', 'operator'))
  );

drop policy if exists sponsors_delete on public.sponsors;
create policy sponsors_delete on public.sponsors
  for delete using (
    public.is_super_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'admin_kejuaraan', 'admin_keuangan', 'operator'))
  );
