import { logAuditEvent } from '@/features/audit/api'
import { requireSupabase } from '@/lib/supabase/client'
import type { ProfileRow } from '@/lib/supabase/database'

export async function updateOwnFullName(fullName: string): Promise<ProfileRow> {
  const client = requireSupabase()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()

  if (userError || !user) {
    throw new Error('Debes iniciar sesión para actualizar tu perfil.')
  }

  const { data: previous } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const { data, error } = await client
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)
    .select('id, full_name, role, email, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new Error('No fue posible actualizar el nombre.')
  }

  await client.auth.updateUser({
    data: { full_name: fullName.trim() },
  })

  if (previous?.full_name !== data.full_name) {
    await logAuditEvent({
      action: 'update',
      entityType: 'users',
      entityId: data.id,
      entityLabel: data.full_name,
      description: 'Nombre de usuario modificado',
      oldData: { fullName: previous?.full_name ?? null },
      newData: { fullName: data.full_name },
    })
  }

  return data
}

export async function updateOwnPassword(input: {
  email: string
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const client = requireSupabase()
  const { error: verifyError } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.currentPassword,
  })

  if (verifyError) {
    throw new Error('La contraseña actual no es correcta.')
  }

  const { error } = await client.auth.updateUser({
    password: input.newPassword,
  })

  if (error) {
    throw new Error('No fue posible actualizar la contraseña.')
  }
}
