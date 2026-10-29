import { logAuditEvent } from '@/features/audit/api'
import { requireSupabase } from '@/lib/supabase/client'
import { isUserRole } from '@/types/roles'
import type { ManagedUser } from '@/types/managed-user'
import type { UserRole } from '@/types/roles'

interface AdminUserResponse {
  error?: string
  ok?: boolean
  user?: {
    id: string
    fullName: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }
}

function mapManagedUser(row: {
  id: string
  full_name: string
  email: string | null
  role: string
  is_active: boolean
  created_at: string
}): ManagedUser {
  if (!isUserRole(row.role)) {
    throw new Error('El usuario tiene un rol no válido.')
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? '',
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

async function getManagedUserSnapshot(
  userId: string,
): Promise<ManagedUser | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  try {
    return mapManagedUser(data)
  } catch {
    return null
  }
}

async function invokeAdminUsers(
  body: Record<string, unknown>,
): Promise<AdminUserResponse> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<AdminUserResponse>(
    'admin-users',
    { body },
  )

  if (data?.error) {
    throw new Error(data.error)
  }

  if (error) {
    throw new Error(error.message || 'No fue posible completar la acción.')
  }

  if (!data) {
    throw new Error('No fue posible completar la acción.')
  }

  return data
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('No fue posible cargar los usuarios.')
  }

  return (data ?? []).map(mapManagedUser)
}

export async function createManagedUser(input: {
  fullName: string
  email: string
  password: string
  role: UserRole
}): Promise<ManagedUser> {
  const result = await invokeAdminUsers({
    action: 'create',
    ...input,
  })

  if (!result.user || !isUserRole(result.user.role)) {
    throw new Error('No fue posible crear el usuario.')
  }

  const created = {
    id: result.user.id,
    fullName: result.user.fullName,
    email: result.user.email,
    role: result.user.role,
    isActive: result.user.isActive,
    createdAt: result.user.createdAt,
  }

  await logAuditEvent({
    action: 'create',
    entityType: 'users',
    entityId: created.id,
    entityLabel: created.fullName,
    description: 'Usuario creado',
    newData: {
      fullName: created.fullName,
      email: created.email,
      role: created.role,
    },
  })

  return created
}

export async function updateManagedUser(input: {
  userId: string
  fullName: string
  role: UserRole
}): Promise<ManagedUser> {
  const previous = await getManagedUserSnapshot(input.userId)
  const result = await invokeAdminUsers({
    action: 'update',
    ...input,
  })

  if (!result.user || !isUserRole(result.user.role)) {
    throw new Error('No fue posible actualizar el usuario.')
  }

  const updated = {
    id: result.user.id,
    fullName: result.user.fullName,
    email: result.user.email,
    role: result.user.role,
    isActive: result.user.isActive,
    createdAt: result.user.createdAt,
  }

  if (previous && previous.fullName !== updated.fullName) {
    await logAuditEvent({
      action: 'update',
      entityType: 'users',
      entityId: updated.id,
      entityLabel: updated.fullName,
      description: 'Nombre de usuario modificado',
      oldData: { fullName: previous.fullName },
      newData: { fullName: updated.fullName },
    })
  }

  if (previous && previous.role !== updated.role) {
    await logAuditEvent({
      action: 'update',
      entityType: 'users',
      entityId: updated.id,
      entityLabel: updated.fullName,
      description: 'Rol de usuario modificado',
      oldData: { role: previous.role },
      newData: { role: updated.role },
    })
  }

  return updated
}

export async function resetManagedUserPassword(input: {
  userId: string
  password: string
}): Promise<void> {
  const previous = await getManagedUserSnapshot(input.userId)
  await invokeAdminUsers({
    action: 'resetPassword',
    ...input,
  })

  await logAuditEvent({
    action: 'update',
    entityType: 'users',
    entityId: input.userId,
    entityLabel: previous?.fullName ?? input.userId,
    description: 'Restablecimiento de acceso',
  })
}

export async function setManagedUserActive(input: {
  userId: string
  isActive: boolean
}): Promise<ManagedUser> {
  const previous = await getManagedUserSnapshot(input.userId)
  const result = await invokeAdminUsers({
    action: 'setActive',
    ...input,
  })

  if (!result.user || !isUserRole(result.user.role)) {
    throw new Error('No fue posible actualizar el acceso.')
  }

  const updated = {
    id: result.user.id,
    fullName: result.user.fullName,
    email: result.user.email,
    role: result.user.role,
    isActive: result.user.isActive,
    createdAt: result.user.createdAt,
  }

  await logAuditEvent({
    action: updated.isActive ? 'unblock' : 'block',
    entityType: 'users',
    entityId: updated.id,
    entityLabel: updated.fullName,
    description: updated.isActive ? 'Usuario desbloqueado' : 'Usuario bloqueado',
    oldData: { isActive: previous?.isActive ?? !updated.isActive },
    newData: { isActive: updated.isActive },
  })

  return updated
}

export async function deleteManagedUser(userId: string): Promise<void> {
  await invokeAdminUsers({
    action: 'delete',
    userId,
  })
}
