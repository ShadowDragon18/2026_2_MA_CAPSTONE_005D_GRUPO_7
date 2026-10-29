alter table public.patients
  add column if not exists email text;

alter table public.patients
  add column if not exists color_tag text;

alter table public.patients
  drop constraint if exists patients_email_format;

alter table public.patients
  add constraint patients_email_format
  check (
    email is null
    or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

alter table public.patients
  drop constraint if exists patients_color_tag_format;

alter table public.patients
  add constraint patients_color_tag_format
  check (
    color_tag is null
    or color_tag ~* '^#[0-9A-Fa-f]{6}$'
  );

create or replace function public.set_patient_color(target_id uuid, new_color text)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.patients;
begin
  if public.current_user_role() not in ('admin', 'ophthalmologist', 'reception') then
    raise exception 'No autorizado para cambiar el color';
  end if;

  if new_color is not null and new_color !~* '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Color no válido';
  end if;

  update public.patients
  set color_tag = new_color
  where id = target_id
  returning * into result;

  if not found then
    raise exception 'Paciente no encontrado';
  end if;

  return result;
end;
$$;

grant execute on function public.set_patient_color(uuid, text) to authenticated;

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
  set exit_time = timezone('utc', now())
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

grant execute on function public.finish_patient_visit(uuid) to authenticated;

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients (id) on delete cascade,
  oi_sphere numeric(6, 2),
  oi_cylinder numeric(6, 2),
  oi_axis integer check (oi_axis is null or (oi_axis >= 0 and oi_axis <= 180)),
  od_sphere numeric(6, 2),
  od_cylinder numeric(6, 2),
  od_axis integer check (od_axis is null or (od_axis >= 0 and od_axis <= 180)),
  dp numeric(6, 2) check (dp is null or dp >= 0),
  add_value numeric(6, 2) check (add_value is null or add_value >= 0),
  glucose_mg_dl integer check (glucose_mg_dl is null or glucose_mg_dl >= 0),
  medical_observations text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists consultations_patient_id_idx
  on public.consultations (patient_id);

drop trigger if exists consultations_set_updated_at on public.consultations;

create trigger consultations_set_updated_at
  before update on public.consultations
  for each row execute procedure public.set_updated_at();

alter table public.consultations enable row level security;

drop policy if exists "consultations_select" on public.consultations;
drop policy if exists "consultations_insert" on public.consultations;
drop policy if exists "consultations_update" on public.consultations;
drop policy if exists "consultations_delete" on public.consultations;

create policy "consultations_select"
  on public.consultations
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist', 'reception'));

create policy "consultations_insert"
  on public.consultations
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'ophthalmologist'));

create policy "consultations_update"
  on public.consultations
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist'))
  with check (public.current_user_role() in ('admin', 'ophthalmologist'));

create policy "consultations_delete"
  on public.consultations
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

grant select, insert, update, delete on table public.consultations to authenticated;
