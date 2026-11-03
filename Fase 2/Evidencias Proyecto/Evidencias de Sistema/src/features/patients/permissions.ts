import { MODULE_ROLES, roleCanAccess, type UserRole } from '@/types/roles'

export function canWritePatients(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.patients)
}

export function canDeletePatients(role: UserRole): boolean {
  return role === 'admin'
}

export function canChangePatientColor(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.patients)
}
