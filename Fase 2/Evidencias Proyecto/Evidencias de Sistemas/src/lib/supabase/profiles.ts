import { requireSupabase } from '@/lib/supabase/client'
import type { ProfileRow } from '@/lib/supabase/database'
import { isUserRole } from '@/types/roles'

export async function getProfileByUserId(
  userId: string,
): Promise<ProfileRow> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, role, email, is_active, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error('No fue posible cargar el perfil.')
  }

  if (!data) {
    throw new Error(
      'No se encontró un perfil para este usuario. Contacta al administrador.',
    )
  }

  if (!isUserRole(data.role)) {
    throw new Error('El perfil tiene un rol no válido.')
  }

  return data
}
