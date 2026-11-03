import { Loader2 } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Cargando {APP_NAME}…</p>
      </div>
    </div>
  )
}
