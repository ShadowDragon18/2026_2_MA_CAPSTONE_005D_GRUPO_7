import type { UserRole } from '@/types/roles'

export function canWriteCaptadores(role: UserRole): boolean {
  return role === 'admin' || role === 'reception'
}

export function canDeleteCaptadores(role: UserRole): boolean {
  return role === 'admin'
}
