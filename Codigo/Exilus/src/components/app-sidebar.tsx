import {
  BadgeCheck,
  ClipboardList,
  ContactRound,
  FileText,
  Glasses,
  LayoutDashboard,
  ScrollText,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { UserMenu } from '@/components/user-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useSecurityAlerts } from '@/hooks/use-security-alerts'
import { getVisibleSections } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/layouts/sidebar-context'
import type { AppRouteId } from '@/types/navigation'

const NAV_ICONS: Record<AppRouteId, LucideIcon> = {
  dashboard: LayoutDashboard,
  patients: Users,
  warranty: BadgeCheck,
  optics: Glasses,
  captadores: ContactRound,
  consultations: ClipboardList,
  prescriptions: FileText,
  users: UserCog,
  audit: ScrollText,
  settings: Settings,
}

interface AppSidebarProps {
  variant?: 'desktop' | 'drawer'
}

export function AppSidebar({ variant = 'desktop' }: AppSidebarProps) {
  const { user } = useAuth()
  const { closeMobile } = useSidebar()
  const { unreviewedCount } = useSecurityAlerts()

  if (!user) {
    return null
  }

  const sections = getVisibleSections(user.role)

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="p-4">
        <BrandLogo imgClassName="h-11" />
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="space-y-6 px-3 py-5">
          {sections.map((section) => (
            <div key={section.id}>
              <p className="px-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {section.label}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = NAV_ICONS[item.id]

                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        end={item.id !== 'settings' && item.id !== 'users'}
                        onClick={variant === 'drawer' ? closeMobile : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-r-lg border-l-[3px] px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'border-l-primary bg-primary/10 font-medium text-primary'
                              : 'border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.id === 'settings' && unreviewedCount > 0 ? (
                          <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {unreviewedCount}
                          </span>
                        ) : null}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <UserMenu />
      </div>
    </div>
  )
}
