import { requireSupabase } from '@/lib/supabase/client'
import type { LoginAttemptRow } from '@/lib/supabase/database'
import { getDateFilterRange } from '@/lib/dates'
import {
  LOGIN_ATTEMPT_REASONS,
  type LoginAttempt,
  type LoginAttemptFilters,
  type LoginAttemptReason,
  type LoginThrottle,
} from '@/types/login-attempt'

function isLoginAttemptReason(value: string): value is LoginAttemptReason {
  return LOGIN_ATTEMPT_REASONS.includes(value as LoginAttemptReason)
}

function mapLoginAttempt(row: LoginAttemptRow): LoginAttempt {
  if (!isLoginAttemptReason(row.reason)) {
    throw new Error('El intento de acceso tiene un motivo no válido.')
  }

  return {
    id: row.id,
    emailAttempted: row.email_attempted,
    attemptedAt: row.attempted_at,
    success: row.success,
    reason: row.reason,
    userId: row.user_id,
    userAgent: row.user_agent,
    isReviewed: row.is_reviewed,
  }
}

export async function recordLoginAttempt(input: {
  email: string
  success: boolean
  reason: LoginAttemptReason
  userId?: string | null
}): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.rpc('record_login_attempt', {
    attempted_email: input.email,
    was_success: input.success,
    fail_reason: input.reason,
    attempted_user_id: input.userId ?? null,
    client_user_agent:
      typeof navigator === 'undefined' ? null : navigator.userAgent,
  })

  if (error) {
    return
  }
}

export async function getLoginThrottle(email: string): Promise<LoginThrottle> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_login_throttle', {
    attempted_email: email,
  })

  if (error || !data?.[0]) {
    return {
      failedCount: 0,
      isBlocked: false,
      retryAfter: null,
    }
  }

  const row = data[0]
  return {
    failedCount: row.failed_count,
    isBlocked: row.is_blocked,
    retryAfter: row.retry_after,
  }
}

export async function listLoginAttempts(
  filters: LoginAttemptFilters,
): Promise<LoginAttempt[]> {
  const client = requireSupabase()
  let query = client
    .from('login_attempts')
    .select(
      'id, email_attempted, attempted_at, success, reason, user_id, user_agent, is_reviewed',
    )
    .order('attempted_at', { ascending: false })

  if (filters.result === 'failed') {
    query = query.eq('success', false)
  }

  if (filters.result === 'success') {
    query = query.eq('success', true)
  }

  if (filters.result === 'blocked') {
    query = query.eq('reason', 'blocked')
  }

  if (filters.period !== 'all') {
    const period =
      filters.period === 'today'
        ? 'today'
        : filters.period === 'week'
          ? 'this_week'
          : 'this_month'
    const range = getDateFilterRange(period)
    if (range) {
      query = query
        .gte('attempted_at', range.from.toISOString())
        .lte('attempted_at', range.to.toISOString())
    }
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar los intentos de acceso.')
  }

  return (data ?? []).map(mapLoginAttempt)
}

export async function getUnreviewedFailedLoginCount(): Promise<number> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('unreviewed_failed_login_count')

  if (error || typeof data !== 'number') {
    return 0
  }

  return data
}

export async function markLoginAttemptsReviewed(
  ids?: string[],
): Promise<number> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('mark_login_attempts_reviewed', {
    target_ids: ids && ids.length > 0 ? ids : null,
  })

  if (error) {
    throw new Error('No fue posible marcar los intentos como revisados.')
  }

  return data ?? 0
}
