export const PERIOD_KEYS = [
  'today',
  'yesterday',
  'this_week',
  'this_month',
  'this_year',
] as const

export type PeriodKey = (typeof PERIOD_KEYS)[number]

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este año' },
]
