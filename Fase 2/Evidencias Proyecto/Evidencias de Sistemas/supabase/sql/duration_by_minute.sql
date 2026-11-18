alter table public.patients drop column if exists duration_minutes;

alter table public.patients
  add column duration_minutes integer generated always as (
    case
      when entry_time is not null and exit_time is not null
        then greatest(
          0,
          (
            extract(epoch from (
              date_trunc('minute', exit_time) - date_trunc('minute', entry_time)
            )) / 60
          )::integer
        )
      else null
    end
  ) stored;

create or replace function public.finish_patient_visit(target_id uuid)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.patients;
begin
  if public.current_user_role() not in ('admin', 'ophthalmologist', 'reception') then
    raise exception 'No autorizado para finalizar la hora';
  end if;

  update public.patients
  set exit_time = date_trunc('minute', timezone('utc', now()))
  where id = target_id
    and entry_time is not null
    and exit_time is null
  returning * into result;

  if not found then
    raise exception 'No hay una hora iniciada para este paciente';
  end if;

  return result;
end;
$$;
