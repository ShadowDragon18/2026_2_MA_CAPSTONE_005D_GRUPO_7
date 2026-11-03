import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types/dashboard'

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  waiting: {
    label: 'Pendiente',
    className:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  in_progress: {
    label: 'En atención',
    className:
      'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
  },
  completed: {
    label: 'Finalizado',
    className:
      'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
}

interface StatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
