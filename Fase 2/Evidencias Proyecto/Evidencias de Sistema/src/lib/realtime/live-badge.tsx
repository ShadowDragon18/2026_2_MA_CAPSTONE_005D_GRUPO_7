import { cn } from '@/lib/utils'
import type { RealtimeStatus } from '@/lib/realtime/types'

export function LiveBadge({
  status,
  className,
}: {
  status: RealtimeStatus
  className?: string
}) {
  if (status !== 'subscribed') {
    return null
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400',
        className,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
      En vivo
    </span>
  )
}
