import {
  formatEyePrescription,
  formatSignedDecimal,
} from '@/features/consultations/utils'
import { formatShortDate } from '@/lib/format'
import { LOGO_SRC } from '@/lib/constants'
import type { ConsultationRow, PatientRow, PrescriptionRow } from '@/lib/supabase/database'
import type { DocumentType } from '@/types/patient'
import { DOCUMENT_TYPES } from '@/types/patient'
import type { Prescription, PrescriptionCandidate } from '@/types/prescription'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType)
}

function parseNumeric(value: number | string | null): number | null {
  if (value === null) {
    return null
  }
  return Number(value)
}

export function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null
  }
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value
}

export function getPrescriptionPatientName(
  record: Pick<
    Prescription,
    'firstName' | 'middleName' | 'lastName' | 'secondLastName'
  >,
): string {
  return [
    record.firstName,
    record.middleName,
    record.lastName,
    record.secondLastName,
  ]
    .filter(Boolean)
    .join(' ')
}

export function getPrescriptionDocumentLabel(
  record: Pick<Prescription, 'documentType' | 'documentNumber'>,
): string {
  if (!record.documentNumber) {
    return record.documentType
  }
  return `${record.documentType} ${record.documentNumber}`
}

export function formatDp(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return value.toFixed(2)
}

export function formatAdd(value: number | null): string {
  return formatSignedDecimal(value)
}

export function numberToInput(value: number | null): string {
  return value === null ? '' : String(value)
}

export function isValidPatientEmail(value: string | null): value is string {
  return Boolean(value && EMAIL_PATTERN.test(value))
}

function formatOptionalText(value: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

export interface PrescriptionDocumentModel {
  clinicName: string
  logoSrc: string
  patientName: string
  documentLabel: string
  ageLabel: string
  dateLabel: string
  od: string
  oi: string
  odSphere: string
  odCylinder: string
  odAxis: string
  oiSphere: string
  oiCylinder: string
  oiAxis: string
  dp: string
  add: string
  indications: string
  observations: string
}

export function buildPrescriptionDocument(
  prescription: Prescription,
  clinicName: string,
): PrescriptionDocumentModel {
  return {
    clinicName,
    logoSrc: LOGO_SRC,
    patientName: getPrescriptionPatientName(prescription),
    documentLabel: getPrescriptionDocumentLabel(prescription),
    ageLabel:
      prescription.age === null ? '—' : `${prescription.age} años`,
    dateLabel: formatShortDate(prescription.prescriptionDate),
    od: formatEyePrescription(
      prescription.odSphere,
      prescription.odCylinder,
      prescription.odAxis,
    ),
    oi: formatEyePrescription(
      prescription.oiSphere,
      prescription.oiCylinder,
      prescription.oiAxis,
    ),
    odSphere: formatSignedDecimal(prescription.odSphere),
    odCylinder: formatSignedDecimal(prescription.odCylinder),
    odAxis: prescription.odAxis === null ? '—' : String(prescription.odAxis),
    oiSphere: formatSignedDecimal(prescription.oiSphere),
    oiCylinder: formatSignedDecimal(prescription.oiCylinder),
    oiAxis: prescription.oiAxis === null ? '—' : String(prescription.oiAxis),
    dp: formatDp(prescription.dp),
    add: formatAdd(prescription.addValue),
    indications: formatOptionalText(prescription.indications),
    observations: formatOptionalText(prescription.observations),
  }
}

export function getPrescriptionPdfFilename(prescription: Prescription): string {
  const first = sanitizeFilePart(prescription.firstName || 'Paciente')
  const last = sanitizeFilePart(prescription.lastName || 'SinApellido')
  const date = prescription.prescriptionDate.slice(0, 10)
  return `receta_${first}_${last}_${date}.pdf`
}

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function buildPrescriptionGmailUrl(
  prescription: Prescription,
  clinicName: string,
): string {
  const document = buildPrescriptionDocument(prescription, clinicName)
  const subject = 'Receta oftalmológica - Exilus'
  const body = [
    'Receta oftalmológica',
    '',
    `Clínica: ${document.clinicName}`,
    `Paciente: ${document.patientName}`,
    `Documento: ${document.documentLabel}`,
    `Edad: ${document.ageLabel}`,
    `Fecha: ${document.dateLabel}`,
    '',
    `OD: ${document.od}`,
    `OI: ${document.oi}`,
    `DP: ${document.dp}`,
    `ADD: ${document.add}`,
    '',
    'Indicaciones:',
    document.indications,
    '',
    'Observaciones:',
    document.observations,
  ].join('\n')

  const to = encodeURIComponent(prescription.email ?? '')
  const su = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${encodedBody}`
}

export interface PrescriptionQueryRow extends PrescriptionRow {
  patients: Pick<
    PatientRow,
    | 'first_name'
    | 'middle_name'
    | 'last_name'
    | 'second_last_name'
    | 'document_type'
    | 'document_number'
    | 'age'
    | 'email'
  > | Pick<
    PatientRow,
    | 'first_name'
    | 'middle_name'
    | 'last_name'
    | 'second_last_name'
    | 'document_type'
    | 'document_number'
    | 'age'
    | 'email'
  >[] | null
  creator:
    | { full_name: string }
    | { full_name: string }[]
    | null
}

export function mapPrescription(row: PrescriptionQueryRow): Prescription {
  const patient = unwrapRelation(row.patients)
  if (!patient) {
    throw new Error('La receta no tiene paciente asociado.')
  }
  if (!isDocumentType(patient.document_type)) {
    throw new Error('La receta tiene datos no válidos.')
  }

  const creator = unwrapRelation(row.creator)

  return {
    id: row.id,
    patientId: row.patient_id,
    consultationId: row.consultation_id,
    prescriptionDate: row.prescription_date,
    odSphere: parseNumeric(row.od_sphere),
    odCylinder: parseNumeric(row.od_cylinder),
    odAxis: row.od_axis,
    oiSphere: parseNumeric(row.oi_sphere),
    oiCylinder: parseNumeric(row.oi_cylinder),
    oiAxis: row.oi_axis,
    dp: parseNumeric(row.dp),
    addValue: parseNumeric(row.add_value),
    observations: row.observations,
    indications: row.indications,
    createdBy: row.created_by,
    createdByName: creator?.full_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    firstName: patient.first_name,
    middleName: patient.middle_name,
    lastName: patient.last_name,
    secondLastName: patient.second_last_name,
    documentType: patient.document_type,
    documentNumber: patient.document_number,
    age: patient.age,
    email: patient.email,
  }
}

export interface PrescriptionCandidateQueryRow extends ConsultationRow {
  patients:
    | Pick<
        PatientRow,
        | 'id'
        | 'first_name'
        | 'middle_name'
        | 'last_name'
        | 'second_last_name'
        | 'document_type'
        | 'document_number'
        | 'age'
        | 'email'
      >
    | Pick<
        PatientRow,
        | 'id'
        | 'first_name'
        | 'middle_name'
        | 'last_name'
        | 'second_last_name'
        | 'document_type'
        | 'document_number'
        | 'age'
        | 'email'
      >[]
    | null
}

export function mapPrescriptionCandidate(
  row: PrescriptionCandidateQueryRow,
): PrescriptionCandidate {
  const patient = unwrapRelation(row.patients)
  if (!patient) {
    throw new Error('La consulta no tiene paciente asociado.')
  }
  if (!isDocumentType(patient.document_type)) {
    throw new Error('La consulta tiene datos no válidos.')
  }

  return {
    consultationId: row.id,
    consultationCreatedAt: row.created_at,
    patientId: patient.id,
    firstName: patient.first_name,
    middleName: patient.middle_name,
    lastName: patient.last_name,
    secondLastName: patient.second_last_name,
    documentType: patient.document_type,
    documentNumber: patient.document_number,
    age: patient.age,
    email: patient.email,
    odSphere: parseNumeric(row.od_sphere),
    odCylinder: parseNumeric(row.od_cylinder),
    odAxis: row.od_axis,
    oiSphere: parseNumeric(row.oi_sphere),
    oiCylinder: parseNumeric(row.oi_cylinder),
    oiAxis: row.oi_axis,
    dp: parseNumeric(row.dp),
    addValue: parseNumeric(row.add_value),
  }
}

export function getCandidateLabel(candidate: PrescriptionCandidate): string {
  const name = getPrescriptionPatientName(candidate)
  const document = getPrescriptionDocumentLabel(candidate)
  return `${name} · ${document}`
}

export function getCandidateConsultationLabel(
  candidate: PrescriptionCandidate,
): string {
  return `Consulta del ${formatShortDate(candidate.consultationCreatedAt)}`
}
