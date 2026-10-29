create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  consultation_id uuid not null references public.consultations (id) on delete restrict,
  prescription_date timestamptz not null default timezone('utc', now()),
  od_sphere numeric(6, 2),
  od_cylinder numeric(6, 2),
  od_axis integer check (od_axis is null or (od_axis >= 0 and od_axis <= 180)),
  oi_sphere numeric(6, 2),
  oi_cylinder numeric(6, 2),
  oi_axis integer check (oi_axis is null or (oi_axis >= 0 and oi_axis <= 180)),
  dp numeric(6, 2) check (dp is null or dp >= 0),
  add_value numeric(6, 2) check (add_value is null or add_value >= 0),
  observations text,
  indications text,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists prescriptions_patient_id_idx
  on public.prescriptions (patient_id);

create index if not exists prescriptions_consultation_id_idx
  on public.prescriptions (consultation_id);

create index if not exists prescriptions_created_by_idx
  on public.prescriptions (created_by);

create index if not exists prescriptions_prescription_date_idx
  on public.prescriptions (prescription_date desc);

drop trigger if exists prescriptions_set_updated_at on public.prescriptions;

create trigger prescriptions_set_updated_at
  before update on public.prescriptions
  for each row execute procedure public.set_updated_at();

create or replace function public.prescriptions_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.patient_id := old.patient_id;
    new.consultation_id := old.consultation_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.prescription_date := old.prescription_date;
  end if;

  if not exists (
    select 1
    from public.consultations as consultation
    where consultation.id = new.consultation_id
      and consultation.patient_id = new.patient_id
  ) then
    raise exception 'La receta debe estar relacionada con una consulta del paciente';
  end if;

  return new;
end;
$$;

drop trigger if exists prescriptions_before_write on public.prescriptions;

create trigger prescriptions_before_write
  before insert or update on public.prescriptions
  for each row execute procedure public.prescriptions_before_write();

alter table public.prescriptions enable row level security;

drop policy if exists "prescriptions_select" on public.prescriptions;
drop policy if exists "prescriptions_insert" on public.prescriptions;
drop policy if exists "prescriptions_update" on public.prescriptions;
drop policy if exists "prescriptions_delete" on public.prescriptions;

create policy "prescriptions_select"
  on public.prescriptions
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist', 'reception'));

create policy "prescriptions_insert"
  on public.prescriptions
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'ophthalmologist'));

create policy "prescriptions_update"
  on public.prescriptions
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist'))
  with check (public.current_user_role() in ('admin', 'ophthalmologist'));

create policy "prescriptions_delete"
  on public.prescriptions
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

grant select, insert, update, delete on table public.prescriptions to authenticated;

drop policy if exists "profiles_select_directory" on public.profiles;

create policy "profiles_select_directory"
  on public.profiles
  for select
  to authenticated
  using (true);
