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
import { getCaptadorEntryName } from '@/features/captadores/utils'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn, getInitials } from '@/lib/utils'
import type { CaptadorDayGroup, CaptadorEntry } from '@/types/captador'

interface CaptadorEntriesCardsProps {
  groups: CaptadorDayGroup[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  onEdit: (entry: CaptadorEntry) => void
  onDelete: (entry: CaptadorEntry) => void
}

export function CaptadorEntriesCards({
  groups,
  isLoading,
  canWrite,
  canDelete,
  onEdit,
  onDelete,
}: CaptadorEntriesCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((__, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={ContactRound}
        title="Sin captaciones"
        description="Cuando registres un paciente con óptica y captador, aparecerá aquí el mismo día."
      />
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.dateKey} className="space-y-3">
          <header className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {group.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {group.entries.length === 1
                  ? '1 captación'
                  : `${group.entries.length} captaciones`}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium text-foreground">
                {formatCurrency(group.totalAmount)}
              </p>
              {group.unpaidAmount > 0 ? (
                <p className="text-muted-foreground">
                  Por pagar {formatCurrency(group.unpaidAmount)}
                </p>
              ) : (
                <p className="text-muted-foreground">Todo pagado</p>
              )}
            </div>
          </header>

          <div className="space-y-6">
            {group.captadores.map((captador) => (
              <div key={captador.captadorId} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {captador.name}
                    <span className="font-normal text-muted-foreground">
                      {' '}
                      · {captador.opticalName} ·{' '}
                      {captador.entries.length === 1
                        ? '1 paciente'
                        : `${captador.entries.length} pacientes`}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {captador.unpaidAmount > 0
                      ? `Por pagar ${formatCurrency(captador.unpaidAmount)}`
                      : formatCurrency(captador.totalAmount)}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {captador.entries.map((entry) => {
                    const name = getCaptadorEntryName(entry)

                    return (
                      <article
                        key={entry.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-foreground">
                              {name}
                            </p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {entry.opticalName}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {entry.patientName
                                ? `Paciente: ${entry.patientName}`
                                : 'Paciente no disponible'}
                              {' · '}
                              {formatTime(entry.occurredAt)}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {formatCurrency(entry.amount)}
                              </span>
                              <CaptadorPaymentStatusBadge
                                status={entry.paymentStatus}
                              />
                            </div>
                          </div>
                          {canWrite || canDelete ? (
                            <div className="flex shrink-0 gap-1">
                              {canWrite ? (
                                <CardAction
                                  label="Editar pago"
                                  onClick={() => onEdit(entry)}
                                >
                                  <Pencil className="size-4" />
                                </CardAction>
                              ) : null}
                              {canDelete ? (
                                <CardAction
                                  label="Borrar"
                                  destructive
                                  onClick={() => onDelete(entry)}
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
              </div>
            ))}
          </div>
        </section>
      ))}
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
