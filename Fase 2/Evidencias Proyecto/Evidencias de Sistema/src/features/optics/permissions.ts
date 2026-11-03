import { MODULE_ROLES, roleCanAccess, type UserRole } from '@/types/roles'

export function canWriteOptics(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.optics)
}

export function canDeleteOptics(role: UserRole): boolean {
  return role === 'admin'
}

export function canChangeOpticalColor(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.optics)
}
