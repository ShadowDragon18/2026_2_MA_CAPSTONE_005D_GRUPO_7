import type { DocumentType } from '@/types/patient'

export type ConsultationSort = 'recent' | 'oldest'

export interface ConsultationClinicalData {
  id: string
  oiSphere: number | null
  oiCylinder: number | null
  oiAxis: number | null
  odSphere: number | null
  odCylinder: number | null
  odAxis: number | null
  dp: number | null
  addValue: number | null
  glucoseMgDl: number | null
  medicalObservations: string | null
}

export interface ConsultationRecord {
  patientId: string
  registeredAt: string
  documentType: DocumentType
  documentNumber: string | null
  firstName: string
  middleName: string | null
  lastName: string | null
  secondLastName: string | null
  age: number | null
  condition: string | null
  email: string | null
  colorTag: string | null
  isWarranty: boolean
  entryTime: string | null
  exitTime: string | null
  consultation: ConsultationClinicalData | null
}

export interface ConsultationFilters {
  search: string
  sort: ConsultationSort
}

export const EMPTY_CONSULTATION_FILTERS: ConsultationFilters = {
  search: '',
  sort: 'recent',
}
