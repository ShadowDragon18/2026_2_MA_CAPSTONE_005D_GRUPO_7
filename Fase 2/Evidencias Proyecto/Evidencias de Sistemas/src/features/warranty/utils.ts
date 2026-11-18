import {
  mapClinical,
  unwrapConsultation,
} from '@/features/consultations/utils'
import { mapPatient } from '@/features/patients/utils'
import type { ConsultationRow, PatientRow } from '@/lib/supabase/database'
import type { ConsultationRecord } from '@/types/consultation'
import type { WarrantyRecord } from '@/types/warranty'

export interface WarrantyQueryRow extends PatientRow {
  consultations: ConsultationRow | ConsultationRow[] | null
}

export function mapWarrantyRecord(row: WarrantyQueryRow): WarrantyRecord {
  const { consultations, ...patientRow } = row
  const clinical = unwrapConsultation(consultations)

  return {
    patient: mapPatient(patientRow),
    consultation: clinical ? mapClinical(clinical) : null,
  }
}

export function warrantyToConsultationRecord(
  record: WarrantyRecord,
): ConsultationRecord {
  const { patient, consultation } = record

  return {
    patientId: patient.id,
    registeredAt: patient.registeredAt,
    documentType: patient.documentType,
    documentNumber: patient.documentNumber,
    firstName: patient.firstName,
    middleName: patient.middleName,
    lastName: patient.lastName,
    secondLastName: patient.secondLastName,
    age: patient.age,
    condition: patient.condition,
    email: patient.email,
    colorTag: patient.colorTag,
    isWarranty: patient.isWarranty,
    entryTime: patient.entryTime,
    exitTime: patient.exitTime,
    consultation,
  }
}

export function displayValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}
