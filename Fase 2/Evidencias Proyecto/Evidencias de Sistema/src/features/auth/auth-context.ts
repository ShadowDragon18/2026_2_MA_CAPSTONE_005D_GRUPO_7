import { createContext } from 'react'
import type { AuthUser } from '@/types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
