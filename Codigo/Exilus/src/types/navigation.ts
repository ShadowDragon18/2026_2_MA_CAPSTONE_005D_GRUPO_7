import type { UserRole } from '@/types/roles'

export type AppRouteId =
  | 'dashboard'
  | 'patients'
  | 'warranty'
  | 'optics'
  | 'captadores'
  | 'consultations'
  | 'prescriptions'
  | 'users'
  | 'audit'
  | 'settings'

export interface NavItem {
  id: AppRouteId
  label: string
  path: string
  roles: UserRole[]
}

export interface NavSection {
  id: 'principal' | 'admin'
  label: string
  items: NavItem[]
}
