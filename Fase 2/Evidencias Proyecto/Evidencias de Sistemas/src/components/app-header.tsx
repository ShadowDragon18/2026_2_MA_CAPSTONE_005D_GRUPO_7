import { Menu, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useSecurityAlerts } from '@/hooks/use-security-alerts'
import { formatLongDate } from '@/lib/format'
import { useSidebar } from '@/layouts/sidebar-context'

export function AppHeader() {
  const { user } = useAuth()
  const { unreviewedCount } = useSecurityAlerts()
  const { toggleMobile } = useSidebar()
  const todayLabel = formatLongDate(new Date())

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobile}
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
        <div className="lg:hidden">
          <BrandLogo className="rounded-lg" imgClassName="h-8" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user?.role === 'admin' && unreviewedCount > 0 ? (
          <Link
            to="/configuracion/seguridad"
            className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
          >
            <ShieldAlert className="size-3.5" />
            Seguridad
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreviewedCount}
            </span>
          </Link>
        ) : null}
        <p className="hidden text-sm text-muted-foreground sm:block">
          {todayLabel}
        </p>
      </div>
    </header>
  )
}
