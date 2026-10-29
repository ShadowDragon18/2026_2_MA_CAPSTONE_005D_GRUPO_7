import type { UserRole } from '@/types/roles'

export function canViewPrescriptions(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist' || role === 'reception'
}

export function canCreatePrescriptions(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist'
}

export function canEditPrescriptions(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist'
}

export function canDeletePrescriptions(role: UserRole): boolean {
  return role === 'admin'
}

export function canPrintPrescriptions(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist' || role === 'reception'
}

export function canDownloadPrescriptionPdf(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist' || role === 'reception'
}

export function canSendPrescriptionEmail(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist'
}
