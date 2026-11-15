import type { Json } from '@/lib/supabase/database'
import type { AuditLogRow } from '@/lib/supabase/database'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { ROLE_LABELS, isUserRole } from '@/types/roles'
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
  type AuditLog,
} from '@/types/audit'

const SENSITIVE_KEY =
  /(password|token|secret|authorization|api[_-]?key|access_token|refresh_token)/i

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
  login: 'Login',
  logout: 'Logout',
  block: 'Bloquear',
  unblock: 'Desbloquear',
  print: 'Imprimir',
  pdf: 'PDF',
  email: 'Correo',
}

export const AUDIT_MODULE_LABELS: Record<AuditEntityType, string> = {
  patients: 'Pacientes',
  consultations: 'Consulta',
  prescriptions: 'Recetas',
  users: 'Usuarios',
  settings: 'Configuración',
  security: 'Seguridad',
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  fullName: 'Nombre',
  document: 'Documento',
  age: 'Edad',
  email: 'Correo',
  amount: 'Monto',
  paymentStatus: 'Estado de pago',
  paymentMethod: 'Método de pago',
  condition: 'Condición',
  color: 'Color',
  warranty: 'Garantía',
  entryTime: 'Hora de entrada',
  exitTime: 'Hora de salida',
  clinicName: 'Nombre de la clínica',
  defaultAmount: 'Monto predeterminado',
  defaultCaptadorAmount: 'Precio predeterminado del captador',
  quickColors: 'Colores rápidos',
  role: 'Rol',
  isActive: 'Acceso',
  odSphere: 'OD esfera',
  odCylinder: 'OD cilindro',
  odAxis: 'OD eje',
  oiSphere: 'OI esfera',
  oiCylinder: 'OI cilindro',
  oiAxis: 'OI eje',
  dp: 'DP',
  addValue: 'ADD',
  glucoseMgDl: 'MG/DL',
  medicalObservations: 'Observaciones médicas',
  observations: 'Observaciones',
  indications: 'Indicaciones',
}

export function isAuditAction(value: string): value is AuditAction {
  return AUDIT_ACTIONS.includes(value as AuditAction)
}

export function isAuditEntityType(value: string): value is AuditEntityType {
  return AUDIT_ENTITY_TYPES.includes(value as AuditEntityType)
}

export function getAuditRoleLabel(role: string): string {
  if (isUserRole(role)) {
    return ROLE_LABELS[role]
  }
  if (role === 'invitado') {
    return 'Invitado'
  }
  return role || '—'
}

export function sanitizeAuditJson(value: Json | null | undefined): Json | null {
  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditJson(item ?? null) ?? null)
  }

  if (typeof value !== 'object') {
    return value
  }

  const result: { [key: string]: Json | undefined } = {}
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      continue
    }
    result[key] = sanitizeAuditJson(nested ?? null)
  }
  return result
}

export function diffAuditData(
  before: Record<string, Json | undefined>,
  after: Record<string, Json | undefined>,
): { oldData: Json | null; newData: Json | null } {
  const oldData: { [key: string]: Json | undefined } = {}
  const newData: { [key: string]: Json | undefined } = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of keys) {
    const previous = before[key] ?? null
    const next = after[key] ?? null
    if (JSON.stringify(previous) === JSON.stringify(next)) {
      continue
    }
    oldData[key] = previous
    newData[key] = next
  }

  return {
    oldData: Object.keys(oldData).length > 0 ? oldData : null,
    newData: Object.keys(newData).length > 0 ? newData : null,
  }
}

export function mapAuditLog(row: AuditLogRow): AuditLog {
  if (!isAuditAction(row.action) || !isAuditEntityType(row.entity_type)) {
    throw new Error('El registro de auditoría no es válido.')
  }

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    description: row.description,
    oldData: row.old_data,
    newData: row.new_data,
    createdAt: row.created_at,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  }
}

export interface AuditFieldChange {
  key: string
  label: string
  before: string
  after: string
}

export function getAuditFieldChanges(
  oldData: Json | null,
  newData: Json | null,
): AuditFieldChange[] {
  const before = asRecord(oldData)
  const after = asRecord(newData)
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])

  return [...keys].map((key) => ({
    key,
    label: FIELD_LABELS[key] ?? key,
    before: formatAuditFieldValue(key, before[key] ?? null),
    after: formatAuditFieldValue(key, after[key] ?? null),
  }))
}

function asRecord(value: Json | null): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value
}

function formatAuditFieldValue(key: string, value: Json | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (
    key === 'amount' ||
    key === 'defaultAmount' ||
    key === 'defaultCaptadorAmount'
  ) {
    const amount = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(amount) ? formatCurrency(amount) : '—'
  }

  if (key === 'entryTime' || key === 'exitTime') {
    return typeof value === 'string' ? formatDateTime(value) : '—'
  }

  if (key === 'warranty' || key === 'isActive') {
    return value === true ? 'Sí' : 'No'
  }

  if (key === 'role' && typeof value === 'string') {
    return getAuditRoleLabel(value)
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .join(', ')
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([nestedKey, nestedValue]) => {
        const label = FIELD_LABELS[nestedKey] ?? nestedKey
        return `${label}: ${formatAuditFieldValue(nestedKey, nestedValue)}`
      })
      .join(' · ')
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  return String(value)
}

export function resolveAuditSearchExtras(search: string): string[] {
  const lower = search.trim().toLowerCase()
  if (lower.length < 3) {
    return []
  }

  const extras: string[] = []

  for (const [id, label] of Object.entries(AUDIT_MODULE_LABELS)) {
    if (label.toLowerCase().startsWith(lower) || id === lower) {
      extras.push(`entity_type.eq.${id}`)
    }
  }

  for (const [id, label] of Object.entries(AUDIT_ACTION_LABELS)) {
    if (label.toLowerCase().startsWith(lower) || id === lower) {
      extras.push(`action.eq.${id}`)
    }
  }

  return extras
}
