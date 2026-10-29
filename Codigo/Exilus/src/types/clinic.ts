export const DEFAULT_CLINIC_NAME = 'Exilus'
export const DEFAULT_PATIENT_AMOUNT = 7000
export const DEFAULT_CAPTADOR_AMOUNT = 1000
export const DEFAULT_QUICK_COLORS = [
  '#2563EB',
  '#14B8A6',
  '#22C55E',
  '#EAB308',
  '#EF4444',
  '#8B5CF6',
] as const

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

export interface ClinicSettings {
  clinicName: string
  defaultAmount: number
  defaultCaptadorAmount: number
  quickColors: string[]
  updatedAt: string | null
  updatedBy: string | null
}

export const FALLBACK_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: DEFAULT_CLINIC_NAME,
  defaultAmount: DEFAULT_PATIENT_AMOUNT,
  defaultCaptadorAmount: DEFAULT_CAPTADOR_AMOUNT,
  quickColors: [...DEFAULT_QUICK_COLORS],
  updatedAt: null,
  updatedBy: null,
}
