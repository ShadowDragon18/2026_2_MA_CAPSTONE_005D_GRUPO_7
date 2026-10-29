import {
  mapAuditLog,
  resolveAuditSearchExtras,
  sanitizeAuditJson,
} from '@/features/audit/utils'
import { getCustomDateRange, getDateFilterRange } from '@/lib/dates'
import { requireSupabase } from '@/lib/supabase/client'
import type { AuditLogRow } from '@/lib/supabase/database'
import type {
  AuditAction,
  AuditFilters,
  AuditLog,
  AuditUserOption,
  LogAuditEventInput,
} from '@/types/audit'

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

const OTHER_ACTIONS: AuditAction[] = ['print', 'pdf', 'email']

export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  try {
    const client = requireSupabase()
    const { error } = await client.rpc('log_audit_event', {
      p_action: input.action,
      p_entity_type: input.entityType,
      p_description: input.description,
      p_entity_id: input.entityId ?? null,
      p_entity_label: input.entityLabel ?? null,
      p_old_data: sanitizeAuditJson(input.oldData ?? null),
      p_new_data: sanitizeAuditJson(input.newData ?? null),
      p_actor_name: input.actorName ?? null,
    })

    if (error) {
      console.error('No fue posible registrar la auditoría.', error)
    }
  } catch (error) {
    console.error('No fue posible registrar la auditoría.', error)
  }
}

export async function listAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
  const client = requireSupabase()
  let query = client
    .from('audit_logs')
    .select(
      'id, user_id, user_name, user_role, action, entity_type, entity_id, entity_label, description, old_data, new_data, created_at, ip_address, user_agent',
    )
    .order('created_at', { ascending: false })

  if (filters.date === 'custom') {
    const range = getCustomDateRange(filters.fromDate, filters.toDate)
    if (range) {
      query = query
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
    }
  } else {
    const range = getDateFilterRange(filters.date)
    if (range) {
      query = query
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
    }
  }

  if (filters.userId === 'none') {
    query = query.is('user_id', null)
  } else if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.entityType !== 'all') {
    query = query.eq('entity_type', filters.entityType)
  }

  if (filters.action === 'other') {
    query = query.in('action', OTHER_ACTIONS)
  } else if (filters.action !== 'all') {
    query = query.eq('action', filters.action)
  }

  const search = sanitizeSearch(filters.search)
  if (search) {
    const pattern = `%${search}%`
    const filtersOr = [
      `user_name.ilike.${pattern}`,
      `description.ilike.${pattern}`,
      `entity_label.ilike.${pattern}`,
      `action.ilike.${pattern}`,
      `entity_type.ilike.${pattern}`,
      ...resolveAuditSearchExtras(search),
    ]
    query = query.or(filtersOr.join(','))
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar la auditoría.')
  }

  return ((data ?? []) as AuditLogRow[]).map(mapAuditLog)
}

export async function listAuditUserOptions(): Promise<AuditUserOption[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error('No fue posible cargar los usuarios de auditoría.')
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.full_name,
  }))
}
