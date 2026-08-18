-- Set role + konfirmasi email (confirmed_at adalah generated column, jangan di-update)
do $$
declare
  v_p uuid; v_u uuid;
begin
  select id into v_p from auth.users where email='panitia@rajendra.id';
  select id into v_u from auth.users where email='penonton@rajendra.id';

  update auth.users set email_confirmed_at = now(),
    raw_app_meta_data = jsonb_build_object('provider','email','providers',array['email'])
  where id in (v_p, v_u);

  insert into public.profiles (id, full_name, role) values
    (v_p, 'Panitia SCMS', 'super_admin'),
    (v_u, 'Penonton SCMS', 'viewer')
  on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
end $$;
