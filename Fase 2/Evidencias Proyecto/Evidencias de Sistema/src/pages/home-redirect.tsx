import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getHomePath } from '@/lib/navigation'

export function HomeRedirect() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getHomePath(user.role)} replace />
}
