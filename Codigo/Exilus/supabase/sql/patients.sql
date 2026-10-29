create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_user_role() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  registered_at timestamptz not null default timezone('utc', now()),
  document_type text not null check (document_type in ('RUT', 'Passport', 'Extranjero')),
  document_number text,
  first_name text not null,
  middle_name text,
  last_name text,
  second_last_name text,
  age integer check (age is null or (age >= 0 and age <= 130)),
  benefit text check (
    benefit is null or benefit in ('Fonasa', 'Fonasa A', 'Bloqueado', 'Extranjero')
  ),
  captador_first_name text,
  captador_last_name text,
  optical_name text,
  amount numeric(12, 2) not null default 7000,
  entry_time timestamptz,
  exit_time timestamptz,
  duration_minutes integer generated always as (
    case
      when entry_time is not null and exit_time is not null
        then greatest(
          0,
          round(extract(epoch from (exit_time - entry_time)) / 60.0)::integer
        )
      else null
    end
  ) stored,
  payment_method text check (
    payment_method is null
    or payment_method in ('Transferencia', 'Efectivo', 'Débito', 'P/P', 'Pagado')
  ),
  payment_status text check (
    payment_status is null or payment_status in ('Pagado', 'P/P')
  ),
  general_observation text,
  condition text,
  email text,
  color_tag text,
  is_warranty boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patients_exit_after_entry
    check (exit_time is null or entry_time is not null)
);

create index if not exists patients_registered_at_idx
  on public.patients (registered_at desc);

create index if not exists patients_optical_name_idx
  on public.patients (optical_name);

create index if not exists patients_payment_status_idx
  on public.patients (payment_status);

drop trigger if exists patients_set_updated_at on public.patients;

create trigger patients_set_updated_at
  before update on public.patients
  for each row execute procedure public.set_updated_at();

alter table public.patients enable row level security;

drop policy if exists "patients_select" on public.patients;
drop policy if exists "patients_insert" on public.patients;
drop policy if exists "patients_update" on public.patients;
drop policy if exists "patients_delete" on public.patients;

create policy "patients_select"
  on public.patients
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist', 'reception'));

create policy "patients_insert"
  on public.patients
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "patients_update"
  on public.patients
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "patients_delete"
  on public.patients
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

grant select, insert, update, delete on table public.patients to authenticated;

alter table public.patients
  alter column document_number drop not null,
  alter column last_name drop not null,
  alter column benefit drop not null,
  alter column captador_first_name drop not null,
  alter column payment_method drop not null,
  alter column payment_status drop not null;
