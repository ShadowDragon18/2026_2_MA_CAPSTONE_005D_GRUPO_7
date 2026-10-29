create table if not exists public.optics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_tag text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint optics_name_not_empty check (length(btrim(name)) > 0),
  constraint optics_color_tag_format check (
    color_tag is null
    or color_tag ~* '^#[0-9A-Fa-f]{6}$'
  )
);

create unique index if not exists optics_name_lower_uidx
  on public.optics (lower(btrim(name)));

create table if not exists public.captadores (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  optical_id uuid not null references public.optics (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint captadores_first_name_not_empty check (length(btrim(first_name)) > 0)
);

create index if not exists captadores_optical_id_idx
  on public.captadores (optical_id);

create index if not exists captadores_name_idx
  on public.captadores (first_name, last_name);

drop trigger if exists optics_set_updated_at on public.optics;
create trigger optics_set_updated_at
  before update on public.optics
  for each row execute procedure public.set_updated_at();

drop trigger if exists captadores_set_updated_at on public.captadores;
create trigger captadores_set_updated_at
  before update on public.captadores
  for each row execute procedure public.set_updated_at();

alter table public.optics enable row level security;
alter table public.captadores enable row level security;

drop policy if exists "optics_select" on public.optics;
drop policy if exists "optics_insert" on public.optics;
drop policy if exists "optics_update" on public.optics;
drop policy if exists "optics_delete" on public.optics;
drop policy if exists "captadores_select" on public.captadores;
drop policy if exists "captadores_insert" on public.captadores;
drop policy if exists "captadores_update" on public.captadores;
drop policy if exists "captadores_delete" on public.captadores;

create policy "optics_select"
  on public.optics
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist', 'reception'));

create policy "optics_insert"
  on public.optics
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "optics_update"
  on public.optics
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "optics_delete"
  on public.optics
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "captadores_select"
  on public.captadores
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ophthalmologist', 'reception'));

create policy "captadores_insert"
  on public.captadores
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "captadores_update"
  on public.captadores
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

create policy "captadores_delete"
  on public.captadores
  for delete
  to authenticated
  using (public.current_user_role() = 'admin');

grant select, insert, update, delete on table public.optics to authenticated;
grant select, insert, update, delete on table public.captadores to authenticated;

create or replace function public.set_optical_color(target_id uuid, new_color text)
returns public.optics
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.optics;
begin
  if public.current_user_role() not in ('admin', 'ophthalmologist', 'reception') then
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
