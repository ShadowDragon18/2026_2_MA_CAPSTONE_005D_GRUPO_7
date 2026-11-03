import { MODULE_ROLES, roleCanAccess, type UserRole } from '@/types/roles'

export function canViewDashboardAudit(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewDashboardPayment(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.dashboard)
}

export function canViewDashboardOptical(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.dashboard)
}

export function canViewDashboardClinical(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.consultations)
}
