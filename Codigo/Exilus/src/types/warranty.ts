import type { ConsultationClinicalData } from '@/types/consultation'
import type { Patient } from '@/types/patient'

export type WarrantyViewMode = 'cards' | 'table'

export interface WarrantyRecord {
  patient: Patient
  consultation: ConsultationClinicalData | null
}

export interface WarrantyFilters {
  search: string
}

export const EMPTY_WARRANTY_FILTERS: WarrantyFilters = {
  search: '',
}
