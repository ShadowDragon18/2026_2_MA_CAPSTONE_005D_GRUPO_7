import {
  mapClinical,
  unwrapConsultation,
} from '@/features/consultations/utils'
import { mapPatient } from '@/features/patients/utils'
import type { ConsultationRow, PatientRow } from '@/lib/supabase/database'
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

export function displayValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}
