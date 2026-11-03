export const USER_ROLES = ['admin', 'ophthalmologist', 'reception'] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  ophthalmologist: 'Tecnólogo',
  reception: 'Recepcionista',
}

export const MODULE_ROLES = {
  dashboard: ['admin', 'reception'],
  patients: ['admin', 'reception'],
  agenda: ['admin', 'reception'],
  warranty: ['admin', 'ophthalmologist', 'reception'],
  optics: ['admin', 'reception'],
  captadores: ['admin', 'reception'],
  consultations: ['admin', 'ophthalmologist'],
  settings: ['admin', 'ophthalmologist', 'reception'],
  users: ['admin'],
  audit: ['admin'],
} as const satisfies Record<string, readonly UserRole[]>

export function roleCanAccess(
  role: UserRole,
  allowed: readonly UserRole[],
): boolean {
  return allowed.includes(role)
}
