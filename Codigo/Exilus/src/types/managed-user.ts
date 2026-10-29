import type { UserRole } from '@/types/roles'

export interface ManagedUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export type AdminUserAction =
  | 'create'
  | 'update'
  | 'resetPassword'
  | 'setActive'
  | 'delete'
