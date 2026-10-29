import { Glasses, Pencil, Trash2, Users } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isDarkHexColor } from '@/features/consultations/colors'
import { cn, getInitials } from '@/lib/utils'
import type { Optical } from '@/types/optical'

interface OpticalCardsProps {
  optics: Optical[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  canSelect: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string, selected: boolean) => void
  onOpen: (optical: Optical) => void
  onEdit: (optical: Optical) => void
  onDelete: (optical: Optical) => void
}

export function OpticalCards({
  optics,
  isLoading,
  canWrite,
  canDelete,
  canSelect,
  selectedIds,
  onToggleSelect,
  onOpen,
  onEdit,
  onDelete,
}: OpticalCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    )
  }

  if (optics.length === 0) {
    return (
      <EmptyState
        icon={Glasses}
        title="Sin ópticas"
        description="Cuando registres una óptica, aparecerá aquí con sus captadores."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {optics.map((optical) => {
        const color = optical.colorTag
        const darkAccent = Boolean(color && isDarkHexColor(color))
        const selected = selectedIds.has(optical.id)
        const captadorLabel =
          optical.captadorCount === 1
            ? '1 captador'
            : `${optical.captadorCount} captadores`

        return (
          <article
            key={optical.id}
            className={cn(
              'rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md',
              color && 'border-l-[5px]',
              selected && 'ring-2 ring-ring ring-offset-2',
            )}
            style={color ? { borderLeftColor: color } : undefined}
          >
            <div className="flex items-start gap-3">
              {canSelect ? (
                <Checkbox
                  checked={selected}
                  aria-label={`Seleccionar ${optical.name}`}
                  className="mt-1"
                  onCheckedChange={(checked) =>
                    onToggleSelect(optical.id, checked === true)
                  }
                />
              ) : null}
              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(optical)}
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    darkAccent
                      ? 'text-white'
                      : color
                        ? 'text-black'
                        : 'bg-primary/10 text-primary',
                  )}
                  style={color ? { backgroundColor: color } : undefined}
                >
                  {getInitials(optical.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">
                    {optical.name}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="size-3.5" />
                    {captadorLabel}
                  </span>
                </span>
              </button>
              {canWrite || canDelete ? (
                <div className="flex shrink-0 gap-1">
                  {canWrite ? (
                    <CardAction
                      label="Editar"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(optical)
                      }}
                    >
                      <Pencil className="size-4" />
                    </CardAction>
                  ) : null}
                  {canDelete ? (
                    <CardAction
                      label="Borrar"
                      destructive
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(optical)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </CardAction>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function CardAction({
  label,
  destructive = false,
  onClick,
  children,
}: {
  label: string
  destructive?: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={destructive ? 'text-destructive' : undefined}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
