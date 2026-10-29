import {
  averageMinutes,
  buildActivitySeries,
  buildOpticalDistribution,
  buildPaymentDistribution,
  changePercent,
} from '@/features/dashboard/aggregate'
import { getDateFilterRange, getPreviousPeriodRange } from '@/lib/dates'
import { formatTime } from '@/lib/format'
import { requireSupabase } from '@/lib/supabase/client'
import type { AuditLogRow } from '@/lib/supabase/database'
import type {
  ActivityItem,
  ActivityKind,
  AgendaAppointment,
  AppointmentStatus,
  DashboardSnapshot,
} from '@/types/dashboard'
import { PAYMENT_STATUSES, type PaymentStatus } from '@/types/patient'
import type { PeriodKey } from '@/types/period'

const PATIENT_SELECT = `
  id,
  registered_at,
  created_at,
  first_name,
  middle_name,
  last_name,
  second_last_name,
  benefit,
  payment_status,
  optical_name,
  duration_minutes,
  entry_time,
  exit_time
`

interface DashboardPatientRow {
  id: string
  registered_at: string
  created_at: string
  first_name: string
  middle_name: string | null
  last_name: string | null
  second_last_name: string | null
  benefit: string | null
  payment_status: string | null
  optical_name: string | null
  duration_minutes: number | null
  entry_time: string | null
  exit_time: string | null
}

interface TimestampRow {
  created_at: string
}

const PAGE_SIZE = 1000
const MAX_ROWS = 10000

async function fetchPaged<T>(
  loadPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []

  for (let start = 0; start < MAX_ROWS; start += PAGE_SIZE) {
    const { data, error } = await loadPage(start, start + PAGE_SIZE - 1)
    if (error) {
      throw new Error('No fue posible cargar el dashboard.')
    }
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) {
      break
    }
  }

  return rows
}

async function countByColumn(
  table: 'patients' | 'consultations' | 'prescriptions',
  column: 'registered_at' | 'created_at',
  from: string,
  to: string,
): Promise<number> {
  const client = requireSupabase()
  const { count, error } = await client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte(column, from)
    .lte(column, to)

  if (error || count === null) {
    throw new Error('No fue posible cargar el dashboard.')
  }

  return count
}

function patientName(row: DashboardPatientRow): string {
  return [row.first_name, row.middle_name, row.last_name, row.second_last_name]
    .filter(Boolean)
    .join(' ')
}

function attentionStatus(row: DashboardPatientRow): AppointmentStatus {
  if (row.entry_time && !row.exit_time) {
    return 'in_progress'
  }
  if (row.exit_time) {
    return 'completed'
  }
  return 'waiting'
}

function isPaymentStatus(value: string | null): value is PaymentStatus {
  return Boolean(value && PAYMENT_STATUSES.includes(value as PaymentStatus))
}

function mapTodayPatient(row: DashboardPatientRow): AgendaAppointment {
  return {
    id: row.id,
    time: row.entry_time ? formatTime(row.entry_time) : '—',
    patientName: patientName(row),
    reason: row.benefit ?? 'Sin prestación',
    paymentStatus: isPaymentStatus(row.payment_status) ? row.payment_status : null,
    status: attentionStatus(row),
  }
}

function minutesAgo(createdAt: string): number {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.round(elapsed / 60000))
}

function mapAuditActivity(row: AuditLogRow): ActivityItem | null {
  const kind = resolveActivityKind(row.entity_type, row.action)
  if (!kind) {
    return null
  }

  return {
    id: row.id,
    kind,
    title: row.description,
    personName: row.user_name || row.entity_label || 'Sistema',
    minutesAgo: minutesAgo(row.created_at),
  }
}

function resolveActivityKind(
  entityType: string,
  action: string,
): ActivityKind | null {
  if (entityType === 'patients' && action === 'create') {
    return 'patient_registered'
  }
  if (entityType === 'patients' && action === 'update') {
    return 'patient_updated'
  }
  if (entityType === 'consultations' && (action === 'update' || action === 'create')) {
    return 'consultation_completed'
  }
  if (entityType === 'prescriptions' && action === 'create') {
    return 'prescription_issued'
  }
  if (entityType === 'users' && action === 'create') {
    return 'user_created'
  }
  return null
}

async function loadRecentActivity(): Promise<ActivityItem[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('audit_logs')
    .select(
      'id, user_name, action, entity_type, entity_label, description, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) {
    return []
  }

  return data
    .map((row) => mapAuditActivity(row as AuditLogRow))
    .filter((item): item is ActivityItem => item !== null)
    .slice(0, 8)
}

interface CaptadorPayableRow {
  amount: number | string
  payment_status: string
}

interface CaptadorPayableTotals {
  unpaidAmount: number
  unpaidCount: number
  totalCount: number
}

const EMPTY_CAPTADOR_PAYABLE: CaptadorPayableTotals = {
  unpaidAmount: 0,
  unpaidCount: 0,
  totalCount: 0,
}

function isMissingCaptadorEntriesTable(error: { code?: string; message: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    error.message.includes('captador_entries')
  )
}

async function loadCaptadorPayable(
  from: string,
  to: string,
): Promise<CaptadorPayableTotals> {
  const client = requireSupabase()
  const rows: CaptadorPayableRow[] = []

  for (let start = 0; start < MAX_ROWS; start += PAGE_SIZE) {
    const { data, error } = await client
      .from('captador_entries')
      .select('amount, payment_status')
      .gte('occurred_at', from)
      .lte('occurred_at', to)
      .range(start, start + PAGE_SIZE - 1)

    if (error) {
      if (isMissingCaptadorEntriesTable(error)) {
        return EMPTY_CAPTADOR_PAYABLE
      }

      throw new Error('No fue posible cargar el dashboard.')
    }

    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) {
      break
    }
  }

  const unpaid = rows.filter((row) => row.payment_status === 'Por pagar')

  return {
    unpaidAmount: unpaid.reduce((sum, row) => sum + Number(row.amount), 0),
    unpaidCount: unpaid.length,
    totalCount: rows.length,
  }
}

export async function getDashboardSnapshot(
  period: PeriodKey,
  options: { includeAudit: boolean },
): Promise<DashboardSnapshot> {
  const range = getDateFilterRange(period)
  if (!range) {
    throw new Error('El período seleccionado no es válido.')
  }

  const previous = getPreviousPeriodRange(range)
  const from = range.from.toISOString()
  const to = range.to.toISOString()
  const previousFrom = previous.from.toISOString()
  const previousTo = previous.to.toISOString()
  const todayRange = getDateFilterRange('today')
  if (!todayRange) {
    throw new Error('No fue posible calcular el período de hoy.')
  }

  const client = requireSupabase()

  const [
    patients,
    consultations,
    prescriptions,
    registeredCount,
    previousPatients,
    todayRegistered,
    todayVisiting,
    recentActivity,
    captadorPayable,
    previousCaptadorPayable,
  ] = await Promise.all([
    fetchPaged<DashboardPatientRow>((start, end) =>
      client
        .from('patients')
        .select(PATIENT_SELECT)
        .gte('registered_at', from)
        .lte('registered_at', to)
        .order('registered_at', { ascending: true })
        .range(start, end),
    ),
    fetchPaged<TimestampRow>((start, end) =>
      client
        .from('consultations')
        .select('created_at')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: true })
        .range(start, end),
    ),
    fetchPaged<TimestampRow>((start, end) =>
      client
        .from('prescriptions')
        .select('created_at')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: true })
        .range(start, end),
    ),
    countByColumn('patients', 'registered_at', from, to),
    countByColumn('patients', 'registered_at', previousFrom, previousTo),
    fetchPaged<DashboardPatientRow>((start, end) =>
      client
        .from('patients')
        .select(PATIENT_SELECT)
        .gte('registered_at', todayRange.from.toISOString())
        .lte('registered_at', todayRange.to.toISOString())
        .order('registered_at', { ascending: true })
        .range(start, end),
    ),
    fetchPaged<DashboardPatientRow>((start, end) =>
      client
        .from('patients')
        .select(PATIENT_SELECT)
        .gte('entry_time', todayRange.from.toISOString())
        .lte('entry_time', todayRange.to.toISOString())
        .order('entry_time', { ascending: true })
        .range(start, end),
    ),
    options.includeAudit ? loadRecentActivity() : Promise.resolve([]),
    loadCaptadorPayable(from, to),
    loadCaptadorPayable(previousFrom, previousTo),
  ])

  const todayById = new Map<string, DashboardPatientRow>()
  for (const row of [...todayRegistered, ...todayVisiting]) {
    todayById.set(row.id, row)
  }
  const todayPatients = [...todayById.values()].sort((left, right) => {
    if (left.entry_time && right.entry_time) {
      return left.entry_time.localeCompare(right.entry_time)
    }
    if (left.entry_time) {
      return -1
    }
    if (right.entry_time) {
      return 1
    }
    return left.registered_at.localeCompare(right.registered_at)
  })

  return {
    kpis: {
      patientsRegistered: {
        value: registeredCount,
        changePercent: changePercent(registeredCount, previousPatients),
      },
      captadorPayable: {
        value: captadorPayable.unpaidAmount,
        changePercent: changePercent(
          captadorPayable.unpaidAmount,
          previousCaptadorPayable.unpaidAmount,
        ),
        unpaidCount: captadorPayable.unpaidCount,
        totalCount: captadorPayable.totalCount,
      },
    },
    activityOverTime: buildActivitySeries(
      period,
      range,
      patients.map((patient) => patient.registered_at),
      consultations.map((row) => row.created_at),
      prescriptions.map((row) => row.created_at),
    ),
    paymentStatus: buildPaymentDistribution(
      patients.map((patient) => patient.payment_status),
    ),
    byOptical: buildOpticalDistribution(
      patients.map((patient) => patient.optical_name),
    ),
    recentActivity,
    todaysAgenda: todayPatients.map(mapTodayPatient),
    averageVisitMinutes: averageMinutes(
      patients
        .filter((patient) => patient.exit_time)
        .map((patient) => patient.duration_minutes),
    ),
  }
}
