import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import {
  formatChangePercent,
  formatCurrency,
  formatNumber,
} from '@/lib/format'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  changePercent: number
  icon: LucideIcon
  description?: string
  valueFormat?: 'number' | 'currency'
}

export function StatCard({
  title,
  value,
  changePercent,
  icon: Icon,
  description,
  valueFormat = 'number',
}: StatCardProps) {
  const isPositive = changePercent > 0
  const isNegative = changePercent < 0

  return (
    <article className="rounded-xl border border-border bg-card px-5 py-5 transition-colors hover:border-primary/20 sm:px-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 sm:items-center sm:gap-5">
          <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
            {valueFormat === 'currency'
              ? formatCurrency(value)
              : formatNumber(value)}
          </p>
          <p
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium',
              isPositive &&
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
              isNegative &&
                'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
              !isPositive &&
                !isNegative &&
                'bg-muted text-muted-foreground',
            )}
          >
            {isPositive ? <TrendingUp className="size-3.5" /> : null}
            {isNegative ? <TrendingDown className="size-3.5" /> : null}
            <span>
              {formatChangePercent(changePercent)} vs período anterior
            </span>
          </p>
        </div>
      </div>
    </article>
  )
}
