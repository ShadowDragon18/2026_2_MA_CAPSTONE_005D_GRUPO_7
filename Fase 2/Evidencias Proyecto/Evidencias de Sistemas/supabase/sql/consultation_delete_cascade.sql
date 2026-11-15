do $$
declare
  constraint_name text;
begin
  if to_regclass('public.prescriptions') is null then
    return;
  end if;

  select con.conname
    into constraint_name
  from pg_constraint as con
  join pg_class as rel
    on rel.oid = con.conrelid
  join pg_namespace as nsp
    on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'prescriptions'
    and con.contype = 'f'
    and pg_get_constraintdef(con.oid) ilike '%consultation_id%consultations%'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.prescriptions drop constraint %I',
      constraint_name
    );
  end if;

  alter table public.prescriptions
    add constraint prescriptions_consultation_id_fkey
    foreign key (consultation_id)
    references public.consultations (id)
    on delete cascade;
end;
$$;
