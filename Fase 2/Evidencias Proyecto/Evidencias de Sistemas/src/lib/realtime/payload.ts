export function realtimeRowId(
  record: Record<string, unknown> | undefined,
): string | null {
  if (!record) {
    return null
  }

  const id = record.id
  return typeof id === 'string' ? id : null
}

export function isFilledRealtimeRow(record: object): boolean {
  return Object.keys(record).length > 0
}
