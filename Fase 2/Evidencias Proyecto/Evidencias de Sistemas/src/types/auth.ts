import type { UserRole } from '@/types/roles'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  remember: boolean
}

export interface AuthSession {
  user: AuthUser
}
