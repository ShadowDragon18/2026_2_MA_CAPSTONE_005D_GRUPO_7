import type { ActivityPoint, NamedValue } from '@/types/dashboard'
import type { PeriodKey } from '@/types/period'
import { PAYMENT_STATUSES } from '@/types/patient'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

function padHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function changePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return Math.round(((current - previous) / previous) * 100)
}

export function averageMinutes(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null && value > 0)
  if (valid.length === 0) {
    return null
  }

  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

function bucketKey(date: Date, period: PeriodKey): string {
  if (period === 'today' || period === 'yesterday') {
    return padHour(date.getHours())
  }

  if (period === 'this_year') {
    return MONTH_LABELS[date.getMonth()] ?? String(date.getMonth() + 1)
  }

  if (period === 'this_week') {
    const index = (date.getDay() + 6) % 7
    return WEEKDAY_LABELS[index] ?? WEEKDAY_LABELS[0]
  }

  return String(date.getDate())
}

export function buildActivityBuckets(
  period: PeriodKey,
  range: { from: Date; to: Date },
): string[] {
  if (period === 'today' || period === 'yesterday') {
    return Array.from({ length: 13 }, (_, index) => padHour(index + 8))
  }

  if (period === 'this_week') {
    return [...WEEKDAY_LABELS]
  }

  if (period === 'this_year') {
    const lastMonth = range.to.getMonth()
    return MONTH_LABELS.slice(0, lastMonth + 1)
  }

  const labels: string[] = []
  const cursor = startOfLocalDay(range.from)
  const last = startOfLocalDay(range.to)
  while (cursor <= last) {
    labels.push(String(cursor.getDate()))
    cursor.setDate(cursor.getDate() + 1)
  }
  return labels
}

export function buildActivitySeries(
  period: PeriodKey,
  range: { from: Date; to: Date },
  patients: string[],
  consultations: string[],
  prescriptions: string[],
): ActivityPoint[] {
  const labels = buildActivityBuckets(period, range)
  const patientsCount = countByLabel(patients, period)
  const consultationsCount = countByLabel(consultations, period)
  const prescriptionsCount = countByLabel(prescriptions, period)

  return labels.map((label) => ({
    label,
    patients: patientsCount.get(label) ?? 0,
    consultations: consultationsCount.get(label) ?? 0,
    prescriptions: prescriptionsCount.get(label) ?? 0,
  }))
}

function countByLabel(values: string[], period: PeriodKey): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      continue
    }
    const label = bucketKey(date, period)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return counts
}

export function buildPaymentDistribution(
  statuses: Array<string | null>,
): NamedValue[] {
  const counts = new Map<string, number>(
    PAYMENT_STATUSES.map((status) => [status, 0]),
  )

  for (const status of statuses) {
    if (status && counts.has(status)) {
      counts.set(status, (counts.get(status) ?? 0) + 1)
    }
  }

  return PAYMENT_STATUSES.map((name) => ({
    name,
    value: counts.get(name) ?? 0,
  }))
}

export function buildOpticalDistribution(
  names: Array<string | null>,
): NamedValue[] {
  const counts = new Map<string, number>()

  for (const name of names) {
    const trimmed = name?.trim()
    if (!trimmed) {
      continue
    }
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'es'))
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))
}

export function isActivityEmpty(points: ActivityPoint[]): boolean {
  return points.every(
    (point) =>
      point.patients === 0 &&
      point.consultations === 0 &&
      point.prescriptions === 0,
  )
}
