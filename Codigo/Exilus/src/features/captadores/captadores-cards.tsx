import { ContactRound, Pencil, Trash2 } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CaptadorPaymentStatusBadge } from '@/features/captadores/payment-status-badge'
import { getCaptadorFullName } from '@/features/captadores/utils'
import { formatCurrency } from '@/lib/format'
import { cn, getInitials } from '@/lib/utils'
import type { Captador } from '@/types/captador'

interface CaptadoresCardsProps {
  captadores: Captador[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onEdit: (captador: Captador) => void
  onDelete: (captador: Captador) => void
}

export function CaptadoresCards({
  captadores,
  isLoading,
  canWrite,
  canDelete,
  onEdit,
  onDelete,
}: CaptadoresCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  if (captadores.length === 0) {
    return (
      <EmptyState
        icon={ContactRound}
        title="Sin captadores"
        description="Cuando registres un captador, aparecerá aquí con su óptica."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {captadores.map((captador) => {
        const name = getCaptadorFullName(captador)

        return (
          <article
            key={captador.id}
            className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{name}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {captador.opticalName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(captador.amount)}
                  </span>
                  <CaptadorPaymentStatusBadge status={captador.paymentStatus} />
                </div>
              </div>
              {canWrite || canDelete ? (
                <div className="flex shrink-0 gap-1">
                  {canWrite ? (
                    <CardAction label="Editar" onClick={() => onEdit(captador)}>
                      <Pencil className="size-4" />
                    </CardAction>
                  ) : null}
                  {canDelete ? (
                    <CardAction
                      label="Borrar"
                      destructive
                      onClick={() => onDelete(captador)}
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
          className={cn(destructive && 'text-destructive')}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
