-- =====================================================================
-- SCMS — 0022 landing_showcases
--
-- Tabel untuk mengelola konten beranda publik:
-- - Poster lomba yang akan datang
-- - Counter statistik (Peserta, Team, Event)
-- - Galeri foto kolam renang
-- =====================================================================

create table if not exists public.landing_showcases (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('poster', 'stat', 'gallery')),
  title       text not null default '',
  subtitle    text,
  image_url   text,
  link_url    text,
  value       text,
  order_no    int not null default 1,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_landing_showcases_type on public.landing_showcases(type);

alter table public.landing_showcases enable row level security;

-- Publik boleh membaca data aktif
drop policy if exists landing_showcases_read on public.landing_showcases;
create policy landing_showcases_read on public.landing_showcases
  for select using (true);

-- Panitia & Admin boleh mengelola
drop policy if exists landing_showcases_insert on public.landing_showcases;
create policy landing_showcases_insert on public.landing_showcases
  for insert with check (
    public.is_super_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'admin_kejuaraan', 'operator'))
  );

drop policy if exists landing_showcases_update on public.landing_showcases;
create policy landing_showcases_update on public.landing_showcases
  for update using (
    public.is_super_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'admin_kejuaraan', 'operator'))
  );

drop policy if exists landing_showcases_delete on public.landing_showcases;
create policy landing_showcases_delete on public.landing_showcases
  for delete using (
    public.is_super_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('super_admin', 'admin_kejuaraan', 'operator'))
  );

-- Seed default stat counters
insert into public.landing_showcases (type, title, value, order_no) values
  ('stat', 'Peserta', '250+', 1),
  ('stat', 'Team', '150+', 2),
  ('stat', 'Event', '100+', 3);
