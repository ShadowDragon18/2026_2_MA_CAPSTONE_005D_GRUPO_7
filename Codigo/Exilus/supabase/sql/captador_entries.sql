create table if not exists public.captador_entries (
  id uuid primary key default gen_random_uuid(),
  captador_id uuid not null references public.captadores (id) on delete restrict,
  optical_id uuid not null references public.optics (id) on delete restrict,
  patient_id uuid references public.patients (id) on delete set null,
  amount numeric(12, 2) not null,
  payment_status text not null default 'Por pagar',
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint captador_entries_amount_non_negative check (amount >= 0),
  constraint captador_entries_payment_status_check
    check (payment_status in ('Pagado', 'Por pagar'))
);

create unique index if not exists captador_entries_patient_uidx
  on public.captador_entries (patient_id)
  where patient_id is not null;

create index if not exists captador_entries_occurred_at_idx
  on public.captador_entries (occurred_at desc);

create index if not exists captador_entries_captador_id_idx
  on public.captador_entries (captador_id);

create index if not exists captador_entries_optical_id_idx
  on public.captador_entries (optical_id);

drop trigger if exists captador_entries_set_updated_at on public.captador_entries;
create trigger captador_entries_set_updated_at
  before update on public.captador_entries
  for each row execute procedure public.set_updated_at();

alter table public.captador_entries enable row level security;

drop policy if exists "captador_entries_select" on public.captador_entries;
drop policy if exists "captador_entries_insert" on public.captador_entries;
drop policy if exists "captador_entries_update" on public.captador_entries;
drop policy if exists "captador_entries_delete" on public.captador_entries;

create policy "captador_entries_select"
  on public.captador_entries
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist', 'reception'));

create policy "captador_entries_insert"
  on public.captador_entries
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "captador_entries_update"
  on public.captador_entries
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "captador_entries_delete"
  on public.captador_entries
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

grant select, insert, update, delete on table public.captador_entries to authenticated;

insert into public.captador_entries (
  captador_id,
  optical_id,
  patient_id,
  amount,
  payment_status,
  occurred_at
)
select
  c.id,
  c.optical_id,
  p.id,
  c.amount,
  'Por pagar',
  p.registered_at
from public.patients p
inner join public.captadores c
  on lower(trim(c.first_name)) = lower(trim(p.captador_first_name))
 and coalesce(lower(trim(c.last_name)), '') = coalesce(lower(trim(p.captador_last_name)), '')
inner join public.optics o
  on o.id = c.optical_id
 and (
   p.optical_name is null
   or trim(p.optical_name) = ''
   or lower(trim(o.name)) = lower(trim(p.optical_name))
 )
where p.captador_first_name is not null
  and trim(p.captador_first_name) <> ''
  and not exists (
    select 1
    from public.captador_entries e
    where e.patient_id = p.id
  );
