import { ContactRound, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CaptadorNameChip } from '@/features/captadores/captador-name-chip'
import { CaptadorPaymentStatusBadge } from '@/features/captadores/payment-status-badge'
import { getCaptadorFullName } from '@/features/captadores/utils'
import { formatCurrency } from '@/lib/format'
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
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
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

  const showActions = canWrite || canDelete

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showActions ? <TableHead>Acciones</TableHead> : null}
            <TableHead>Nombre</TableHead>
            <TableHead>Óptica</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado de pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {captadores.map((captador) => {
            const name = getCaptadorFullName(captador)

            return (
              <TableRow key={captador.id}>
                {showActions ? (
                  <TableCell>
                    <div className="flex gap-1">
                      {canWrite ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${name}`}
                          onClick={() => onEdit(captador)}
                        >
                          <Pencil />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Borrar ${name}`}
                          onClick={() => onDelete(captador)}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
                <TableCell className="max-w-[18rem] whitespace-normal">
                  <CaptadorNameChip id={captador.id} name={name} />
                </TableCell>
                <TableCell className="max-w-[14rem] whitespace-normal">
                  {captador.opticalName}
                </TableCell>
                <TableCell>{formatCurrency(captador.amount)}</TableCell>
                <TableCell>
                  <CaptadorPaymentStatusBadge status={captador.paymentStatus} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
