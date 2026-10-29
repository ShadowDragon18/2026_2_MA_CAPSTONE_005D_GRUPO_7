import type { UserRole } from '@/types/roles'

export function canViewDashboardAudit(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewDashboardPayment(role: UserRole): boolean {
  return role === 'admin' || role === 'reception'
}

export function canViewDashboardOptical(role: UserRole): boolean {
  return role === 'admin' || role === 'reception'
}

export function canViewDashboardClinical(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist'
}
