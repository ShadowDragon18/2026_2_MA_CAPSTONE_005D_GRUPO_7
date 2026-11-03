import type { ReactNode } from 'react'
import { LiveBadge } from '@/lib/realtime/live-badge'
import type { RealtimeStatus } from '@/lib/realtime/types'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  liveStatus?: RealtimeStatus
}

export function PageHeader({
  title,
  description,
  actions,
  liveStatus,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {liveStatus ? <LiveBadge status={liveStatus} /> : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
