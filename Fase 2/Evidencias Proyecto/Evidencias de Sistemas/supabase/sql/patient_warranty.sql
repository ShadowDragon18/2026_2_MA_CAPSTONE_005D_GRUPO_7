create or replace function public.set_patient_warranty(target_id uuid, new_warranty boolean)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.patients;
begin
  if public.current_user_role() not in ('admin', 'ophthalmologist', 'reception') then
    raise exception 'No autorizado para cambiar la garantía';
  end if;

  update public.patients
  set is_warranty = new_warranty
  where id = target_id
  returning * into result;

  if not found then
    raise exception 'Paciente no encontrado';
  end if;

  return result;
end;
$$;

grant execute on function public.set_patient_warranty(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
