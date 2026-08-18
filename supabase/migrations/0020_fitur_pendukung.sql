-- =====================================================================
-- 0020_fitur_pendukung.sql
-- Tabel BARU (additive) untuk panel Admin Stitch:
--   - equipment_maintenance : log perawatan/kalibrasi peralatan teknis
--   - audit_log            : catatan modifikasi sistem & event keamanan
-- Tidak mengubah tabel/RLS yang sudah ada.
-- =====================================================================

create table if not exists public.equipment_maintenance (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  location      text not null default '',
  category      text not null default 'timing',   -- timing | block | sensor | other
  status        text not null default 'scheduled', -- scheduled | in_progress | done | overdue
  due_date      date,
  technician    text,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_eqm_due on public.equipment_maintenance(due_date);

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id) on delete set null,
  actor_email  text,
  action       text not null,                     -- time_override | login | seeding_edit | scratch | other
  entity       text,                              -- mis. "Event #45, Heat 3, Lane 4"
  detail       text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

-- RLS: hanya admin (super_admin) yang boleh baca/tulis panel ini
alter table public.equipment_maintenance enable row level security;
alter table public.audit_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'equipment_maintenance' and policyname = 'eqm_admin'
  ) then
    create policy eqm_admin on public.equipment_maintenance
      for all to authenticated
      using (public.is_super_admin())
      with check (public.is_super_admin());
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'audit_log' and policyname = 'audit_admin'
  ) then
    create policy audit_admin on public.audit_log
      for all to authenticated
      using (public.is_super_admin())
      with check (public.is_super_admin());
  end if;
end $$;
