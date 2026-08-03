-- =====================================================================
-- SCMS — 0002 age group resolver
-- Resolusi Kelompok Umur dari tanggal lahir berdasarkan age_group_rules.
-- =====================================================================

-- Mengembalikan kode KU untuk satu tanggal lahir pada satu event.
-- Aturan dicek berurutan sort_order (kecil dulu); yang pertama cocok menang.
-- Aturan gender-spesifik diprioritaskan di atas aturan gender-netral.
create or replace function public.resolve_age_group(
  p_event_id   uuid,
  p_birth_date date,
  p_gender     gender_type default null
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.age_group_rules r
  where r.event_id = p_event_id
    and r.is_active
    and (r.gender is null or r.gender = p_gender)
    and (r.birth_date_from is null or p_birth_date >= r.birth_date_from)
    and (r.birth_date_to   is null or p_birth_date <= r.birth_date_to)
  order by
    (r.gender is not null) desc,  -- aturan spesifik gender menang
    r.sort_order asc,
    r.created_at asc
  limit 1;
$$;

-- Isi ulang kolom athletes.age_group untuk seluruh atlet pada satu event.
-- Panggil setelah mengubah age_group_rules:
--   select public.reapply_age_groups('<event_id>');
create or replace function public.reapply_age_groups(p_event_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update public.athletes a
  set age_group = coalesce(
    public.resolve_age_group(p_event_id, a.birth_date, a.gender),
    ''
  )
  where a.event_id = p_event_id;

  get diagnostics affected = row_count;
  return affected;
end $$;

-- Set age_group otomatis saat atlet dibuat/diubah, jika tidak diisi manual.
create or replace function public.athletes_set_age_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id is not null
     and (new.age_group is null or new.age_group = '') then
    new.age_group := coalesce(
      public.resolve_age_group(new.event_id, new.birth_date, new.gender),
      ''
    );
  end if;
  return new;
end $$;

drop trigger if exists athletes_age_group_trigger on public.athletes;
create trigger athletes_age_group_trigger
  before insert or update of birth_date, gender, event_id on public.athletes
  for each row execute function public.athletes_set_age_group();
