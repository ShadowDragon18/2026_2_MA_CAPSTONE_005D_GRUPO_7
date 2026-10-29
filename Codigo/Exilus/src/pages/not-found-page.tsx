import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <EmptyState
        icon={SearchX}
        title="Página no encontrada"
        description="La ruta solicitada no existe en Exilus."
        action={
          <Button asChild className="rounded-lg">
            <Link to="/">Ir al inicio</Link>
          </Button>
        }
      />
    </div>
  )
}
