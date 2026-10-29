import { PERIOD_OPTIONS } from '@/types/period'
import type { PeriodKey } from '@/types/period'
import { cn } from '@/lib/utils'

interface PeriodFilterProps {
  value: PeriodKey
  onChange: (value: PeriodKey) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div
      className="inline-flex max-w-full flex-wrap rounded-xl border border-border bg-card p-1"
      role="group"
      aria-label="Período"
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
