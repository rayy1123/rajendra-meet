-- =====================================================================
-- SCMS — 0001 initial schema
-- Jalankan di Supabase SQL Editor (Database > SQL Editor > New query).
-- Idempotent: aman dijalankan ulang.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin','event_admin','operator','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('male','female');
exception when duplicate_object then null; end $$;

do $$ begin
  create type result_status as enum ('finished','dns','dnf','dq','scr');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------
-- PROFILES (1:1 dengan auth.users)
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        user_role not null default 'viewer',
  created_at  timestamptz not null default now()
);

-- Auto-buat profile setiap user baru mendaftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- SERIES & EVENTS
-- ---------------------------------------------------------------
create table if not exists public.series (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  year        int  not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  series_id           uuid references public.series(id) on delete set null,
  name                text not null,
  logo_url            text,
  organizer           text not null default '',
  location            text not null default '',
  start_date          date not null default current_date,
  end_date            date not null default current_date,
  description         text not null default '',
  pool_type           text not null default 'Long Course',
  pool_length_meters  int  not null default 50,
  lane_count          int  not null default 8 check (lane_count between 4 and 10),
  pool_count          int  not null default 1,
  is_published        boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists idx_events_series on public.events(series_id);

-- Cakupan Event Admin per event
create table if not exists public.event_admins (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ---------------------------------------------------------------
-- AGE GROUP RULES (Kelompok Umur — dapat diatur manual per event)
--
-- KU ditentukan dari TAHUN & BULAN lahir. Aturan disimpan sebagai
-- rentang tanggal lahir inklusif:
--   birth_date_from .. birth_date_to
-- Contoh "KU 1 = kelahiran 2008 ke atas (lebih tua/sama)":
--   birth_date_from = NULL (tanpa batas bawah)
--   birth_date_to   = '2008-12-31'
-- Contoh "KU 3 = kelahiran 2012-01-01 s/d 2013-12-31":
--   birth_date_from = '2012-01-01', birth_date_to = '2013-12-31'
--
-- sort_order menentukan prioritas pencocokan (kecil = dicek lebih dulu),
-- sehingga panitia bisa membuat aturan yang tumpang tindih secara sadar.
-- ---------------------------------------------------------------
create table if not exists public.age_group_rules (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  code             text not null,                       -- 'KU 1'
  label            text not null default '',            -- 'Kelompok Umur 1'
  birth_date_from  date,                                 -- NULL = tanpa batas bawah
  birth_date_to    date,                                 -- NULL = tanpa batas atas
  gender           gender_type,                          -- NULL = berlaku semua gender
  sort_order       int  not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (event_id, code, gender),
  constraint age_group_rules_range_valid
    check (birth_date_from is null or birth_date_to is null or birth_date_from <= birth_date_to),
  constraint age_group_rules_bounded
    check (birth_date_from is not null or birth_date_to is not null)
);
create index if not exists idx_age_group_rules_event on public.age_group_rules(event_id, sort_order);

-- ---------------------------------------------------------------
-- MASTER DATA
-- ---------------------------------------------------------------
create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  city        text not null default '',
  province    text not null default '',
  coach_name  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.athletes (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events(id) on delete cascade,
  athlete_number  text not null,
  full_name       text not null,
  gender          gender_type not null,
  birth_date      date not null,
  grade_level     text not null default '',   -- SD / SMP / SMA
  class_name      text not null default '',   -- Kelas 6
  age_group       text not null default '',   -- hasil resolusi dari age_group_rules
  school_id       uuid references public.schools(id) on delete set null,
  photo_url       text,
  created_at      timestamptz not null default now(),
  unique (event_id, athlete_number)
);
create index if not exists idx_athletes_school on public.athletes(school_id);
create index if not exists idx_athletes_event  on public.athletes(event_id);

create table if not exists public.competition_events (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  name             text not null,
  stroke           text not null default 'Freestyle',
  distance_meters  int  not null default 50,
  gender           gender_type not null,
  grade_level      text not null default '',
  class_name       text not null default '',
  age_group        text not null default '',
  session_no       int  not null default 1,
  order_no         int  not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_comp_events_event on public.competition_events(event_id, order_no);

create table if not exists public.registrations (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events(id) on delete cascade,
  athlete_id            uuid not null references public.athletes(id) on delete cascade,
  competition_event_id  uuid not null references public.competition_events(id) on delete cascade,
  seed_time_ms          int not null default 0 check (seed_time_ms >= 0),
  created_at            timestamptz not null default now(),
  unique (athlete_id, competition_event_id)
);
create index if not exists idx_registrations_comp on public.registrations(competition_event_id);
create index if not exists idx_registrations_event on public.registrations(event_id);

-- ---------------------------------------------------------------
-- HEAT & RESULT
-- ---------------------------------------------------------------
create table if not exists public.heats (
  id                    uuid primary key default gen_random_uuid(),
  competition_event_id  uuid not null references public.competition_events(id) on delete cascade,
  heat_number           int  not null check (heat_number > 0),
  created_at            timestamptz not null default now(),
  unique (competition_event_id, heat_number)
);

create table if not exists public.heat_assignments (
  id               uuid primary key default gen_random_uuid(),
  heat_id          uuid not null references public.heats(id) on delete cascade,
  registration_id  uuid not null references public.registrations(id) on delete cascade,
  lane_number      int  not null check (lane_number > 0),
  created_at       timestamptz not null default now(),
  unique (heat_id, lane_number),
  unique (heat_id, registration_id)
);
create index if not exists idx_heat_assign_reg on public.heat_assignments(registration_id);

create table if not exists public.results (
  id                   uuid primary key default gen_random_uuid(),
  heat_assignment_id   uuid not null unique references public.heat_assignments(id) on delete cascade,
  time_ms              int check (time_ms is null or time_ms > 0),
  status               result_status not null default 'finished',
  is_new_record        boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- status 'finished' wajib punya waktu; status lain tidak boleh punya waktu
  constraint results_time_consistent check (
    (status = 'finished' and time_ms is not null) or
    (status <> 'finished' and time_ms is null)
  )
);
create index if not exists idx_results_status on public.results(status);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists results_touch_updated_at on public.results;
create trigger results_touch_updated_at
  before update on public.results
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- POIN & TIE-BREAK
-- ---------------------------------------------------------------
create table if not exists public.point_rules (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  rank       int  not null check (rank > 0),
  points     numeric(6,2) not null check (points >= 0),
  created_at timestamptz not null default now(),
  unique (event_id, rank)
);

create table if not exists public.tie_break_rules (
  event_id   uuid primary key references public.events(id) on delete cascade,
  ordered    jsonb not null default '["points","gold","silver","bronze"]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- RAJENDRA RECORD
-- ---------------------------------------------------------------
create table if not exists public.rajendra_records (
  id                    uuid primary key default gen_random_uuid(),
  competition_event_id  uuid references public.competition_events(id) on delete set null,
  record_key            text not null,   -- stroke|distance|gender|grade|class|age_group
  athlete_id            uuid references public.athletes(id) on delete set null,
  school_id             uuid references public.schools(id) on delete set null,
  time_ms               int  not null check (time_ms > 0),
  event_year            int  not null,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);
-- Hanya boleh ada satu record aktif per kategori
create unique index if not exists uniq_active_record
  on public.rajendra_records(record_key) where is_active;

-- ---------------------------------------------------------------
-- SETTINGS & AUDIT
-- ---------------------------------------------------------------
create table if not exists public.system_configs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (event_id, key)
);

create table if not exists public.audit_logs (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text not null default '',
  entity_id  text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------
-- REALTIME: aktifkan untuk live result
-- ---------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.results;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.heat_assignments;
exception when duplicate_object then null; end $$;
