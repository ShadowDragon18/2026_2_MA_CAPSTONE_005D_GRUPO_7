create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  user_name text not null default '',
  user_role text not null default '',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  description text not null default '',
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  ip_address text,
  user_agent text,
  constraint audit_logs_action_check check (
    action in (
      'create',
      'update',
      'delete',
      'login',
      'logout',
      'block',
      'unblock',
      'print',
      'pdf',
      'email'
    )
  ),
  constraint audit_logs_entity_type_check check (
    entity_type in (
      'patients',
      'consultations',
      'prescriptions',
      'users',
      'settings',
      'security'
    )
  )
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_user_id_idx
  on public.audit_logs (user_id);

create index if not exists audit_logs_entity_type_idx
  on public.audit_logs (entity_type);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action);

create or replace function public.audit_sanitize_json(payload jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb;
  entry record;
begin
  if payload is null then
    return null;
  end if;

  if jsonb_typeof(payload) = 'array' then
    select coalesce(jsonb_agg(public.audit_sanitize_json(item)), '[]'::jsonb)
      into result
    from jsonb_array_elements(payload) as item;
    return result;
  end if;

  if jsonb_typeof(payload) <> 'object' then
    return payload;
  end if;

  result := '{}'::jsonb;
  for entry in select key, value from jsonb_each(payload)
  loop
    if entry.key ~* '(password|token|secret|authorization|api[_-]?key|access_token|refresh_token)' then
      continue;
    end if;

    if jsonb_typeof(entry.value) in ('object', 'array') then
      result := result || jsonb_build_object(entry.key, public.audit_sanitize_json(entry.value));
    else
      result := result || jsonb_build_object(entry.key, entry.value);
    end if;
  end loop;

  return result;
end;
$$;

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_description text,
  p_entity_id uuid default null,
  p_entity_label text default null,
  p_old_data jsonb default null,
  p_new_data jsonb default null,
  p_actor_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  headers_raw text;
  headers jsonb := '{}'::jsonb;
  actor_id uuid;
  actor_name text;
  actor_role text;
  forwarded text;
  log_id uuid;
begin
  if p_action not in (
    'create', 'update', 'delete', 'login', 'logout', 'block', 'unblock', 'print', 'pdf', 'email'
  ) then
    raise exception 'Acción de auditoría no válida';
  end if;

  if p_entity_type not in (
    'patients', 'consultations', 'prescriptions', 'users', 'settings', 'security'
  ) then
    raise exception 'Módulo de auditoría no válido';
  end if;

  headers_raw := current_setting('request.headers', true);
  begin
    if headers_raw is not null and headers_raw <> '' then
      headers := headers_raw::jsonb;
    end if;
  exception when others then
    headers := '{}'::jsonb;
  end;

  actor_id := auth.uid();

  if actor_id is not null then
    select profiles.full_name, profiles.role
      into actor_name, actor_role
    from public.profiles as profiles
    where profiles.id = actor_id;

    actor_name := coalesce(nullif(trim(actor_name), ''), nullif(trim(p_actor_name), ''), 'Usuario');
    actor_role := coalesce(actor_role, '');
  else
    if p_entity_type is distinct from 'security' then
      raise exception 'No autorizado para registrar auditoría';
    end if;

    actor_name := coalesce(nullif(trim(p_actor_name), ''), 'Invitado');
    actor_role := 'invitado';
  end if;

  forwarded := split_part(
    coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', ''),
    ',',
    1
  );

  insert into public.audit_logs (
    user_id,
    user_name,
    user_role,
    action,
    entity_type,
    entity_id,
    entity_label,
    description,
    old_data,
    new_data,
    ip_address,
    user_agent
  )
  values (
    actor_id,
    actor_name,
    actor_role,
    p_action,
    p_entity_type,
    p_entity_id,
    nullif(trim(p_entity_label), ''),
    coalesce(nullif(trim(p_description), ''), 'Acción registrada'),
    public.audit_sanitize_json(p_old_data),
    public.audit_sanitize_json(p_new_data),
    nullif(trim(forwarded), ''),
    nullif(trim(coalesce(headers ->> 'user-agent', '')), '')
  )
  returning id into log_id;

  return log_id;
end;
$$;

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select" on public.audit_logs;
drop policy if exists "audit_logs_insert" on public.audit_logs;
drop policy if exists "audit_logs_update" on public.audit_logs;
drop policy if exists "audit_logs_delete" on public.audit_logs;

create policy "audit_logs_select"
  on public.audit_logs
  for select
  to authenticated
  using (public.current_user_role() = 'admin');

revoke insert, update, delete on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

grant execute on function public.audit_sanitize_json(jsonb) to anon, authenticated;
grant execute on function public.log_audit_event(text, text, text, uuid, text, jsonb, jsonb, text)
  to anon, authenticated;
