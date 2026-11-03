import { Navigate, Outlet } from 'react-router-dom'
import { FullPageLoader } from '@/components/full-page-loader'
import { useAuth } from '@/hooks/use-auth'
import { getHomePath } from '@/lib/navigation'

export function GuestOnly() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  return <Outlet />
}
