import {
  ClipboardCheck,
  FileText,
  Pencil,
  UserCog,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { ChartCard } from '@/components/chart-card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMinutesAgo } from '@/lib/format'
import type { ActivityItem, ActivityKind } from '@/types/dashboard'

const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  patient_registered: UserPlus,
  patient_updated: Pencil,
  prescription_issued: FileText,
  consultation_completed: ClipboardCheck,
  user_created: UserCog,
}

interface RecentActivityProps {
  items: ActivityItem[]
  isLoading: boolean
}

export function RecentActivity({ items, isLoading }: RecentActivityProps) {
  return (
    <ChartCard
      title="Actividad reciente"
      description="Últimas acciones registradas en auditoría."
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sin actividad reciente.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const Icon = ACTIVITY_ICONS[item.kind]

            return (
              <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.personName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMinutesAgo(item.minutesAgo)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ChartCard>
  )
}
