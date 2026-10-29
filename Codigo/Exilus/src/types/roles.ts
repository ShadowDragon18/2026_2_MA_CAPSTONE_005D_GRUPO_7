export const USER_ROLES = ['admin', 'ophthalmologist', 'reception'] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  ophthalmologist: 'Oftalmólogo',
  reception: 'Recepción',
}
