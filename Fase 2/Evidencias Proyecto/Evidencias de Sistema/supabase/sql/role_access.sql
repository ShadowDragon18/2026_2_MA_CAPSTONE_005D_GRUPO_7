drop policy if exists "optics_select" on public.optics;
create policy "optics_select"
  on public.optics
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'));

drop policy if exists "captadores_select" on public.captadores;
create policy "captadores_select"
  on public.captadores
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'));

drop policy if exists "captador_entries_select" on public.captador_entries;
create policy "captador_entries_select"
  on public.captador_entries
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'));

drop policy if exists "patients_delete" on public.patients;
create policy "patients_delete"
  on public.patients
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

do $$
begin
  if to_regclass('public.prescriptions') is not null then
    execute 'drop policy if exists "prescriptions_delete" on public.prescriptions';
    execute $policy$
      create policy "prescriptions_delete"
        on public.prescriptions
        for delete
        to authenticated
        using (public.current_user_role() = 'admin')
    $policy$;
  end if;
end;
$$;

drop policy if exists "consultations_delete" on public.consultations;
create policy "consultations_delete"
  on public.consultations
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create or replace function public.prevent_patient_document_change()
returns trigger
language plpgsql
as $$
begin
  if old.document_type is distinct from new.document_type
     or old.document_number is distinct from new.document_number then
    raise exception 'El documento del paciente no se puede modificar';
  end if;

  return new;
end;
$$;

drop trigger if exists patients_lock_document on public.patients;

create trigger patients_lock_document
  before update on public.patients
  for each row
  execute procedure public.prevent_patient_document_change();

create or replace function public.set_optical_color(target_id uuid, new_color text)
returns public.optics
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.optics;
begin
  if public.current_user_role() not in ('admin', 'reception') then
    raise exception 'No autorizado para cambiar el color';
  end if;

  if new_color is not null and new_color !~* '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Color no válido';
  end if;

  update public.optics
  set color_tag = new_color
  where id = target_id
  returning * into result;

  if not found then
    raise exception 'Óptica no encontrada';
  end if;

  return result;
end;
$$;

grant execute on function public.set_optical_color(uuid, text) to authenticated;

notify pgrst, 'reload schema';
