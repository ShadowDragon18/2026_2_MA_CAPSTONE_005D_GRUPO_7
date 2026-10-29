import { ShieldOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getHomePath } from '@/lib/navigation'

export function UnauthorizedPage() {
  const { user } = useAuth()
  const homePath = user ? getHomePath(user.role) : '/login'

  return (
    <EmptyState
      icon={ShieldOff}
      title="No tienes acceso a esta sección"
      description="Tu rol no incluye este módulo. Las restricciones definitivas también se aplicarán con Row Level Security en Supabase."
      action={
        <Button asChild className="rounded-lg">
          <Link to={homePath}>Volver al inicio</Link>
        </Button>
      }
    />
  )
}
