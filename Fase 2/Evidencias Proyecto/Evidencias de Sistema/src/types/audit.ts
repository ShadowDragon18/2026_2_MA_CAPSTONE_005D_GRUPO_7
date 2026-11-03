import type { Json } from '@/lib/supabase/database'
import type { PatientDateFilter } from '@/types/patient'

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'block',
  'unblock',
  'print',
  'pdf',
  'email',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const AUDIT_ENTITY_TYPES = [
  'patients',
  'consultations',
  'prescriptions',
  'users',
  'settings',
  'security',
] as const

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export const AUDIT_ACTION_FILTERS = [
  'all',
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'block',
  'unblock',
  'other',
] as const

export type AuditActionFilter = (typeof AUDIT_ACTION_FILTERS)[number]

export type AuditDateFilter = PatientDateFilter | 'custom'

export interface AuditLog {
  id: string
  userId: string | null
  userName: string
  userRole: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string | null
  entityLabel: string | null
  description: string
  oldData: Json | null
  newData: Json | null
  createdAt: string
  ipAddress: string | null
  userAgent: string | null
}

export interface AuditUserOption {
  id: string
  label: string
}

export interface AuditFilters {
  search: string
  date: AuditDateFilter
  fromDate: string
  toDate: string
  userId: string
  entityType: AuditEntityType | 'all'
  action: AuditActionFilter
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  search: '',
  date: 'all',
  fromDate: '',
  toDate: '',
  userId: '',
  entityType: 'all',
  action: 'all',
}

export interface LogAuditEventInput {
  action: AuditAction
  entityType: AuditEntityType
  description: string
  entityId?: string | null
  entityLabel?: string | null
  oldData?: Json | null
  newData?: Json | null
  actorName?: string | null
}
