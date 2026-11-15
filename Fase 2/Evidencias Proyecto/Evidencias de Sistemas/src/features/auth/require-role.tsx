import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import type { UserRole } from '@/types/roles'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return children
}
