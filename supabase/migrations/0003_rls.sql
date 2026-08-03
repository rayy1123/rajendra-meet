-- =====================================================================
-- SCMS — 0003 Row Level Security
--
-- Model: aplikasi hanya memakai ANON KEY, jadi RLS adalah satu-satunya
-- penegak otorisasi. UI hanya menyembunyikan tombol, tidak mengamankan.
--
-- Ringkasan hak:
--   anon (publik)  : SELECT data pertandingan yang sudah dipublikasi
--   viewer         : SELECT semua
--   operator       : + INSERT/UPDATE registrations, heats, heat_assignments, results
--   event_admin    : + DELETE pada event yang ia kelola, kelola master data
--   super_admin    : semua, termasuk profiles, settings, point_rules, audit
-- =====================================================================

-- ---------------------------------------------------------------
-- HELPER
-- ---------------------------------------------------------------
create or replace function public.user_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'::user_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.user_role() = 'super_admin';
$$;

-- event_admin hanya berkuasa pada event yang ditugaskan kepadanya
create or replace function public.is_event_admin(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or (
        public.user_role() = 'event_admin'
        and exists (
          select 1 from public.event_admins ea
          where ea.event_id = p_event_id and ea.user_id = auth.uid()
        )
      );
$$;

-- operator dan di atasnya boleh menulis data operasional
create or replace function public.can_operate()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and public.user_role() in ('operator','event_admin','super_admin');
$$;

create or replace function public.is_authenticated()
returns boolean
language sql stable as $$
  select auth.uid() is not null;
$$;

-- Event induk dari sebuah competition_event / heat / heat_assignment
create or replace function public.event_id_of_competition(p_comp_id uuid)
returns uuid
language sql stable security definer set search_path = public as $$
  select event_id from public.competition_events where id = p_comp_id;
$$;

-- ---------------------------------------------------------------
-- ENABLE RLS
-- ---------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.series             enable row level security;
alter table public.events             enable row level security;
alter table public.event_admins       enable row level security;
alter table public.age_group_rules    enable row level security;
alter table public.schools            enable row level security;
alter table public.athletes           enable row level security;
alter table public.competition_events enable row level security;
alter table public.registrations      enable row level security;
alter table public.heats              enable row level security;
alter table public.heat_assignments   enable row level security;
alter table public.results            enable row level security;
alter table public.point_rules        enable row level security;
alter table public.tie_break_rules    enable row level security;
alter table public.rajendra_records   enable row level security;
alter table public.system_configs     enable row level security;
alter table public.audit_logs         enable row level security;

-- ---------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- Hanya super_admin yang boleh mengubah role / membuat profil manual
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------
-- DATA PERTANDINGAN — SELECT terbuka untuk publik (termasuk anon)
-- ---------------------------------------------------------------
drop policy if exists series_read on public.series;
create policy series_read on public.series for select using (true);

drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select using (is_published or public.is_authenticated());

drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select using (true);

drop policy if exists athletes_read on public.athletes;
create policy athletes_read on public.athletes for select using (true);

drop policy if exists comp_events_read on public.competition_events;
create policy comp_events_read on public.competition_events for select using (true);

drop policy if exists registrations_read on public.registrations;
create policy registrations_read on public.registrations for select using (true);

drop policy if exists heats_read on public.heats;
create policy heats_read on public.heats for select using (true);

drop policy if exists heat_assignments_read on public.heat_assignments;
create policy heat_assignments_read on public.heat_assignments for select using (true);

drop policy if exists results_read on public.results;
create policy results_read on public.results for select using (true);

drop policy if exists records_read on public.rajendra_records;
create policy records_read on public.rajendra_records for select using (true);

drop policy if exists age_group_rules_read on public.age_group_rules;
create policy age_group_rules_read on public.age_group_rules for select using (true);

drop policy if exists point_rules_read on public.point_rules;
create policy point_rules_read on public.point_rules for select using (true);

drop policy if exists tie_break_read on public.tie_break_rules;
create policy tie_break_read on public.tie_break_rules for select using (true);

-- ---------------------------------------------------------------
-- SERIES & EVENTS — tulis
-- ---------------------------------------------------------------
drop policy if exists series_write on public.series;
create policy series_write on public.series
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Membuat event: super_admin atau event_admin
drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert with check (
    public.is_super_admin() or public.user_role() = 'event_admin'
  );

drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update using (public.is_event_admin(id)) with check (public.is_event_admin(id));

drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete using (public.is_event_admin(id));

drop policy if exists event_admins_read on public.event_admins;
create policy event_admins_read on public.event_admins
  for select using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists event_admins_write on public.event_admins;
create policy event_admins_write on public.event_admins
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------
-- AGE GROUP RULES — hanya admin event (ini menentukan hasil lomba)
-- ---------------------------------------------------------------
drop policy if exists age_group_rules_write on public.age_group_rules;
create policy age_group_rules_write on public.age_group_rules
  for all using (public.is_event_admin(event_id))
  with check (public.is_event_admin(event_id));

-- ---------------------------------------------------------------
-- MASTER DATA — operator boleh menambah, hanya admin boleh menghapus
-- ---------------------------------------------------------------
drop policy if exists schools_insert on public.schools;
create policy schools_insert on public.schools
  for insert with check (public.can_operate());

drop policy if exists schools_update on public.schools;
create policy schools_update on public.schools
  for update using (public.can_operate()) with check (public.can_operate());

drop policy if exists schools_delete on public.schools;
create policy schools_delete on public.schools
  for delete using (public.user_role() in ('event_admin','super_admin'));

drop policy if exists athletes_insert on public.athletes;
create policy athletes_insert on public.athletes
  for insert with check (public.can_operate());

drop policy if exists athletes_update on public.athletes;
create policy athletes_update on public.athletes
  for update using (public.can_operate()) with check (public.can_operate());

-- Operator TIDAK boleh menghapus atlet
drop policy if exists athletes_delete on public.athletes;
create policy athletes_delete on public.athletes
  for delete using (
    public.is_super_admin()
    or (event_id is not null and public.is_event_admin(event_id))
  );

drop policy if exists comp_events_write on public.competition_events;
create policy comp_events_write on public.competition_events
  for insert with check (public.can_operate());

drop policy if exists comp_events_update on public.competition_events;
create policy comp_events_update on public.competition_events
  for update using (public.is_event_admin(event_id))
  with check (public.is_event_admin(event_id));

drop policy if exists comp_events_delete on public.competition_events;
create policy comp_events_delete on public.competition_events
  for delete using (public.is_event_admin(event_id));

-- ---------------------------------------------------------------
-- REGISTRATIONS / HEATS / RESULTS — operasional, operator boleh tulis
-- ---------------------------------------------------------------
drop policy if exists registrations_insert on public.registrations;
create policy registrations_insert on public.registrations
  for insert with check (public.can_operate());

drop policy if exists registrations_update on public.registrations;
create policy registrations_update on public.registrations
  for update using (public.can_operate()) with check (public.can_operate());

drop policy if exists registrations_delete on public.registrations;
create policy registrations_delete on public.registrations
  for delete using (public.is_event_admin(event_id));

drop policy if exists heats_write on public.heats;
create policy heats_write on public.heats
  for insert with check (public.can_operate());

drop policy if exists heats_update on public.heats;
create policy heats_update on public.heats
  for update using (public.can_operate()) with check (public.can_operate());

-- Generate ulang heat butuh hapus heat lama -> operator diizinkan
drop policy if exists heats_delete on public.heats;
create policy heats_delete on public.heats
  for delete using (public.can_operate());

drop policy if exists heat_assign_write on public.heat_assignments;
create policy heat_assign_write on public.heat_assignments
  for insert with check (public.can_operate());

drop policy if exists heat_assign_update on public.heat_assignments;
create policy heat_assign_update on public.heat_assignments
  for update using (public.can_operate()) with check (public.can_operate());

drop policy if exists heat_assign_delete on public.heat_assignments;
create policy heat_assign_delete on public.heat_assignments
  for delete using (public.can_operate());

drop policy if exists results_insert on public.results;
create policy results_insert on public.results
  for insert with check (public.can_operate());

drop policy if exists results_update on public.results;
create policy results_update on public.results
  for update using (public.can_operate()) with check (public.can_operate());

-- Menghapus hasil = tindakan destruktif, admin saja
drop policy if exists results_delete on public.results;
create policy results_delete on public.results
  for delete using (public.user_role() in ('event_admin','super_admin'));

-- ---------------------------------------------------------------
-- POIN, TIE-BREAK, RECORD, SETTINGS
-- ---------------------------------------------------------------
drop policy if exists point_rules_write on public.point_rules;
create policy point_rules_write on public.point_rules
  for all using (public.is_event_admin(event_id))
  with check (public.is_event_admin(event_id));

drop policy if exists tie_break_write on public.tie_break_rules;
create policy tie_break_write on public.tie_break_rules
  for all using (public.is_event_admin(event_id))
  with check (public.is_event_admin(event_id));

-- Record ditulis sistem saat hasil disimpan -> operator boleh
drop policy if exists records_insert on public.rajendra_records;
create policy records_insert on public.rajendra_records
  for insert with check (public.can_operate());

drop policy if exists records_update on public.rajendra_records;
create policy records_update on public.rajendra_records
  for update using (public.can_operate()) with check (public.can_operate());

drop policy if exists records_delete on public.rajendra_records;
create policy records_delete on public.rajendra_records
  for delete using (public.user_role() in ('event_admin','super_admin'));

drop policy if exists configs_read on public.system_configs;
create policy configs_read on public.system_configs
  for select using (public.is_authenticated());

drop policy if exists configs_write on public.system_configs;
create policy configs_write on public.system_configs
  for all using (
    event_id is null and public.is_super_admin()
    or event_id is not null and public.is_event_admin(event_id)
  )
  with check (
    event_id is null and public.is_super_admin()
    or event_id is not null and public.is_event_admin(event_id)
  );

-- ---------------------------------------------------------------
-- AUDIT LOG — siapa pun yang login boleh menulis, hanya admin membaca
-- ---------------------------------------------------------------
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs
  for insert with check (public.is_authenticated());

drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs
  for select using (public.user_role() in ('event_admin','super_admin'));

-- Audit log tidak boleh diubah atau dihapus oleh siapa pun lewat API.
