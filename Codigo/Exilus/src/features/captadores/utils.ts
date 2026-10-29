import type { CaptadorEntryRow, CaptadorRow } from '@/lib/supabase/database'
import {
  CAPTADOR_PAYMENT_STATUSES,
  type Captador,
  type CaptadorDayGroup,
  type CaptadorEntry,
  type CaptadorPersonGroup,
  type CaptadorPaymentStatus,
} from '@/types/captador'

function isCaptadorPaymentStatus(
  value: string,
): value is CaptadorPaymentStatus {
  return CAPTADOR_PAYMENT_STATUSES.includes(value as CaptadorPaymentStatus)
}

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function getCaptadorFullName(
  captador: Pick<Captador, 'firstName' | 'lastName'>,
): string {
  return [captador.firstName, captador.lastName].filter(Boolean).join(' ')
}

export function getCaptadorEntryName(entry: CaptadorEntry): string {
  return getCaptadorFullName({
    firstName: entry.captadorFirstName,
    lastName: entry.captadorLastName,
  })
}

export function mapCaptador(row: CaptadorRow, opticalName: string): Captador {
  if (!isCaptadorPaymentStatus(row.payment_status)) {
    throw new Error('El captador tiene un estado de pago no válido.')
  }

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    opticalId: row.optical_id,
    opticalName,
    amount: Number(row.amount),
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

export function opticalNameFromEmbed(value: unknown): string {
  if (Array.isArray(value)) {
    return opticalNameFromEmbed(value[0])
  }

  if (
    value &&
    typeof value === 'object' &&
    'name' in value &&
    typeof value.name === 'string'
  ) {
    return value.name
  }

  return '—'
}

export function matchesCaptadorSearch(
  captador: Captador,
  search: string,
): boolean {
  const term = search.trim().toLowerCase()
  if (!term) {
    return true
  }

  return [
    captador.firstName,
    captador.lastName ?? '',
    captador.opticalName,
    captador.paymentStatus,
  ]
    .join(' ')
    .toLowerCase()
    .includes(term)
}

function textFromEmbed(
  value: unknown,
  key: string,
): string | null {
  if (Array.isArray(value)) {
    return textFromEmbed(value[0], key)
  }

  if (
    value &&
    typeof value === 'object' &&
    key in value &&
    typeof (value as Record<string, unknown>)[key] === 'string'
  ) {
    return (value as Record<string, string>)[key]
  }

  return null
}

export function mapCaptadorEntry(
  row: CaptadorEntryRow & {
    captadores?: unknown
    optics?: unknown
    patients?: unknown
  },
): CaptadorEntry {
  if (!isCaptadorPaymentStatus(row.payment_status)) {
    throw new Error('La captación tiene un estado de pago no válido.')
  }

  const captadorFirstName =
    textFromEmbed(row.captadores, 'first_name') ?? 'Captador'
  const captadorLastName = textFromEmbed(row.captadores, 'last_name')
  const patientFirst = textFromEmbed(row.patients, 'first_name')
  const patientName = patientFirst
    ? [
        patientFirst,
        textFromEmbed(row.patients, 'middle_name'),
        textFromEmbed(row.patients, 'last_name'),
        textFromEmbed(row.patients, 'second_last_name'),
      ]
        .filter(Boolean)
        .join(' ')
    : null

  return {
    id: row.id,
    captadorId: row.captador_id,
    captadorFirstName,
    captadorLastName,
    opticalId: row.optical_id,
    opticalName: opticalNameFromEmbed(row.optics),
    patientId: row.patient_id,
    patientName,
    amount: Number(row.amount),
    paymentStatus: row.payment_status,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function matchesCaptadorEntrySearch(
  entry: CaptadorEntry,
  search: string,
): boolean {
  const term = search.trim().toLowerCase()
  if (!term) {
    return true
  }

  return [
    entry.captadorFirstName,
    entry.captadorLastName ?? '',
    entry.opticalName,
    entry.patientName ?? '',
    entry.paymentStatus,
  ]
    .join(' ')
    .toLowerCase()
    .includes(term)
}

export function formatDayGroupLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-')
  if (!year || !month || !day) {
    return dateKey
  }

  return `${day}-${month}-${year}`
}

export function occurredDateKey(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function groupDayEntriesByCaptador(
  entries: CaptadorEntry[],
): CaptadorPersonGroup[] {
  const groups = new Map<string, CaptadorEntry[]>()

  for (const entry of entries) {
    const current = groups.get(entry.captadorId) ?? []
    current.push(entry)
    groups.set(entry.captadorId, current)
  }

  return [...groups.entries()]
    .map(([captadorId, groupEntries]) => {
      const first = groupEntries[0]

      return {
        captadorId,
        name: first ? getCaptadorEntryName(first) : 'Captador',
        opticalName: first?.opticalName ?? '—',
        entries: groupEntries,
        totalAmount: groupEntries.reduce((sum, item) => sum + item.amount, 0),
        unpaidAmount: groupEntries.reduce(
          (sum, item) =>
            item.paymentStatus === 'Por pagar' ? sum + item.amount : sum,
          0,
        ),
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export function groupCaptadorEntriesByDay(
  entries: CaptadorEntry[],
): CaptadorDayGroup[] {
  const groups = new Map<string, CaptadorEntry[]>()

  for (const entry of entries) {
    const key = occurredDateKey(entry.occurredAt)
    const current = groups.get(key) ?? []
    current.push(entry)
    groups.set(key, current)
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([dateKey, groupEntries]) => ({
      dateKey,
      label: formatDayGroupLabel(dateKey),
      entries: groupEntries,
      captadores: groupDayEntriesByCaptador(groupEntries),
      totalAmount: groupEntries.reduce((sum, item) => sum + item.amount, 0),
      unpaidAmount: groupEntries.reduce(
        (sum, item) =>
          item.paymentStatus === 'Por pagar' ? sum + item.amount : sum,
        0,
      ),
    }))
}

export function getWriteErrorMessage(
  error: { code?: string; message: string },
  fallback: string,
): string {
  if (error.code === '23503') {
    return fallback.toLowerCase().includes('eliminar')
      ? 'No se puede eliminar porque hay captaciones asociadas.'
      : 'La óptica o el captador seleccionado ya no existe.'
  }

  if (error.code === '23505') {
    return 'Este paciente ya tiene una captación registrada.'
  }

  return error.message || fallback
}
