import { MODULE_ROLES, roleCanAccess, type UserRole } from '@/types/roles'

export function canWriteCaptadores(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.captadores)
}

export function canDeleteCaptadores(role: UserRole): boolean {
  return role === 'admin'
}
