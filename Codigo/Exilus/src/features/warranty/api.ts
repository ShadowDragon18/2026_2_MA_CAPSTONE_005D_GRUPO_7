import { mapWarrantyRecord, type WarrantyQueryRow } from '@/features/warranty/utils'
import { requireSupabase } from '@/lib/supabase/client'
import type { WarrantyFilters, WarrantyRecord } from '@/types/warranty'

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

const WARRANTY_LIST_SELECT = `
  *,
  consultations (
    id,
    created_at,
    visit_id,
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

export async function listWarrantyRecords(
  filters: WarrantyFilters,
): Promise<WarrantyRecord[]> {
  const client = requireSupabase()
  let query = client
    .from('patients')
    .select(WARRANTY_LIST_SELECT)
    .eq('is_warranty', true)
    .order('registered_at', { ascending: false })

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
        `optical_name.ilike.${pattern}`,
        `email.ilike.${pattern}`,
      ].join(','),
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error('No fue posible cargar las garantías.')
  }

  return ((data ?? []) as WarrantyQueryRow[]).map(mapWarrantyRecord)
}
