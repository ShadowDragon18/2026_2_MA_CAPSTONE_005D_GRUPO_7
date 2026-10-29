import type { Patient } from '@/types/patient'

export const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isoToTimeInput(iso: string | null): string {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function applyTimeToIso(baseIso: string, time: string): string {
  const match = TIME_INPUT_PATTERN.exec(time)
  if (!match) {
    throw new Error('Ingresa una hora válida')
  }

  const next = new Date(baseIso)
  next.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return next.toISOString()
}

export function resolveVisitTimestamps(
  times: { entryTime: string; exitTime: string },
  existing?: Patient | null,
): { entryTime: string | null; exitTime: string | null } {
  const entryBase =
    existing?.entryTime ?? existing?.registeredAt ?? new Date().toISOString()
  const entryTime = times.entryTime
    ? applyTimeToIso(entryBase, times.entryTime)
    : null
  const exitBase = existing?.exitTime ?? entryTime ?? entryBase
  const exitTime = times.exitTime ? applyTimeToIso(exitBase, times.exitTime) : null

  return {
    entryTime,
    exitTime: entryTime ? exitTime : null,
  }
}
