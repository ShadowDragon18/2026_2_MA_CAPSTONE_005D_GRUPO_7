-- Configuración, usuarios y seguridad de Exilus.
-- Ejecutar en el SQL Editor de Supabase después de profiles.sql y patients.sql.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

alter table public.profiles
  add column if not exists email text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.email is null;

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists profiles_is_active_idx
  on public.profiles (is_active);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := coalesce(new.raw_user_meta_data ->> 'role', 'reception');
  if assigned_role not in ('admin', 'ophthalmologist', 'reception') then
    assigned_role := 'reception';
  end if;

  insert into public.profiles (id, full_name, role, email, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Usuario Exilus'),
    assigned_role,
    new.email,
    true
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        email = excluded.email,
        is_active = true;

  return new;
end;
$$;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  new.id = old.id;

  if auth.uid() is not null then
    new.role = old.role;
    new.is_active = old.is_active;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute procedure public.protect_profile_columns();

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_name" on public.profiles;

create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.current_user_role() = 'admin');

create policy "profiles_update_name"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.current_user_role() = 'admin')
  with check (auth.uid() = id or public.current_user_role() = 'admin');

grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

create table if not exists public.clinic_settings (
  id integer primary key default 1,
  clinic_name text not null default 'Exilus',
  default_amount numeric(12, 2) not null default 7000,
  quick_colors jsonb not null default '[
    "#2563EB",
    "#14B8A6",
    "#22C55E",
    "#EAB308",
    "#EF4444",
    "#8B5CF6"
  ]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null,
  constraint clinic_settings_singleton check (id = 1),
  constraint clinic_settings_amount_non_negative check (default_amount >= 0)
);

insert into public.clinic_settings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists clinic_settings_set_updated_at on public.clinic_settings;

create trigger clinic_settings_set_updated_at
  before update on public.clinic_settings
  for each row execute procedure public.set_updated_at();

alter table public.clinic_settings enable row level security;

drop policy if exists "clinic_settings_select" on public.clinic_settings;
drop policy if exists "clinic_settings_update" on public.clinic_settings;

create policy "clinic_settings_select"
  on public.clinic_settings
  for select
  to authenticated
  using (true);

create policy "clinic_settings_update"
  on public.clinic_settings
  for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

grant select, update on table public.clinic_settings to authenticated;

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email_attempted text not null,
  attempted_at timestamptz not null default timezone('utc', now()),
  success boolean not null,
  reason text not null check (
    reason in ('success', 'invalid_credentials', 'blocked', 'rate_limited')
  ),
  user_id uuid references auth.users (id) on delete set null,
  user_agent text,
  is_reviewed boolean not null default false
);

create index if not exists login_attempts_attempted_at_idx
  on public.login_attempts (attempted_at desc);

create index if not exists login_attempts_email_attempted_idx
  on public.login_attempts (email_attempted, attempted_at desc);

create index if not exists login_attempts_unreviewed_idx
  on public.login_attempts (is_reviewed, attempted_at desc)
  where success = false and is_reviewed = false;

alter table public.login_attempts enable row level security;

drop policy if exists "login_attempts_select_admin" on public.login_attempts;
drop policy if exists "login_attempts_update_admin" on public.login_attempts;

create policy "login_attempts_select_admin"
  on public.login_attempts
  for select
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "login_attempts_update_admin"
  on public.login_attempts
  for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

grant select, update on table public.login_attempts to authenticated;

create or replace function public.protect_login_attempts()
returns trigger
language plpgsql
as $$
begin
  new.id = old.id;
  new.email_attempted = old.email_attempted;
  new.attempted_at = old.attempted_at;
  new.success = old.success;
  new.reason = old.reason;
  new.user_id = old.user_id;
  new.user_agent = old.user_agent;
  return new;
end;
$$;

drop trigger if exists login_attempts_protect on public.login_attempts;

create trigger login_attempts_protect
  before update on public.login_attempts
  for each row execute procedure public.protect_login_attempts();

create or replace function public.record_login_attempt(
  attempted_email text,
  was_success boolean,
  fail_reason text,
  attempted_user_id uuid default null,
  client_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_reason text;
begin
  if fail_reason not in ('success', 'invalid_credentials', 'blocked', 'rate_limited') then
    raise exception 'Motivo de intento no válido';
  end if;

  if was_success then
    safe_reason := 'success';
  else
    safe_reason := fail_reason;
  end if;

  insert into public.login_attempts (
    email_attempted,
    success,
    reason,
    user_id,
    user_agent
  )
  values (
    lower(trim(attempted_email)),
    was_success,
    safe_reason,
    attempted_user_id,
    nullif(trim(coalesce(client_user_agent, '')), '')
  );
end;
$$;

grant execute on function public.record_login_attempt(text, boolean, text, uuid, text)
  to anon, authenticated;

create or replace function public.get_login_throttle(attempted_email text)
returns table (
  failed_count integer,
  is_blocked boolean,
  retry_after timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(attempted_email));
  window_start timestamptz := timezone('utc', now()) - interval '10 minutes';
  failures integer := 0;
  oldest_failure timestamptz;
begin
  select
    count(*)::integer,
    min(attempted_at)
  into failures, oldest_failure
  from public.login_attempts
  where email_attempted = normalized_email
    and success = false
    and attempted_at >= window_start
    and attempted_at > coalesce(
      (
        select max(attempted_at)
        from public.login_attempts
        where email_attempted = normalized_email
          and success = true
      ),
      'epoch'::timestamptz
    );

  failed_count := failures;
  is_blocked := failures >= 5;
  retry_after := case
    when failures >= 5 and oldest_failure is not null
      then oldest_failure + interval '10 minutes'
    else null
  end;

  return next;
end;
$$;

grant execute on function public.get_login_throttle(text) to anon, authenticated;

create or replace function public.unreviewed_failed_login_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.current_user_role() = 'admin' then (
      select count(*)::integer
      from public.login_attempts
      where success = false
        and is_reviewed = false
    )
    else 0
  end
$$;

grant execute on function public.unreviewed_failed_login_count() to authenticated;

create or replace function public.mark_login_attempts_reviewed(target_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'No autorizado para revisar intentos de acceso';
  end if;

  update public.login_attempts
  set is_reviewed = true
  where success = false
    and is_reviewed = false
    and (target_ids is null or id = any (target_ids));

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.mark_login_attempts_reviewed(uuid[]) to authenticated;
