import type { PatientDateFilter } from '@/types/patient'
import type { DocumentType } from '@/types/patient'

export interface Prescription {
  id: string
  patientId: string
  consultationId: string
  prescriptionDate: string
  odSphere: number | null
  odCylinder: number | null
  odAxis: number | null
  oiSphere: number | null
  oiCylinder: number | null
  oiAxis: number | null
  dp: number | null
  addValue: number | null
  observations: string | null
  indications: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string
  updatedAt: string
  firstName: string
  middleName: string | null
  lastName: string | null
  secondLastName: string | null
  documentType: DocumentType
  documentNumber: string | null
  age: number | null
  email: string | null
}

export interface PrescriptionCandidate {
  consultationId: string
  consultationCreatedAt: string
  patientId: string
  firstName: string
  middleName: string | null
  lastName: string | null
  secondLastName: string | null
  documentType: DocumentType
  documentNumber: string | null
  age: number | null
  email: string | null
  odSphere: number | null
  odCylinder: number | null
  odAxis: number | null
  oiSphere: number | null
  oiCylinder: number | null
  oiAxis: number | null
  dp: number | null
  addValue: number | null
}

export interface PrescriptionPatientOption {
  id: string
  label: string
}

export interface PrescriptionFilters {
  search: string
  date: PatientDateFilter
  patientId: string
}

export const EMPTY_PRESCRIPTION_FILTERS: PrescriptionFilters = {
  search: '',
  date: 'all',
  patientId: '',
}

export interface PrescriptionPreset {
  patientId: string
  consultationId: string | null
}
