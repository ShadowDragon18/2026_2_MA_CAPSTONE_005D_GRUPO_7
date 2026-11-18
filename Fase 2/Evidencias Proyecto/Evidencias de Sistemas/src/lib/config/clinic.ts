import {
  DEFAULT_CAPTADOR_AMOUNT,
  DEFAULT_PATIENT_AMOUNT,
  FALLBACK_CLINIC_SETTINGS,
  type ClinicSettings,
} from '@/types/clinic'

let cachedClinicSettings: ClinicSettings = FALLBACK_CLINIC_SETTINGS

export function setCachedClinicSettings(settings: ClinicSettings): void {
  cachedClinicSettings = settings
}

export function getCachedClinicSettings(): ClinicSettings {
  return cachedClinicSettings
}

export function getDefaultPatientAmount(): number {
  return cachedClinicSettings.defaultAmount || DEFAULT_PATIENT_AMOUNT
}

export function getDefaultCaptadorAmount(): number {
  return cachedClinicSettings.defaultCaptadorAmount || DEFAULT_CAPTADOR_AMOUNT
}
