import { BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface WarrantyButtonProps {
  active: boolean
  disabled?: boolean
  onDarkBackground?: boolean
  onToggle?: () => void
}

export function WarrantyButton({
  active,
  disabled = false,
  onDarkBackground = false,
  onToggle,
}: WarrantyButtonProps) {
  const label = active ? 'Garantía activa' : 'Garantía'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || !onToggle}
            aria-label={label}
            aria-pressed={active}
            onClick={(event) => {
              event.stopPropagation()
              onToggle?.()
            }}
            className={cn(
              onDarkBackground ? 'hover:bg-white/15' : 'hover:bg-black/10',
              active
                ? onDarkBackground
                  ? 'text-emerald-300 hover:text-emerald-300'
                  : 'text-emerald-500 hover:text-emerald-500'
                : onDarkBackground
                  ? 'text-slate-300 hover:text-slate-200'
                  : 'text-slate-400 hover:text-slate-500',
            )}
          >
            <BadgeCheck className="size-5" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
