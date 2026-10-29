import { logAuditEvent } from '@/features/audit/api'
import { recordCaptadorEntry } from '@/features/captadores/api'
import { diffAuditData } from '@/features/audit/utils'
import type { PatientFormValues } from '@/features/patients/schema'
import { resolveVisitTimestamps } from '@/features/patients/time'
import {
  emptyToNull,
  getPatientFullName,
  isPatientRecordComplete,
  mapPatient,
} from '@/features/patients/utils'
import { getDefaultPatientAmount } from '@/lib/config/clinic'
import { getDateFilterRange } from '@/lib/dates'
import { requireSupabase } from '@/lib/supabase/client'
import type { Json, PatientInsert, PatientUpdate } from '@/lib/supabase/database'
import type { Patient, PatientFilters } from '@/types/patient'

function patientSnapshot(patient: Patient): Record<string, Json | undefined> {
  return {
    name: getPatientFullName(patient),
    document: patient.documentNumber,
    age: patient.age,
    email: patient.email,
    amount: patient.amount,
    paymentStatus: patient.paymentStatus,
    paymentMethod: patient.paymentMethod,
    condition: patient.condition,
    color: patient.colorTag,
    warranty: patient.isWarranty,
    entryTime: patient.entryTime,
    exitTime: patient.exitTime,
  }
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

function toWritePayload(
  values: PatientFormValues,
  existing?: Patient | null,
): PatientInsert {
  const payload: PatientInsert = {
    document_type: values.documentType,
    document_number:
      values.documentType === 'Extranjero'
        ? null
        : emptyToNull(values.documentNumber),
    first_name: values.firstName.trim(),
    middle_name: emptyToNull(values.middleName),
    last_name: emptyToNull(values.lastName),
    second_last_name: emptyToNull(values.secondLastName),
    age: values.age.trim() === '' ? null : Number(values.age),
    benefit: values.benefit === '' ? null : values.benefit,
    amount:
      values.amount.trim() === ''
        ? getDefaultPatientAmount()
        : Number(values.amount.replace(',', '.')),
    payment_method: values.paymentMethod === '' ? null : values.paymentMethod,
    payment_status: values.paymentStatus === '' ? null : values.paymentStatus,
    general_observation: emptyToNull(values.generalObservation),
    condition: emptyToNull(values.condition),
    email: emptyToNull(values.email),
  }

  if (!values.automaticTime) {
    const times = resolveVisitTimestamps(values, existing)
    payload.entry_time = times.entryTime
    payload.exit_time = times.exitTime
  }

  return payload
}

async function resolveCatalogFields(
  opticalId: string,
  captadorId: string,
): Promise<{
  optical_name: string | null
  captador_first_name: string | null
  captador_last_name: string | null
}> {
  if (!opticalId) {
    return {
      optical_name: null,
      captador_first_name: null,
      captador_last_name: null,
    }
  }

  const client = requireSupabase()
  const { data: optical, error: opticalError } = await client
    .from('optics')
    .select('name')
    .eq('id', opticalId)
    .maybeSingle()

  if (opticalError) {
    throw new Error('No fue posible validar la óptica.')
  }

  if (!optical) {
    throw new Error('La óptica seleccionada ya no existe.')
  }

  if (!captadorId) {
    return {
      optical_name: optical.name,
      captador_first_name: null,
      captador_last_name: null,
    }
  }

  const { data: captador, error: captadorError } = await client
    .from('captadores')
    .select('first_name, last_name, optical_id')
    .eq('id', captadorId)
    .maybeSingle()

  if (captadorError) {
    throw new Error('No fue posible validar el captador.')
  }

  if (!captador || captador.optical_id !== opticalId) {
    throw new Error('El captador no pertenece a la óptica seleccionada.')
  }

  return {
    optical_name: optical.name,
    captador_first_name: captador.first_name,
    captador_last_name: captador.last_name,
  }
}

async function toPatientWritePayload(
  values: PatientFormValues,
  existing?: Patient | null,
): Promise<PatientInsert> {
  const catalog = await resolveCatalogFields(values.opticalId, values.captadorId)
  return {
    ...toWritePayload(values, existing),
    ...catalog,
  }
}

export async function listPatients(filters: PatientFilters): Promise<Patient[]> {
  const client = requireSupabase()
  let query = client
    .from('patients')
    .select('*')
    .order('registered_at', { ascending: false })

  const range = getDateFilterRange(filters.date)
  if (range) {
    query = query
      .gte('registered_at', range.from.toISOString())
      .lte('registered_at', range.to.toISOString())
  }

  if (filters.opticalName) {
    query = query.eq('optical_name', filters.opticalName)
  }

  if (filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
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
        `benefit.ilike.${pattern}`,
        `captador_first_name.ilike.${pattern}`,
        `captador_last_name.ilike.${pattern}`,
        `optical_name.ilike.${pattern}`,
        `payment_method.ilike.${pattern}`,
        `payment_status.ilike.${pattern}`,
      ].join(','),
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar los pacientes.')
  }

  const patients = (data ?? []).map(mapPatient)

  if (filters.completion === 'incomplete') {
    return patients.filter((patient) => !isPatientRecordComplete(patient))
  }

  if (filters.completion === 'complete') {
    return patients.filter((patient) => isPatientRecordComplete(patient))
  }

  return patients
}

export async function listOpticalNames(): Promise<string[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('patients')
    .select('optical_name')
    .not('optical_name', 'is', null)

  if (error) {
    throw new Error('No fue posible cargar las ópticas.')
  }

  const names = new Set<string>()
  for (const row of data ?? []) {
    if (row.optical_name) {
      names.add(row.optical_name)
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b, 'es'))
}

export async function createPatient(values: PatientFormValues): Promise<Patient> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('patients')
    .insert({
      ...(await toPatientWritePayload(values)),
      is_warranty: false,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error('No fue posible crear el paciente.')
  }

  const patient = mapPatient(data)

  if (values.captadorId && values.opticalId) {
    await recordCaptadorEntry({
      captadorId: values.captadorId,
      opticalId: values.opticalId,
      patientId: patient.id,
      occurredAt: patient.registeredAt,
    })
  }

  await logAuditEvent({
    action: 'create',
    entityType: 'patients',
    entityId: patient.id,
    entityLabel: getPatientFullName(patient),
    description: 'Paciente creado',
    newData: {
      name: getPatientFullName(patient),
      document: patient.documentNumber,
      age: patient.age,
      email: patient.email,
    },
  })

  return patient
}

export async function updatePatient(
  id: string,
  values: PatientFormValues,
  existing?: Patient | null,
): Promise<Patient> {
  const client = requireSupabase()
  const payload: PatientUpdate = await toPatientWritePayload(values, existing)
  const { data, error } = await client
    .from('patients')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error('No fue posible actualizar el paciente.')
  }

  const patient = mapPatient(data)
  const label = getPatientFullName(patient)

  if (existing) {
    if (existing.entryTime !== patient.entryTime) {
      await logAuditEvent({
        action: 'update',
        entityType: 'patients',
        entityId: patient.id,
        entityLabel: label,
        description: 'Hora de entrada modificada',
        oldData: { entryTime: existing.entryTime },
        newData: { entryTime: patient.entryTime },
      })
    }

    if (existing.exitTime !== patient.exitTime) {
      await logAuditEvent({
        action: 'update',
        entityType: 'patients',
        entityId: patient.id,
        entityLabel: label,
        description: 'Hora de salida modificada',
        oldData: { exitTime: existing.exitTime },
        newData: { exitTime: patient.exitTime },
      })
    }

    const before = patientSnapshot(existing)
    const after = patientSnapshot(patient)
    delete before.entryTime
    delete before.exitTime
    delete after.entryTime
    delete after.exitTime
    const diff = diffAuditData(before, after)
    if (diff.oldData && diff.newData) {
      await logAuditEvent({
        action: 'update',
        entityType: 'patients',
        entityId: patient.id,
        entityLabel: label,
        description: 'Paciente editado',
        oldData: diff.oldData,
        newData: diff.newData,
      })
    }
  } else {
    await logAuditEvent({
      action: 'update',
      entityType: 'patients',
      entityId: patient.id,
      entityLabel: label,
      description: 'Paciente editado',
    })
  }

  if (values.captadorId && values.opticalId) {
    await recordCaptadorEntry({
      captadorId: values.captadorId,
      opticalId: values.opticalId,
      patientId: patient.id,
      occurredAt: patient.registeredAt,
    })
  }

  return patient
}

export async function deletePatient(id: string): Promise<void> {
  const client = requireSupabase()
  const { data: existing } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const { error } = await client.from('patients').delete().eq('id', id)

  if (error) {
    throw new Error('No fue posible eliminar el paciente.')
  }

  const label = existing ? getPatientFullName(mapPatient(existing)) : id
  await logAuditEvent({
    action: 'delete',
    entityType: 'patients',
    entityId: id,
    entityLabel: label,
    description: 'Paciente eliminado',
    oldData: existing
      ? {
          name: label,
          document: existing.document_number,
        }
      : null,
  })
}

export async function startPatientVisit(id: string): Promise<Patient> {
  const client = requireSupabase()
  const { data: existing, error: existingError } = await client
    .from('patients')
    .select('entry_time, exit_time, current_visit_id')
    .eq('id', id)
    .maybeSingle()

  if (existingError || !existing) {
    throw new Error('No fue posible registrar la hora de entrada.')
  }

  if (existing.entry_time && !existing.exit_time) {
    throw new Error('Este paciente ya tiene una atención en curso.')
  }

  const visitId =
    existing.exit_time || !existing.current_visit_id
      ? crypto.randomUUID()
      : existing.current_visit_id

  const { data, error } = await client
    .from('patients')
    .update({
      entry_time: new Date().toISOString(),
      exit_time: null,
      current_visit_id: visitId,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error('No fue posible registrar la hora de entrada.')
  }

  const patient = mapPatient(data)
  await logAuditEvent({
    action: 'update',
    entityType: 'patients',
    entityId: patient.id,
    entityLabel: getPatientFullName(patient),
    description: 'Hora de entrada modificada',
    oldData: { entryTime: null },
    newData: { entryTime: patient.entryTime },
  })

  return patient
}

export async function updatePatientVisitTimes(
  id: string,
  times: { entryTime: string | null; exitTime: string | null },
): Promise<Patient> {
  const client = requireSupabase()
  const { data: previous } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const { data, error } = await client
    .from('patients')
    .update({
      entry_time: times.entryTime,
      exit_time: times.exitTime,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error('No fue posible actualizar las horas.')
  }

  const patient = mapPatient(data)
  const previousTimes = previous
    ? { entryTime: previous.entry_time, exitTime: previous.exit_time }
    : null
  await logPatientTimeChanges(patient, times, previousTimes)

  return patient
}

async function logPatientTimeChanges(
  patient: Patient,
  times: { entryTime: string | null; exitTime: string | null },
  previous: { entryTime: string | null; exitTime: string | null } | null,
): Promise<void> {
  const label = getPatientFullName(patient)

  if (!previous || previous.entryTime !== times.entryTime) {
    await logAuditEvent({
      action: 'update',
      entityType: 'patients',
      entityId: patient.id,
      entityLabel: label,
      description: 'Hora de entrada modificada',
      oldData: { entryTime: previous?.entryTime ?? null },
      newData: { entryTime: times.entryTime },
    })
  }

  if (!previous || previous.exitTime !== times.exitTime) {
    await logAuditEvent({
      action: 'update',
      entityType: 'patients',
      entityId: patient.id,
      entityLabel: label,
      description: 'Hora de salida modificada',
      oldData: { exitTime: previous?.exitTime ?? null },
      newData: { exitTime: times.exitTime },
    })
  }
}

export async function finishPatientVisit(id: string): Promise<Patient> {
  const client = requireSupabase()
  const updated = await client
    .from('patients')
    .update({ exit_time: new Date().toISOString() })
    .eq('id', id)
    .not('entry_time', 'is', null)
    .is('exit_time', null)
    .select('*')
    .single()

  const patient = !updated.error && updated.data
    ? mapPatient(updated.data)
    : null

  if (!patient) {
    const { data, error } = await client.rpc('finish_patient_visit', {
      target_id: id,
    })

    if (error || !data) {
      throw new Error('No fue posible registrar la hora de salida.')
    }

    const finished = mapPatient(data)
    await logAuditEvent({
      action: 'update',
      entityType: 'patients',
      entityId: finished.id,
      entityLabel: getPatientFullName(finished),
      description: 'Hora de salida modificada',
      oldData: { exitTime: null },
      newData: { exitTime: finished.exitTime },
    })
    return finished
  }

  await logAuditEvent({
    action: 'update',
    entityType: 'patients',
    entityId: patient.id,
    entityLabel: getPatientFullName(patient),
    description: 'Hora de salida modificada',
    oldData: { exitTime: null },
    newData: { exitTime: patient.exitTime },
  })

  return patient
}

export async function setPatientColor(
  id: string,
  colorTag: string | null,
): Promise<Patient> {
  const client = requireSupabase()
  const { data: previous } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const updated = await client
    .from('patients')
    .update({ color_tag: colorTag })
    .eq('id', id)
    .select('*')
    .single()

  const patient =
    !updated.error && updated.data
      ? mapPatient(updated.data)
      : null

  if (!patient) {
    const { data, error } = await client.rpc('set_patient_color', {
      target_id: id,
      new_color: colorTag,
    })

    if (error || !data) {
      throw new Error('No fue posible actualizar el color.')
    }

    const next = mapPatient(data)
    await logColorChange(next, previous?.color_tag ?? null)
    return next
  }

  await logColorChange(patient, previous?.color_tag ?? null)
  return patient
}

async function logColorChange(
  patient: Patient,
  previousColor: string | null,
): Promise<void> {
  if (previousColor === patient.colorTag) {
    return
  }

  await logAuditEvent({
    action: 'update',
    entityType: 'patients',
    entityId: patient.id,
    entityLabel: getPatientFullName(patient),
    description: 'Color de paciente modificado',
    oldData: { color: previousColor },
    newData: { color: patient.colorTag },
  })
}

export async function setPatientWarranty(
  id: string,
  isWarranty: boolean,
): Promise<Patient> {
  const client = requireSupabase()
  const { data: previous } = await client
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const updated = await client
    .from('patients')
    .update({ is_warranty: isWarranty })
    .eq('id', id)
    .select('*')
    .single()

  const patient =
    !updated.error && updated.data
      ? mapPatient(updated.data)
      : null

  if (!patient) {
    const { data, error } = await client.rpc('set_patient_warranty', {
      target_id: id,
      new_warranty: isWarranty,
    })

    if (error || !data) {
      throw new Error('No fue posible actualizar la garantía.')
    }

    const next = mapPatient(data)
    await logWarrantyChange(next, previous?.is_warranty ?? false)
    return next
  }

  await logWarrantyChange(patient, previous?.is_warranty ?? false)
  return patient
}

async function logWarrantyChange(
  patient: Patient,
  previousWarranty: boolean,
): Promise<void> {
  if (previousWarranty === patient.isWarranty) {
    return
  }

  await logAuditEvent({
    action: 'update',
    entityType: 'patients',
    entityId: patient.id,
    entityLabel: getPatientFullName(patient),
    description: patient.isWarranty
      ? 'Garantía activada'
      : 'Garantía desactivada',
    oldData: { warranty: previousWarranty },
    newData: { warranty: patient.isWarranty },
  })
}
