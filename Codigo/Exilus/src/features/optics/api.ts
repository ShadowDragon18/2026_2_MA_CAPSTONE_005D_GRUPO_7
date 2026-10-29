import type { OpticalFormValues } from '@/features/optics/schema'
import { getWriteErrorMessage, mapOptical, sanitizeSearch } from '@/features/optics/utils'
import { requireSupabase } from '@/lib/supabase/client'
import type { OpticalRow } from '@/lib/supabase/database'
import type { Optical, OpticalFilters, OpticalOption } from '@/types/optical'

async function getCaptadorCounts(
  opticalIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()

  if (opticalIds.length === 0) {
    return counts
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('captadores')
    .select('optical_id')
    .in('optical_id', opticalIds)

  if (error) {
    throw new Error('No fue posible contar los captadores.')
  }

  for (const row of data ?? []) {
    counts.set(row.optical_id, (counts.get(row.optical_id) ?? 0) + 1)
  }

  return counts
}

export async function listOptics(
  filters: OpticalFilters = { search: '' },
): Promise<Optical[]> {
  const client = requireSupabase()
  const search = sanitizeSearch(filters.search)

  let query = client.from('optics').select('*').order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar las ópticas.')
  }

  const rows = data ?? []
  const counts = await getCaptadorCounts(rows.map((row) => row.id))

  return rows.map((row) => mapOptical(row, counts.get(row.id) ?? 0))
}

export async function listOpticalOptions(): Promise<OpticalOption[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('optics')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    throw new Error('No fue posible cargar las ópticas.')
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }))
}

export async function createOptical(
  values: OpticalFormValues,
): Promise<Optical> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('optics')
    .insert({ name: values.name.trim() })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(
      getWriteErrorMessage(error ?? { message: '' }, 'No fue posible crear la óptica.'),
    )
  }

  return mapOptical(data, 0)
}

export async function updateOptical(
  id: string,
  values: OpticalFormValues,
): Promise<Optical> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('optics')
    .update({ name: values.name.trim() })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(
      getWriteErrorMessage(
        error ?? { message: '' },
        'No fue posible actualizar la óptica.',
      ),
    )
  }

  const counts = await getCaptadorCounts([id])
  return mapOptical(data, counts.get(id) ?? 0)
}

export async function deleteOptical(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('optics').delete().eq('id', id)

  if (error) {
    throw new Error(
      getWriteErrorMessage(error, 'No fue posible eliminar la óptica.'),
    )
  }
}

export async function setOpticalColor(
  id: string,
  color: string | null,
): Promise<Optical> {
  const client = requireSupabase()
  const colorTag = color

  const updated = await client
    .from('optics')
    .update({ color_tag: colorTag })
    .eq('id', id)
    .select('*')
    .single()

  let row: OpticalRow | null =
    !updated.error && updated.data ? updated.data : null

  if (!row) {
    const { data, error } = await client.rpc('set_optical_color', {
      target_id: id,
      new_color: colorTag,
    })

    if (error || !data) {
      throw new Error('No fue posible actualizar el color.')
    }

    row = data
  }

  const counts = await getCaptadorCounts([id])
  return mapOptical(row, counts.get(id) ?? 0)
}
