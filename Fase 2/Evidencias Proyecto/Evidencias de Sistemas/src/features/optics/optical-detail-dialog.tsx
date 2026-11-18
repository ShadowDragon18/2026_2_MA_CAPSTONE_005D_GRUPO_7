import { ContactRound, Users } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CaptadorPaymentStatusBadge } from '@/features/captadores/payment-status-badge'
import { getCaptadorFullName } from '@/features/captadores/utils'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/utils'
import type { Captador } from '@/types/captador'
import type { Optical } from '@/types/optical'

interface OpticalDetailDialogProps {
  optical: Optical | null
  captadores: Captador[]
  isLoading: boolean
  onOpenChange: (open: boolean) => void
}

export function OpticalDetailDialog({
  optical,
  captadores,
  isLoading,
  onOpenChange,
}: OpticalDetailDialogProps) {
  const count = isLoading ? (optical?.captadorCount ?? 0) : captadores.length
  const captadorLabel =
    count === 1
      ? '1 captador asignado a esta óptica'
      : `${count} captadores asignados a esta óptica`

  return (
    <Dialog open={optical !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {optical ? (
          <>
            <DialogHeader>
              <DialogTitle>{optical.name}</DialogTitle>
              <DialogDescription className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {captadorLabel}
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : captadores.length === 0 ? (
              <EmptyState
                icon={ContactRound}
                title="Sin captadores"
                description="Esta óptica todavía no tiene captadores asignados."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {captadores.map((captador) => {
                  const name = getCaptadorFullName(captador)

                  return (
                    <article
                      key={captador.id}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(captador.amount)}
                            </span>
                            <CaptadorPaymentStatusBadge
                              status={captador.paymentStatus}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
