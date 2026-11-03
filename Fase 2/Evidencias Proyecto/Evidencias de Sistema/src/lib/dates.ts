import type { PatientDateFilter } from '@/types/patient'

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function startOfWeekMonday(date: Date): Date {
  const next = startOfDay(date)
  const day = next.getDay()
  const diff = day === 0 ? 6 : day - 1
  next.setDate(next.getDate() - diff)
  return next
}

export function getDateFilterRange(
  filter: PatientDateFilter,
): { from: Date; to: Date } | null {
  if (filter === 'all') {
    return null
  }

  const now = new Date()

  if (filter === 'today') {
    return { from: startOfDay(now), to: endOfDay(now) }
  }

  if (filter === 'yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) }
  }

  if (filter === 'this_week') {
    return { from: startOfWeekMonday(now), to: endOfDay(now) }
  }

  if (filter === 'this_month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) }
  }

  return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) }
}

export function getPreviousPeriodRange(range: {
  from: Date
  to: Date
}): { from: Date; to: Date } {
  const durationMs = range.to.getTime() - range.from.getTime()
  const to = new Date(range.from.getTime() - 1)
  const from = new Date(to.getTime() - durationMs)
  return { from, to }
}

export function getCustomDateRange(
  fromDate: string,
  toDate: string,
): { from: Date; to: Date } | null {
  if (!fromDate && !toDate) {
    return null
  }

  const from = startOfDay(new Date(`${fromDate || toDate}T00:00:00`))
  const to = endOfDay(new Date(`${toDate || fromDate}T00:00:00`))

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null
  }

  if (from > to) {
    return { from: to, to: from }
  }

  return { from, to }
}
