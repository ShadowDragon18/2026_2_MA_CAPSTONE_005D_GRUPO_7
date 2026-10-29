import type { Captador } from '@/types/captador'
import type { OpticalOption } from '@/types/optical'
import {
  BENEFIT_TYPES,
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type BenefitType,
  type DocumentType,
  type Patient,
  type PaymentMethod,
  type PaymentStatus,
} from '@/types/patient'
import type { PatientRow } from '@/lib/supabase/database'

function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType)
}

function isBenefitType(value: string): value is BenefitType {
  return BENEFIT_TYPES.includes(value as BenefitType)
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod)
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus)
}

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function getPatientFullName(patient: Patient): string {
  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
    patient.secondLastName,
  ]
    .filter(Boolean)
    .join(' ')
}

export function getCaptadorName(patient: Patient): string {
  return [patient.captadorFirstName, patient.captadorLastName]
    .filter(Boolean)
    .join(' ')
}

export function matchOpticalId(
  name: string | null,
  opticals: OpticalOption[],
): string {
  if (!name) {
    return ''
  }

  const normalized = name.trim().toLowerCase()
  return (
    opticals.find((optical) => optical.name.trim().toLowerCase() === normalized)
      ?.id ?? ''
  )
}

export function matchCaptadorId(
  patient: Pick<Patient, 'captadorFirstName' | 'captadorLastName'>,
  captadores: Captador[],
  opticalId: string,
): string {
  if (!opticalId || !patient.captadorFirstName) {
    return ''
  }

  const firstName = patient.captadorFirstName.trim().toLowerCase()
  const lastName = (patient.captadorLastName ?? '').trim().toLowerCase()

  return (
    captadores.find(
      (captador) =>
        captador.opticalId === opticalId &&
        captador.firstName.trim().toLowerCase() === firstName &&
        (captador.lastName ?? '').trim().toLowerCase() === lastName,
    )?.id ?? ''
  )
}

export function isPatientRecordComplete(patient: Patient): boolean {
  const hasDocument =
    patient.documentType === 'Extranjero' ||
    Boolean(patient.documentNumber?.trim())

  return (
    hasDocument &&
    patient.firstName.trim().length > 0 &&
    Boolean(patient.lastName?.trim()) &&
    patient.age !== null &&
    patient.benefit !== null &&
    Boolean(patient.captadorFirstName?.trim())
  )
}

export function mapPatient(row: PatientRow): Patient {
  if (!isDocumentType(row.document_type)) {
    throw new Error('El paciente tiene datos no válidos.')
  }

  if (row.benefit !== null && !isBenefitType(row.benefit)) {
    throw new Error('El paciente tiene datos no válidos.')
  }

  if (row.payment_method !== null && !isPaymentMethod(row.payment_method)) {
    throw new Error('El paciente tiene datos no válidos.')
  }

  if (row.payment_status !== null && !isPaymentStatus(row.payment_status)) {
    throw new Error('El paciente tiene datos no válidos.')
  }

  return {
    id: row.id,
    registeredAt: row.registered_at,
    documentType: row.document_type,
    documentNumber: row.document_number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    secondLastName: row.second_last_name,
    age: row.age,
    benefit: row.benefit,
    captadorFirstName: row.captador_first_name,
    captadorLastName: row.captador_last_name,
    opticalName: row.optical_name,
    amount: Number(row.amount),
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    durationMinutes: row.duration_minutes,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    generalObservation: row.general_observation,
    condition: row.condition,
    email: row.email,
    colorTag: row.color_tag,
    isWarranty: row.is_warranty,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
