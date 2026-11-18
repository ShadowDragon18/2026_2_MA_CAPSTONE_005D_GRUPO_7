import type { OpticalRow } from '@/lib/supabase/database'
import type { Optical } from '@/types/optical'

export function mapOptical(row: OpticalRow, captadorCount = 0): Optical {
  return {
    id: row.id,
    name: row.name,
    colorTag: row.color_tag,
    captadorCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function sanitizeSearch(value: string): string {
  return value.replace(/[%_,.()]/g, ' ').trim()
}

export function getWriteErrorMessage(
  error: { code?: string; message: string },
  fallback: string,
): string {
  if (error.code === '23505') {
    return 'Ya existe una óptica con ese nombre.'
  }

  if (error.code === '23503') {
    return 'No se puede eliminar porque hay captadores asignados. Reasígnalos primero.'
  }

  return error.message || fallback
}
