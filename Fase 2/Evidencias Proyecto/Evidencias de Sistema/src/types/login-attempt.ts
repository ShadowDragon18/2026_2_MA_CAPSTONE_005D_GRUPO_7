export const LOGIN_ATTEMPT_REASONS = [
  'success',
  'invalid_credentials',
  'blocked',
  'rate_limited',
] as const

export type LoginAttemptReason = (typeof LOGIN_ATTEMPT_REASONS)[number]

export interface LoginAttempt {
  id: string
  emailAttempted: string
  attemptedAt: string
  success: boolean
  reason: LoginAttemptReason
  userId: string | null
  userAgent: string | null
  isReviewed: boolean
}

export type LoginAttemptResultFilter =
  | 'all'
  | 'failed'
  | 'success'
  | 'blocked'

export type LoginAttemptPeriodFilter = 'all' | 'today' | 'week' | 'month'

export interface LoginAttemptFilters {
  result: LoginAttemptResultFilter
  period: LoginAttemptPeriodFilter
}

export const EMPTY_LOGIN_ATTEMPT_FILTERS: LoginAttemptFilters = {
  result: 'all',
  period: 'all',
}

export interface LoginThrottle {
  failedCount: number
  isBlocked: boolean
  retryAfter: string | null
}
