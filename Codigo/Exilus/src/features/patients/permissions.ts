import type { UserRole } from '@/types/roles'

export function canWritePatients(role: UserRole): boolean {
  return role === 'admin' || role === 'reception'
}

export function canDeletePatients(role: UserRole): boolean {
  return role === 'admin'
}

export function canChangePatientColor(role: UserRole): boolean {
  return (
    role === 'admin' || role === 'ophthalmologist' || role === 'reception'
  )
}
