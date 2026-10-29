import type { ConsultationClinicalData, ConsultationRecord } from '@/types/consultation'
import type { DocumentType } from '@/types/patient'
import { DOCUMENT_TYPES } from '@/types/patient'
import type { ConsultationRow, PatientRow } from '@/lib/supabase/database'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function parseOptionalDecimal(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) {
    return null
  }
  return Number(trimmed)
}

export function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return Number(trimmed)
}

function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType)
}

function parseNumeric(value: number | string | null): number | null {
  if (value === null) {
    return null
  }
  return Number(value)
}

export function getConsultationPatientName(record: ConsultationRecord): string {
  return [
    record.firstName,
    record.middleName,
    record.lastName,
    record.secondLastName,
  ]
    .filter(Boolean)
    .join(' ')
}

export function getConsultationDocumentLabel(record: ConsultationRecord): string {
  if (!record.documentNumber) {
    return record.documentType
  }
  return `${record.documentType} ${record.documentNumber}`
}

export function formatSignedDecimal(value: number | null): string {
  if (value === null) {
    return '—'
  }
  const formatted = Math.abs(value).toFixed(2)
  if (value > 0) {
    return `+${formatted}`
  }
  if (value < 0) {
    return `-${formatted}`
  }
  return '0.00'
}

export function formatEyePrescription(
  sphere: number | null,
  cylinder: number | null,
  axis: number | null,
): string {
  if (sphere === null && cylinder === null && axis === null) {
    return '—'
  }

  const axisText = axis === null ? '—' : String(axis)
  return `${formatSignedDecimal(sphere)} / ${formatSignedDecimal(cylinder)} × ${axisText}`
}

export function mapClinical(row: ConsultationRow): ConsultationClinicalData {
  return {
    id: row.id,
    oiSphere: parseNumeric(row.oi_sphere),
    oiCylinder: parseNumeric(row.oi_cylinder),
    oiAxis: row.oi_axis,
    odSphere: parseNumeric(row.od_sphere),
    odCylinder: parseNumeric(row.od_cylinder),
    odAxis: row.od_axis,
    dp: parseNumeric(row.dp),
    addValue: parseNumeric(row.add_value),
    glucoseMgDl: row.glucose_mg_dl,
    medicalObservations: row.medical_observations,
  }
}

export function consultationsList(
  value: ConsultationRow | ConsultationRow[] | null,
): ConsultationRow[] {
  if (!value) {
    return []
  }

  const list = Array.isArray(value) ? value : [value]
  return [...list].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  )
}

export function unwrapConsultation(
  value: ConsultationRow | ConsultationRow[] | null,
): ConsultationRow | null {
  return consultationsList(value)[0] ?? null
}

export function pickConsultationForVisit(
  value: ConsultationRow | ConsultationRow[] | null,
  visitId: string | null,
): ConsultationRow | null {
  const list = consultationsList(value)
  if (visitId) {
    return list.find((row) => row.visit_id === visitId) ?? null
  }

  return list[0] ?? null
}

export interface ConsultationQueryRow
  extends Pick<
    PatientRow,
    | 'id'
    | 'registered_at'
    | 'document_type'
    | 'document_number'
    | 'first_name'
    | 'middle_name'
    | 'last_name'
    | 'second_last_name'
    | 'age'
    | 'condition'
    | 'email'
    | 'color_tag'
    | 'is_warranty'
    | 'entry_time'
    | 'exit_time'
    | 'current_visit_id'
  > {
  consultations: ConsultationRow | ConsultationRow[] | null
}

export function mapConsultationRecord(row: ConsultationQueryRow): ConsultationRecord {
  if (!isDocumentType(row.document_type)) {
    throw new Error('La consulta tiene datos no válidos.')
  }

  const clinical = pickConsultationForVisit(
    row.consultations,
    row.current_visit_id,
  )

  return {
    patientId: row.id,
    registeredAt: row.registered_at,
    documentType: row.document_type,
    documentNumber: row.document_number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    secondLastName: row.second_last_name,
    age: row.age,
    condition: row.condition,
    email: row.email,
    colorTag: row.color_tag,
    isWarranty: row.is_warranty,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    consultation: clinical ? mapClinical(clinical) : null,
  }
}

export function isVisitInProgress(record: ConsultationRecord): boolean {
  return Boolean(record.entryTime && !record.exitTime)
}

export function sortConsultationsByVisit(
  records: ConsultationRecord[],
): ConsultationRecord[] {
  return [...records].sort((left, right) => {
    const leftActive = isVisitInProgress(left) ? 0 : 1
    const rightActive = isVisitInProgress(right) ? 0 : 1
    return leftActive - rightActive
  })
}

export function isValidPatientEmail(value: string | null): value is string {
  return Boolean(value && EMAIL_PATTERN.test(value))
}

export function buildGmailComposeUrl(record: ConsultationRecord): string {
  const clinical = record.consultation
  const subject = 'Consulta oftalmológica - Exilus'
  const body = [
    'Consulta oftalmológica',
    '',
    `Nombre: ${getConsultationPatientName(record)}`,
    `Documento: ${getConsultationDocumentLabel(record)}`,
    `Fecha: ${new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(record.registeredAt))}`,
    `Condición: ${record.condition ?? '—'}`,
    '',
    `OD: ${formatEyePrescription(clinical?.odSphere ?? null, clinical?.odCylinder ?? null, clinical?.odAxis ?? null)}`,
    `OI: ${formatEyePrescription(clinical?.oiSphere ?? null, clinical?.oiCylinder ?? null, clinical?.oiAxis ?? null)}`,
    `DP: ${clinical?.dp ?? '—'}`,
    `ADD: ${clinical?.addValue === null || clinical?.addValue === undefined ? '—' : formatSignedDecimal(clinical.addValue)}`,
    `MG/DL: ${clinical?.glucoseMgDl === null || clinical?.glucoseMgDl === undefined ? '—' : `${clinical.glucoseMgDl} mg/dL`}`,
    '',
    'Observaciones médicas:',
    clinical?.medicalObservations ?? '—',
  ].join('\n')

  const to = encodeURIComponent(record.email ?? '')
  const su = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${encodedBody}`
}
