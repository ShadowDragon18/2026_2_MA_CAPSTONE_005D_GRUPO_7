import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database'

export const REALTIME_TABLES = [
  'patients',
  'consultations',
  'prescriptions',
  'audit_logs',
  'profiles',
  'clinic_settings',
  'login_attempts',
] as const

export type RealtimeTable = (typeof REALTIME_TABLES)[number]

export type RealtimeRow<Table extends RealtimeTable> =
  Database['public']['Tables'][Table]['Row']

export type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

export type RealtimeStatus = 'idle' | 'subscribing' | 'subscribed' | 'error'

export type RealtimePayload<Table extends RealtimeTable> =
  RealtimePostgresChangesPayload<RealtimeRow<Table>>
