import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ROLES = ['admin', 'ophthalmologist', 'reception'] as const
type UserRole = (typeof ALLOWED_ROLES)[number]

interface AdminUserRequest {
  action?: string
  userId?: string
  fullName?: string
  email?: string
  password?: string
  role?: string
  isActive?: boolean
}

interface ProfileRecord {
  id: string
  full_name: string
  role: string
  email: string | null
  is_active: boolean
  created_at: string
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  })
}

function isUserRole(value: string): value is UserRole {
  return ALLOWED_ROLES.includes(value as UserRole)
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Falta la variable ${name} en la Edge Function.`)
  }
  return value
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL')
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ??
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    if (!anonKey) {
      throw new Error('Falta SUPABASE_ANON_KEY o SUPABASE_PUBLISHABLE_KEY.')
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'No autorizado.' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'No autorizado.' }, 401)
    }

    const { data: actor, error: actorError } = await adminClient
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (actorError || !actor || actor.role !== 'admin' || !actor.is_active) {
      return jsonResponse({ error: 'No autorizado.' }, 403)
    }

    const body = (await request.json()) as AdminUserRequest
    const action = body.action

    if (action === 'create') {
      return await createUser(adminClient, body)
    }

    if (action === 'update') {
      return await updateUser(adminClient, user.id, body)
    }

    if (action === 'resetPassword') {
      return await resetPassword(adminClient, body)
    }

    if (action === 'setActive') {
      return await setActive(adminClient, user.id, body)
    }

    if (action === 'delete') {
      return await deleteUser(adminClient, user.id, body)
    }

    return jsonResponse({ error: 'Acción no válida.' }, 400)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No fue posible completar la acción.'
    return jsonResponse({ error: message }, 400)
  }
})

async function countActiveAdmins(
  adminClient: ReturnType<typeof createClient>,
): Promise<number> {
  const { count, error } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('is_active', true)

  if (error) {
    throw new Error('No fue posible verificar los administradores.')
  }

  return count ?? 0
}

async function getProfile(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<ProfileRecord> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, full_name, role, email, is_active, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('No se encontró el usuario.')
  }

  return data as ProfileRecord
}

async function createUser(
  adminClient: ReturnType<typeof createClient>,
  body: AdminUserRequest,
): Promise<Response> {
  const fullName = body.fullName?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''
  const role = body.role ?? ''

  if (fullName.length < 2) {
    return jsonResponse({ error: 'Ingresa el nombre completo.' }, 400)
  }

  if (!email.includes('@')) {
    return jsonResponse({ error: 'Ingresa un correo válido.' }, 400)
  }

  if (password.length < 6) {
    return jsonResponse(
      { error: 'La contraseña temporal debe tener al menos 6 caracteres.' },
      400,
    )
  }

  if (!isUserRole(role)) {
    return jsonResponse({ error: 'Selecciona un rol válido.' }, 400)
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  })

  if (error || !data.user) {
    return jsonResponse(
      { error: error?.message ?? 'No fue posible crear el usuario.' },
      400,
    )
  }

  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: data.user.id,
    full_name: fullName,
    role,
    email,
    is_active: true,
  })

  if (profileError) {
    return jsonResponse(
      { error: 'El usuario se creó, pero no fue posible guardar su perfil.' },
      400,
    )
  }

  return jsonResponse({
    user: {
      id: data.user.id,
      fullName,
      email,
      role,
      isActive: true,
      createdAt: data.user.created_at,
    },
  })
}

async function updateUser(
  adminClient: ReturnType<typeof createClient>,
  actorId: string,
  body: AdminUserRequest,
): Promise<Response> {
  const userId = body.userId
  if (!userId) {
    return jsonResponse({ error: 'Falta el usuario.' }, 400)
  }

  const profile = await getProfile(adminClient, userId)
  const nextName = body.fullName?.trim() ?? profile.full_name
  const nextRole = body.role ?? profile.role

  if (nextName.length < 2) {
    return jsonResponse({ error: 'Ingresa el nombre completo.' }, 400)
  }

  if (!isUserRole(nextRole)) {
    return jsonResponse({ error: 'Selecciona un rol válido.' }, 400)
  }

  if (
    profile.role === 'admin' &&
    nextRole !== 'admin' &&
    (await countActiveAdmins(adminClient)) <= 1
  ) {
    return jsonResponse(
      { error: 'No puedes quitar el último administrador activo.' },
      400,
    )
  }

  if (userId === actorId && nextRole !== 'admin') {
    return jsonResponse(
      { error: 'No puedes quitarte el rol de administrador.' },
      400,
    )
  }

  const { error } = await adminClient
    .from('profiles')
    .update({
      full_name: nextName,
      role: nextRole,
    })
    .eq('id', userId)

  if (error) {
    return jsonResponse({ error: 'No fue posible actualizar el usuario.' }, 400)
  }

  const { error: metadataError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        full_name: nextName,
        role: nextRole,
      },
    },
  )

  if (metadataError) {
    return jsonResponse(
      { error: 'El perfil se actualizó, pero no los metadatos de acceso.' },
      400,
    )
  }

  return jsonResponse({
    user: {
      id: profile.id,
      fullName: nextName,
      email: profile.email ?? '',
      role: nextRole,
      isActive: profile.is_active,
      createdAt: profile.created_at,
    },
  })
}

async function resetPassword(
  adminClient: ReturnType<typeof createClient>,
  body: AdminUserRequest,
): Promise<Response> {
  const userId = body.userId
  const password = body.password ?? ''

  if (!userId) {
    return jsonResponse({ error: 'Falta el usuario.' }, 400)
  }

  if (password.length < 6) {
    return jsonResponse(
      { error: 'La nueva contraseña debe tener al menos 6 caracteres.' },
      400,
    )
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password,
  })

  if (error) {
    return jsonResponse(
      { error: 'No fue posible restablecer la contraseña.' },
      400,
    )
  }

  return jsonResponse({ ok: true })
}

async function setActive(
  adminClient: ReturnType<typeof createClient>,
  actorId: string,
  body: AdminUserRequest,
): Promise<Response> {
  const userId = body.userId
  const isActive = body.isActive

  if (!userId || typeof isActive !== 'boolean') {
    return jsonResponse({ error: 'Faltan datos para actualizar el acceso.' }, 400)
  }

  const profile = await getProfile(adminClient, userId)

  if (userId === actorId && !isActive) {
    return jsonResponse({ error: 'No puedes bloquear tu propio acceso.' }, 400)
  }

  if (
    profile.role === 'admin' &&
    profile.is_active &&
    !isActive &&
    (await countActiveAdmins(adminClient)) <= 1
  ) {
    return jsonResponse(
      { error: 'No puedes bloquear al último administrador activo.' },
      400,
    )
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) {
    return jsonResponse({ error: 'No fue posible actualizar el acceso.' }, 400)
  }

  const { error: banError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      ban_duration: isActive ? 'none' : '876000h',
    },
  )

  if (banError) {
    return jsonResponse(
      {
        error: isActive
          ? 'El perfil se activó, pero no se pudo rehabilitar el acceso.'
          : 'El perfil se bloqueó, pero no se pudo cerrar el acceso de autenticación.',
      },
      400,
    )
  }

  return jsonResponse({
    user: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email ?? '',
      role: profile.role,
      isActive,
      createdAt: profile.created_at,
    },
  })
}

async function deleteUser(
  adminClient: ReturnType<typeof createClient>,
  actorId: string,
  body: AdminUserRequest,
): Promise<Response> {
  const userId = body.userId
  if (!userId) {
    return jsonResponse({ error: 'Falta el usuario.' }, 400)
  }

  if (userId === actorId) {
    return jsonResponse({ error: 'No puedes eliminar tu propio usuario.' }, 400)
  }

  const profile = await getProfile(adminClient, userId)

  if (
    profile.role === 'admin' &&
    profile.is_active &&
    (await countActiveAdmins(adminClient)) <= 1
  ) {
    return jsonResponse(
      { error: 'No puedes eliminar al último administrador activo.' },
      400,
    )
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    return jsonResponse({ error: 'No fue posible eliminar el usuario.' }, 400)
  }

  return jsonResponse({ ok: true })
}
