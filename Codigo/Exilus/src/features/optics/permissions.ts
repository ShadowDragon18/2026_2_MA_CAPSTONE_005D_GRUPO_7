import type { UserRole } from '@/types/roles'

export function canWriteOptics(role: UserRole): boolean {
  return role === 'admin' || role === 'reception'
}

export function canDeleteOptics(role: UserRole): boolean {
  return role === 'admin'
}

export function canChangeOpticalColor(role: UserRole): boolean {
  return (
    role === 'admin' || role === 'ophthalmologist' || role === 'reception'
  )
}
