import { logAuditEvent } from '@/features/audit/api'
import { diffAuditData } from '@/features/audit/utils'
import type { ConsultationFormValues } from '@/features/consultations/schema'
import {
  emptyToNull,
  getConsultationPatientName,
  mapClinical,
  mapConsultationRecord,
  parseOptionalDecimal,
  parseOptionalInteger,
  sortConsultationsByVisit,
  type ConsultationQueryRow,
} from '@/features/consultations/utils'
import { requireSupabase } from '@/lib/supabase/client'
import type {
  ConsultationInsert,
  ConsultationRow,
  ConsultationUpdate,
  Json,
} from '@/lib/supabase/database'
import type {
  ConsultationClinicalData,
  ConsultationFilters,
  ConsultationRecord,
} from '@/types/consultation'

function clinicalSnapshot(
  clinical: ConsultationClinicalData | ConsultationRow | null,
): Record<string, Json | undefined> {
  if (!clinical) {
    return {}
  }

  if ('odSphere' in clinical) {
    return {
      odSphere: clinical.odSphere,
      odCylinder: clinical.odCylinder,
      odAxis: clinical.odAxis,
      oiSphere: clinical.oiSphere,
      oiCylinder: clinical.oiCylinder,
      oiAxis: clinical.oiAxis,
      dp: clinical.dp,
      addValue: clinical.addValue,
      glucoseMgDl: clinical.glucoseMgDl,
      medicalObservations: clinical.medicalObservations,
    }
  }

  const mapped = mapClinical(clinical)
  return {
    odSphere: mapped.odSphere,
    odCylinder: mapped.odCylinder,
    odAxis: mapped.odAxis,
    oiSphere: mapped.oiSphere,
    oiCylinder: mapped.oiCylinder,
    oiAxis: mapped.oiAxis,
    dp: mapped.dp,
    addValue: mapped.addValue,
    glucoseMgDl: mapped.glucoseMgDl,
    medicalObservations: mapped.medicalObservations,
  }
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

function toClinicalPayload(values: ConsultationFormValues): Omit<
  ConsultationInsert,
  'patient_id'
> {
  return {
    oi_sphere: parseOptionalDecimal(values.oiSphere),
    oi_cylinder: parseOptionalDecimal(values.oiCylinder),
    oi_axis: parseOptionalInteger(values.oiAxis),
    od_sphere: parseOptionalDecimal(values.odSphere),
    od_cylinder: parseOptionalDecimal(values.odCylinder),
    od_axis: parseOptionalInteger(values.odAxis),
    dp: parseOptionalDecimal(values.dp),
    add_value: parseOptionalDecimal(values.addValue),
    glucose_mg_dl: parseOptionalInteger(values.glucoseMgDl),
    medical_observations: emptyToNull(values.medicalObservations),
  }
}

const CONSULTATION_LIST_SELECT = `
  id,
  registered_at,
  document_type,
  document_number,
  first_name,
  middle_name,
  last_name,
  second_last_name,
  age,
  condition,
  email,
  color_tag,
  is_warranty,
  entry_time,
  exit_time,
  current_visit_id,
  consultations (
    id,
    visit_id,
    created_at,
    oi_sphere,
    oi_cylinder,
    oi_axis,
    od_sphere,
    od_cylinder,
    od_axis,
    dp,
    add_value,
    glucose_mg_dl,
    medical_observations
  )
`

export async function listConsultationRecords(
  filters: ConsultationFilters,
): Promise<ConsultationRecord[]> {
  const client = requireSupabase()
  let query = client
    .from('patients')
    .select(CONSULTATION_LIST_SELECT)
    .order('registered_at', { ascending: filters.sort === 'oldest' })

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
        `condition.ilike.${pattern}`,
      ].join(','),
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar las consultas.')
  }

  return sortConsultationsByVisit(
    ((data ?? []) as ConsultationQueryRow[]).map(mapConsultationRecord),
  )
}

export async function saveConsultation(
  patientId: string,
  consultationId: string | null,
  values: ConsultationFormValues,
): Promise<ConsultationRecord> {
  const client = requireSupabase()
  const clinical = toClinicalPayload(values)
  let previousClinical: ConsultationRow | null = null

  if (consultationId) {
    const { data: existing } = await client
      .from('consultations')
      .select('*')
      .eq('id', consultationId)
      .maybeSingle()
    previousClinical = existing

    const payload: ConsultationUpdate = clinical
    const { error } = await client
      .from('consultations')
      .update(payload)
      .eq('id', consultationId)

    if (error) {
      throw new Error('No fue posible guardar la consulta.')
    }
  } else {
    const { data: patient, error: patientError } = await client
      .from('patients')
      .select('current_visit_id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      throw new Error('No fue posible guardar la consulta.')
    }

    let visitId = patient.current_visit_id
    if (!visitId) {
      visitId = crypto.randomUUID()
      const { error: visitError } = await client
        .from('patients')
        .update({ current_visit_id: visitId })
        .eq('id', patientId)

      if (visitError) {
        throw new Error('No fue posible guardar la consulta.')
      }
    }

    const payload: ConsultationInsert = {
      patient_id: patientId,
      visit_id: visitId,
      ...clinical,
    }
    const { error } = await client.from('consultations').insert(payload)

    if (error) {
      throw new Error('No fue posible guardar la consulta.')
    }
  }

  const { data, error } = await client
    .from('patients')
    .select(CONSULTATION_LIST_SELECT)
    .eq('id', patientId)
    .single()

  if (error || !data) {
    throw new Error('No fue posible actualizar la consulta.')
  }

  const saved = mapConsultationRecord(data as ConsultationQueryRow)
  const label = getConsultationPatientName(saved)
  const after = clinicalSnapshot(saved.consultation)
  const before = clinicalSnapshot(previousClinical)
  const diff = diffAuditData(before, after)

  await logAuditEvent({
    action: consultationId ? 'update' : 'create',
    entityType: 'consultations',
    entityId: saved.consultation?.id ?? consultationId,
    entityLabel: label,
    description: consultationId
      ? 'Consulta editada'
      : 'Consulta creada',
    oldData: consultationId ? diff.oldData : null,
    newData: diff.newData ?? after,
  })

  return saved
}

export async function deleteConsultation(consultationId: string): Promise<void> {
  const client = requireSupabase()
  const { data: existing } = await client
    .from('consultations')
    .select(
      `
      *,
      patients!inner (
        first_name,
        middle_name,
        last_name,
        second_last_name
      )
    `,
    )
    .eq('id', consultationId)
    .maybeSingle()

  const { error } = await client
    .from('consultations')
    .delete()
    .eq('id', consultationId)

  if (error) {
    throw new Error('No fue posible eliminar la consulta.')
  }

  const patient = existing
    ? Array.isArray(existing.patients)
      ? existing.patients[0]
      : existing.patients
    : null
  const label = patient
    ? [patient.first_name, patient.middle_name, patient.last_name, patient.second_last_name]
        .filter(Boolean)
        .join(' ')
    : consultationId

  await logAuditEvent({
    action: 'delete',
    entityType: 'consultations',
    entityId: consultationId,
    entityLabel: label,
    description: 'Consulta eliminada',
    oldData: existing ? clinicalSnapshot(existing) : null,
  })
}

export async function setPatientColorTag(
  patientId: string,
  colorTag: string | null,
): Promise<string | null> {
  const client = requireSupabase()
  const { data: previous } = await client
    .from('patients')
    .select('first_name, middle_name, last_name, second_last_name, color_tag')
    .eq('id', patientId)
    .maybeSingle()

  const { data, error } = await client.rpc('set_patient_color', {
    target_id: patientId,
    new_color: colorTag,
  })

  if (error || !data) {
    throw new Error('No fue posible actualizar el color.')
  }

  const label = previous
    ? [previous.first_name, previous.middle_name, previous.last_name, previous.second_last_name]
        .filter(Boolean)
        .join(' ')
    : patientId

  if (previous?.color_tag !== data.color_tag) {
    await logAuditEvent({
      action: 'update',
      entityType: 'patients',
      entityId: patientId,
      entityLabel: label,
      description: 'Color de paciente modificado',
      oldData: { color: previous?.color_tag ?? null },
      newData: { color: data.color_tag },
    })
  }

  return data.color_tag
}
