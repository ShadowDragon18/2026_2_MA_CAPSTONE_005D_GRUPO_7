import { ContactRound, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CaptadorNameChip } from '@/features/captadores/captador-name-chip'
import { CaptadorPaymentStatusBadge } from '@/features/captadores/payment-status-badge'
import { getCaptadorEntryName } from '@/features/captadores/utils'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { CaptadorEntry } from '@/types/captador'

interface CaptadorEntriesTableProps {
  entries: CaptadorEntry[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  selectedIds: Set<string>
  allSelected: boolean
  someSelected: boolean
  onToggleAll: (selected: boolean) => void
  onRowPointerDown: (
    event: { button: number; target: EventTarget | null },
    id: string,
  ) => void
  onRowDragOver: (id: string) => void
  onEdit: (entry: CaptadorEntry) => void
  onDelete: (entry: CaptadorEntry) => void
}

export function CaptadorEntriesTable({
  entries,
  isLoading,
  canWrite,
  canDelete,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onRowPointerDown,
  onRowDragOver,
  onEdit,
  onDelete,
}: CaptadorEntriesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={ContactRound}
        title="Sin captaciones"
        description="Cuando registres un paciente con óptica y captador, aparecerá aquí el mismo día."
      />
    )
  }

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0)
  const unpaidAmount = entries.reduce(
    (sum, entry) =>
      entry.paymentStatus === 'Por pagar' ? sum + entry.amount : sum,
    0,
  )

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 px-3">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Seleccionar todos"
              />
            </TableHead>
            <TableHead>Acciones</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Óptica</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado de pago</TableHead>
            <TableHead>Paciente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const selected = selectedIds.has(entry.id)
            const name = getCaptadorEntryName(entry)

            return (
              <TableRow
                key={entry.id}
                data-state={selected ? 'selected' : undefined}
                onMouseDown={(event) => onRowPointerDown(event, entry.id)}
                onMouseEnter={() => onRowDragOver(entry.id)}
                onMouseOver={() => onRowDragOver(entry.id)}
              >
                <TableCell className="px-3">
                  <Checkbox
                    checked={selected}
                    aria-label={`Seleccionar ${name}`}
                    onPointerDown={(event) => {
                      if (event.button !== 0) {
                        return
                      }

                      event.preventDefault()
                      onRowPointerDown(event, entry.id)
                    }}
                  />
                </TableCell>
                <TableCell data-no-drag>
                  <div className="flex gap-1">
                    {canWrite ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar"
                        onClick={() => onEdit(entry)}
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
                        aria-label="Borrar"
                        onClick={() => onDelete(entry)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatShortDate(entry.occurredAt)}</TableCell>
                <TableCell className="max-w-[18rem] whitespace-normal">
                  <CaptadorNameChip id={entry.captadorId} name={name} />
                </TableCell>
                <TableCell>{entry.opticalName}</TableCell>
                <TableCell>{formatCurrency(entry.amount)}</TableCell>
                <TableCell>
                  <CaptadorPaymentStatusBadge status={entry.paymentStatus} />
                </TableCell>
                <TableCell>{entry.patientName ?? '—'}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>
              {entries.length === 1
                ? '1 captación'
                : `${entries.length} captaciones`}
            </TableCell>
            <TableCell>{formatCurrency(totalAmount)}</TableCell>
            <TableCell colSpan={2}>
              {unpaidAmount > 0
                ? `Por pagar ${formatCurrency(unpaidAmount)}`
                : 'Todo pagado'}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
