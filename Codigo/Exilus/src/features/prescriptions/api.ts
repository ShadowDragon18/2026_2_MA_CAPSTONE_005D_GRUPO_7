import { logAuditEvent } from '@/features/audit/api'
import { diffAuditData } from '@/features/audit/utils'
import {
  emptyToNull,
  parseOptionalDecimal,
  parseOptionalInteger,
} from '@/features/consultations/utils'
import {
  getPrescriptionPatientName,
  mapPrescription,
  mapPrescriptionCandidate,
  type PrescriptionCandidateQueryRow,
  type PrescriptionQueryRow,
} from '@/features/prescriptions/utils'
import type { PrescriptionFormValues } from '@/features/prescriptions/schema'
import { getDateFilterRange } from '@/lib/dates'
import { requireSupabase } from '@/lib/supabase/client'
import type {
  Json,
  PrescriptionInsert,
  PrescriptionRow,
  PrescriptionUpdate,
} from '@/lib/supabase/database'
import type {
  Prescription,
  PrescriptionCandidate,
  PrescriptionFilters,
  PrescriptionPatientOption,
} from '@/types/prescription'

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

function prescriptionSnapshot(
  record: Pick<
    Prescription,
    | 'odSphere'
    | 'odCylinder'
    | 'odAxis'
    | 'oiSphere'
    | 'oiCylinder'
    | 'oiAxis'
    | 'dp'
    | 'addValue'
    | 'observations'
    | 'indications'
  >,
): Record<string, Json | undefined> {
  return {
    odSphere: record.odSphere,
    odCylinder: record.odCylinder,
    odAxis: record.odAxis,
    oiSphere: record.oiSphere,
    oiCylinder: record.oiCylinder,
    oiAxis: record.oiAxis,
    dp: record.dp,
    addValue: record.addValue,
    observations: record.observations,
    indications: record.indications,
  }
}

function rowOpticalSnapshot(
  row: PrescriptionRow,
): Record<string, Json | undefined> {
  return {
    odSphere: row.od_sphere,
    odCylinder: row.od_cylinder,
    odAxis: row.od_axis,
    oiSphere: row.oi_sphere,
    oiCylinder: row.oi_cylinder,
    oiAxis: row.oi_axis,
    dp: row.dp,
    addValue: row.add_value,
    observations: row.observations,
    indications: row.indications,
  }
}

function toOpticalPayload(
  values: PrescriptionFormValues,
): Pick<
  PrescriptionInsert,
  | 'od_sphere'
  | 'od_cylinder'
  | 'od_axis'
  | 'oi_sphere'
  | 'oi_cylinder'
  | 'oi_axis'
  | 'dp'
  | 'add_value'
  | 'observations'
  | 'indications'
> {
  return {
    od_sphere: parseOptionalDecimal(values.odSphere),
    od_cylinder: parseOptionalDecimal(values.odCylinder),
    od_axis: parseOptionalInteger(values.odAxis),
    oi_sphere: parseOptionalDecimal(values.oiSphere),
    oi_cylinder: parseOptionalDecimal(values.oiCylinder),
    oi_axis: parseOptionalInteger(values.oiAxis),
    dp: parseOptionalDecimal(values.dp),
    add_value: parseOptionalDecimal(values.addValue),
    observations: emptyToNull(values.observations),
    indications: emptyToNull(values.indications),
  }
}

const PRESCRIPTION_LIST_SELECT = `
  id,
  patient_id,
  consultation_id,
  prescription_date,
  od_sphere,
  od_cylinder,
  od_axis,
  oi_sphere,
  oi_cylinder,
  oi_axis,
  dp,
  add_value,
  observations,
  indications,
  created_by,
  created_at,
  updated_at,
  patients!inner (
    first_name,
    middle_name,
    last_name,
    second_last_name,
    document_type,
    document_number,
    age,
    email
  ),
  creator:profiles!prescriptions_created_by_fkey (
    full_name
  )
`

async function fetchPrescriptionById(id: string): Promise<Prescription> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('prescriptions')
    .select(PRESCRIPTION_LIST_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error('No fue posible cargar la receta.')
  }

  return mapPrescription(data as PrescriptionQueryRow)
}

export async function listPrescriptions(
  filters: PrescriptionFilters,
): Promise<Prescription[]> {
  const client = requireSupabase()
  let query = client
    .from('prescriptions')
    .select(PRESCRIPTION_LIST_SELECT)
    .order('prescription_date', { ascending: false })
    .order('created_at', { ascending: false })

  const range = getDateFilterRange(filters.date)
  if (range) {
    query = query
      .gte('prescription_date', range.from.toISOString())
      .lte('prescription_date', range.to.toISOString())
  }

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }

  const search = sanitizeSearch(filters.search)
  if (search) {
    const pattern = `%${search}%`
    query = query.or(
      [
        `first_name.ilike.${pattern}`,
        `middle_name.ilike.${pattern}`,
        `last_name.ilike.${pattern}`,
        `second_last_name.ilike.${pattern}`,
        `document_number.ilike.${pattern}`,
      ].join(','),
      { referencedTable: 'patients' },
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar las recetas.')
  }

  return ((data ?? []) as PrescriptionQueryRow[]).map(mapPrescription)
}

export async function listPrescriptionPatientOptions(): Promise<
  PrescriptionPatientOption[]
> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('prescriptions')
    .select(
      `
      patient_id,
      patients!inner (
        first_name,
        middle_name,
        last_name,
        second_last_name,
        document_number
      )
    `,
    )
    .order('prescription_date', { ascending: false })

  if (error) {
    throw new Error('No fue posible cargar los pacientes de recetas.')
  }

  const options = new Map<string, PrescriptionPatientOption>()

  for (const row of data ?? []) {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients
    if (!patient || options.has(row.patient_id)) {
      continue
    }

    const name = getPrescriptionPatientName({
      firstName: patient.first_name,
      middleName: patient.middle_name,
      lastName: patient.last_name,
      secondLastName: patient.second_last_name,
    })
    const document = patient.document_number
      ? ` · ${patient.document_number}`
      : ''

    options.set(row.patient_id, {
      id: row.patient_id,
      label: `${name}${document}`,
    })
  }

  return [...options.values()].sort((left, right) =>
    left.label.localeCompare(right.label, 'es'),
  )
}

export async function listPrescriptionCandidates(): Promise<
  PrescriptionCandidate[]
> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('consultations')
    .select(
      `
      id,
      patient_id,
      created_at,
      od_sphere,
      od_cylinder,
      od_axis,
      oi_sphere,
      oi_cylinder,
      oi_axis,
      dp,
      add_value,
      patients!inner (
        id,
        first_name,
        middle_name,
        last_name,
        second_last_name,
        document_type,
        document_number,
        age,
        email
      )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('No fue posible cargar las consultas para receta.')
  }

  return ((data ?? []) as PrescriptionCandidateQueryRow[])
    .map(mapPrescriptionCandidate)
    .sort((left, right) =>
      getPrescriptionPatientName(left).localeCompare(
        getPrescriptionPatientName(right),
        'es',
      ),
    )
}

export async function createPrescription(
  values: PrescriptionFormValues,
): Promise<Prescription> {
  const client = requireSupabase()
  const payload: PrescriptionInsert = {
    patient_id: values.patientId,
    consultation_id: values.consultationId,
    ...toOpticalPayload(values),
  }

  const { data, error } = await client
    .from('prescriptions')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('No fue posible guardar la receta.')
  }

  const prescription = await fetchPrescriptionById(data.id)
  await logAuditEvent({
    action: 'create',
    entityType: 'prescriptions',
    entityId: prescription.id,
    entityLabel: getPrescriptionPatientName(prescription),
    description: 'Receta creada',
    newData: prescriptionSnapshot(prescription),
  })

  return prescription
}

export async function updatePrescription(
  id: string,
  values: PrescriptionFormValues,
): Promise<Prescription> {
  const client = requireSupabase()
  const payload: PrescriptionUpdate = toOpticalPayload(values)
  const { data: previous } = await client
    .from('prescriptions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const { error } = await client
    .from('prescriptions')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw new Error('No fue posible actualizar la receta.')
  }

  const prescription = await fetchPrescriptionById(id)
  const diff = previous
    ? diffAuditData(rowOpticalSnapshot(previous), prescriptionSnapshot(prescription))
    : { oldData: null, newData: prescriptionSnapshot(prescription) }

  await logAuditEvent({
    action: 'update',
    entityType: 'prescriptions',
    entityId: id,
    entityLabel: getPrescriptionPatientName(prescription),
    description: 'Receta editada',
    oldData: diff.oldData,
    newData: diff.newData,
  })

  return prescription
}

export async function deletePrescription(id: string, patientId: string): Promise<void> {
  const client = requireSupabase()
  let label = patientId
  let oldData: Json | null = null

  try {
    const existing = await fetchPrescriptionById(id)
    label = getPrescriptionPatientName(existing)
    oldData = prescriptionSnapshot(existing)
  } catch {
    oldData = null
  }

  const { error } = await client.from('prescriptions').delete().eq('id', id)

  if (error) {
    throw new Error('No fue posible eliminar la receta.')
  }

  await logAuditEvent({
    action: 'delete',
    entityType: 'prescriptions',
    entityId: id,
    entityLabel: label,
    description: 'Receta eliminada',
    oldData,
  })
}
