import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '@/components/full-page-loader'
import { useAuth } from '@/hooks/use-auth'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
