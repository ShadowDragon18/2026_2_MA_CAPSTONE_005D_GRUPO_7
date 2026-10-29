import type { UserRole } from '@/types/roles'

export function canEditConsultations(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist'
}

export function canDeleteConsultations(role: UserRole): boolean {
  return role === 'admin'
}

export function canChangeConsultationColor(role: UserRole): boolean {
  return (
    role === 'admin' || role === 'ophthalmologist' || role === 'reception'
  )
}

export function canSendConsultationEmail(role: UserRole): boolean {
  return role === 'admin' || role === 'ophthalmologist'
}

export function canToggleConsultationWarranty(role: UserRole): boolean {
  return (
    role === 'admin' || role === 'ophthalmologist' || role === 'reception'
  )
}

export function canFinishConsultationVisit(role: UserRole): boolean {
  return (
    role === 'admin' || role === 'ophthalmologist' || role === 'reception'
  )
}
