import { MODULE_ROLES, roleCanAccess, type UserRole } from '@/types/roles'

export function canEditConsultations(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.consultations)
}

export function canDeleteConsultations(role: UserRole): boolean {
  return role === 'admin'
}

export function canChangeConsultationColor(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.consultations)
}

export function canSendConsultationEmail(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.consultations)
}

export function canToggleConsultationWarranty(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.consultations)
}

export function canFinishConsultationVisit(role: UserRole): boolean {
  return roleCanAccess(role, MODULE_ROLES.consultations)
}
