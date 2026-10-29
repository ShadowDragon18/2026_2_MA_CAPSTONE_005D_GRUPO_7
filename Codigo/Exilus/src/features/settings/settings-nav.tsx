import {
  Lock,
  Palette,
  ShieldAlert,
  UserRound,
  Users,
  Building2,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSecurityAlerts } from '@/hooks/use-security-alerts'
import { cn } from '@/lib/utils'

const COMMON_ITEMS = [
  { to: '/configuracion/perfil', label: 'Mi perfil', icon: UserRound },
  { to: '/configuracion/apariencia', label: 'Apariencia', icon: Palette },
] as const

const ADMIN_ITEMS = [
  { to: '/configuracion/clinica', label: 'Clínica', icon: Building2 },
  { to: '/configuracion/usuarios', label: 'Usuarios', icon: Users },
  {
    to: '/configuracion/seguridad',
    label: 'Seguridad',
    icon: ShieldAlert,
    badge: true,
  },
  {
    to: '/configuracion/accesos-bloqueados',
    label: 'Accesos bloqueados',
    icon: Lock,
  },
] as const

export function SettingsNav() {
  const { user } = useAuth()
  const { unreviewedCount } = useSecurityAlerts()
  const items =
    user?.role === 'admin' ? [...COMMON_ITEMS, ...ADMIN_ITEMS] : COMMON_ITEMS

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const Icon = item.icon
        const showBadge = 'badge' in item && item.badge && unreviewedCount > 0

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {showBadge ? (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreviewedCount}
              </span>
            ) : null}
          </NavLink>
        )
      })}
    </nav>
  )
}
