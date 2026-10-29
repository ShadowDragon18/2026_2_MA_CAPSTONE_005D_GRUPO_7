import type {
  CaptadorEntryFormValues,
  CaptadorFormValues,
} from '@/features/captadores/schema'
import {
  emptyToNull,
  getWriteErrorMessage,
  mapCaptador,
  mapCaptadorEntry,
  matchesCaptadorEntrySearch,
  matchesCaptadorSearch,
  opticalNameFromEmbed,
  sanitizeSearch,
} from '@/features/captadores/utils'
import { getDateFilterRange } from '@/lib/dates'
import { requireSupabase } from '@/lib/supabase/client'
import type { CaptadorEntryRow, CaptadorRow } from '@/lib/supabase/database'
import type {
  Captador,
  CaptadorEntry,
  CaptadorFilters,
} from '@/types/captador'
import { EMPTY_CAPTADOR_FILTERS } from '@/types/captador'

const CAPTADOR_SELECT =
  'id, first_name, last_name, optical_id, amount, payment_status, created_at, updated_at, optics(name)'

function parseAmount(value: string): number {
  return Number(value.replace(',', '.'))
}

function mapCaptadorQuery(
  row: CaptadorRow & { optics?: unknown },
): Captador {
  return mapCaptador(row, opticalNameFromEmbed(row.optics))
}

export async function listCaptadores(
  filters: { search?: string; opticalId?: string } = {},
): Promise<Captador[]> {
  const client = requireSupabase()
  let query = client
    .from('captadores')
    .select(CAPTADOR_SELECT)
    .order('first_name', { ascending: true })
    .order('last_name', { ascending: true })

  if (filters.opticalId) {
    query = query.eq('optical_id', filters.opticalId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar los captadores.')
  }

  const captadores = (data ?? []).map(mapCaptadorQuery)
  const search = sanitizeSearch(filters.search ?? '')

  return captadores.filter((captador) =>
    matchesCaptadorSearch(captador, search),
  )
}

export async function createCaptador(
  values: CaptadorFormValues,
): Promise<Captador> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('captadores')
    .insert({
      first_name: values.firstName.trim(),
      last_name: emptyToNull(values.lastName),
      optical_id: values.opticalId,
      amount: parseAmount(values.amount),
      payment_status: values.paymentStatus,
    })
    .select(CAPTADOR_SELECT)
    .single()

  if (error || !data) {
    throw new Error(
      getWriteErrorMessage(
        error ?? { message: '' },
        'No fue posible crear el captador.',
      ),
    )
  }

  return mapCaptadorQuery(data)
}

export async function updateCaptador(
  id: string,
  values: CaptadorFormValues,
): Promise<Captador> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('captadores')
    .update({
      first_name: values.firstName.trim(),
      last_name: emptyToNull(values.lastName),
      optical_id: values.opticalId,
      amount: parseAmount(values.amount),
      payment_status: values.paymentStatus,
    })
    .eq('id', id)
    .select(CAPTADOR_SELECT)
    .single()

  if (error || !data) {
    throw new Error(
      getWriteErrorMessage(
        error ?? { message: '' },
        'No fue posible actualizar el captador.',
      ),
    )
  }

  return mapCaptadorQuery(data)
}

export async function deleteCaptador(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('captadores').delete().eq('id', id)

  if (error) {
    throw new Error(
      getWriteErrorMessage(error, 'No fue posible eliminar el captador.'),
    )
  }
}

const ENTRY_SELECT = `
  id,
  captador_id,
  optical_id,
  patient_id,
  amount,
  payment_status,
  occurred_at,
  created_at,
  updated_at,
  captadores ( first_name, last_name ),
  optics ( name ),
  patients ( first_name, middle_name, last_name, second_last_name )
`

function mapEntryQuery(
  row: CaptadorEntryRow & {
    captadores?: unknown
    optics?: unknown
    patients?: unknown
  },
): CaptadorEntry {
  return mapCaptadorEntry(row)
}

export async function listCaptadorEntries(
  filters: CaptadorFilters = EMPTY_CAPTADOR_FILTERS,
): Promise<CaptadorEntry[]> {
  const client = requireSupabase()
  let query = client
    .from('captador_entries')
    .select(ENTRY_SELECT)
    .order('occurred_at', { ascending: false })

  const range = getDateFilterRange(filters.date)
  if (range) {
    query = query
      .gte('occurred_at', range.from.toISOString())
      .lte('occurred_at', range.to.toISOString())
  }

  if (filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  if (filters.opticalId) {
    query = query.eq('optical_id', filters.opticalId)
  }

  const { data, error } = await query

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw new Error(
        'Falta la tabla de captaciones. Ejecuta supabase/sql/captador_entries.sql.',
      )
    }

    throw new Error('No fue posible cargar las captaciones.')
  }

  const entries = (data ?? []).map(mapEntryQuery)
  const search = sanitizeSearch(filters.search)

  return entries.filter((entry) => matchesCaptadorEntrySearch(entry, search))
}

export async function recordCaptadorEntry(input: {
  captadorId: string
  opticalId: string
  patientId: string
  occurredAt: string
}): Promise<void> {
  const client = requireSupabase()
  const { data: captador, error: captadorError } = await client
    .from('captadores')
    .select('amount, optical_id')
    .eq('id', input.captadorId)
    .maybeSingle()

  if (captadorError || !captador) {
    throw new Error('No fue posible registrar la captación.')
  }

  const { error } = await client.from('captador_entries').insert({
    captador_id: input.captadorId,
    optical_id: input.opticalId || captador.optical_id,
    patient_id: input.patientId,
    amount: Number(captador.amount),
    payment_status: 'Por pagar',
    occurred_at: input.occurredAt,
  })

  if (error) {
    if (error.code === '23505') {
      return
    }

    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw new Error(
        'Falta la tabla de captaciones. Ejecuta supabase/sql/captador_entries.sql.',
      )
    }

    throw new Error(
      getWriteErrorMessage(error, 'No fue posible registrar la captación.'),
    )
  }
}

export async function updateCaptadorEntry(
  id: string,
  values: CaptadorEntryFormValues,
): Promise<CaptadorEntry> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('captador_entries')
    .update({
      amount: parseAmount(values.amount),
      payment_status: values.paymentStatus,
    })
    .eq('id', id)
    .select(ENTRY_SELECT)
    .single()

  if (error || !data) {
    throw new Error(
      getWriteErrorMessage(
        error ?? { message: '' },
        'No fue posible actualizar la captación.',
      ),
    )
  }

  return mapEntryQuery(data)
}

export async function deleteCaptadorEntry(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('captador_entries').delete().eq('id', id)

  if (error) {
    throw new Error('No fue posible eliminar la captación.')
  }
}
