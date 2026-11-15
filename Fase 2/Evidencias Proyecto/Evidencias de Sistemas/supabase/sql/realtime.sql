do $$
declare
  target text;
  targets constant text[] := array[
    'patients',
    'consultations',
    'prescriptions',
    'audit_logs',
    'profiles',
    'clinic_settings',
    'login_attempts'
  ];
begin
  foreach target in array targets loop
    if to_regclass(format('public.%I', target)) is null then
      continue;
    end if;

    execute format('alter table public.%I replica identity full', target);

    begin
      execute format(
        'alter publication supabase_realtime add table public.%I',
        target
      );
    exception
      when duplicate_object then
        null;
    end;
  end loop;
end;
$$;
