import { FileText, Mail, Pencil, Square, Stethoscope, Trash2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { WarrantyButton } from '@/components/warranty-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isDarkHexColor } from '@/features/consultations/colors'
import {
  formatEyePrescription,
  formatSignedDecimal,
  getConsultationPatientName,
  isVisitInProgress,
} from '@/features/consultations/utils'
import { formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ConsultationRecord } from '@/types/consultation'

interface ConsultationsTableProps {
  records: ConsultationRecord[]
  isLoading: boolean
  canEdit: boolean
  canDelete: boolean
  canSendEmail: boolean
  selectedIds: Set<string>
  allSelected: boolean
  someSelected: boolean
  onToggleAll: (selected: boolean) => void
  onToggleOne: (id: string, selected: boolean) => void
  onSelectRow: (id: string) => void
  canToggleWarranty: boolean
  canFinishVisit: boolean
  canCreatePrescription: boolean
  onEdit: (record: ConsultationRecord) => void
  onDelete: (record: ConsultationRecord) => void
  onSendEmail: (record: ConsultationRecord) => void
  onToggleWarranty: (record: ConsultationRecord) => void
  onFinishVisit: (record: ConsultationRecord) => void
  onCreatePrescription: (record: ConsultationRecord) => void
}

export function ConsultationsTable({
  records,
  isLoading,
  canEdit,
  canDelete,
  canSendEmail,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleOne,
  onSelectRow,
  canToggleWarranty,
  canFinishVisit,
  canCreatePrescription,
  onEdit,
  onDelete,
  onSendEmail,
  onToggleWarranty,
  onFinishVisit,
  onCreatePrescription,
}: ConsultationsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No hay consultas"
        description="Los pacientes creados aparecerán aquí automáticamente."
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table className="min-w-[1280px]">
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
            <TableHead>Fecha registro</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Garantía</TableHead>
            <TableHead>Edad</TableHead>
            <TableHead>Condición</TableHead>
            <TableHead>OI</TableHead>
            <TableHead>OD</TableHead>
            <TableHead>DP</TableHead>
            <TableHead>ADD</TableHead>
            <TableHead>MG/DL</TableHead>
            <TableHead>Observaciones médicas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const selected = selectedIds.has(record.patientId)
            const clinical = record.consultation
            const visitActive = isVisitInProgress(record)
            const rowColor = record.colorTag
            const darkRow = Boolean(rowColor && isDarkHexColor(rowColor))
            const contrastActionClass = darkRow
              ? 'border-white/80 bg-white/15 text-white hover:bg-white/25 hover:text-white'
              : rowColor
                ? 'border-black/40 bg-black/10 text-black hover:bg-black/15 hover:text-black'
                : undefined
            const contrastGhostClass = darkRow
              ? 'text-white hover:bg-white/20 hover:text-white'
              : rowColor
                ? 'text-black hover:bg-black/10 hover:text-black'
                : undefined
            const contrastDeleteClass = darkRow
              ? 'text-white hover:bg-white/20 hover:text-white'
              : 'text-destructive hover:text-destructive'

            return (
              <TableRow
                id={`consultation-${record.patientId}`}
                key={record.patientId}
                data-state={selected ? 'selected' : undefined}
                className={cn(
                  'cursor-pointer',
                  rowColor && 'hover:bg-transparent data-[state=selected]:bg-transparent',
                  darkRow && 'text-white',
                  selected && rowColor && !visitActive && 'ring-2 ring-inset ring-black/35',
                  visitActive && !rowColor && 'bg-amber-50 dark:bg-amber-950/30',
                  visitActive && 'ring-2 ring-inset ring-amber-400',
                )}
                style={rowColor ? { backgroundColor: rowColor } : undefined}
                onClick={() => onSelectRow(record.patientId)}
              >
                <TableCell
                  className="px-3"
                  onClick={(event: MouseEvent) => event.stopPropagation()}
                >
                  <Checkbox
                    checked={selected}
                    aria-label={`Seleccionar ${getConsultationPatientName(record)}`}
                    onCheckedChange={(checked) => {
                      onToggleOne(record.patientId, checked === true)
                    }}
                  />
                </TableCell>
                <TableCell onClick={(event: MouseEvent) => event.stopPropagation()}>
                  <div className="flex gap-1">
                    {canFinishVisit && visitActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn('rounded-lg', contrastActionClass)}
                        onClick={() => onFinishVisit(record)}
                      >
                        <Square className="size-3.5" />
                        Finalizar
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={contrastGhostClass}
                        aria-label={
                          record.consultation ? 'Editar' : 'Registrar consulta'
                        }
                        onClick={() => onEdit(record)}
                      >
                        <Pencil />
                      </Button>
                    ) : null}
                    {canCreatePrescription ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn('rounded-lg', contrastActionClass)}
                        disabled={!record.consultation}
                        onClick={() => onCreatePrescription(record)}
                      >
                        <FileText className="size-3.5" />
                        Crear receta
                      </Button>
                    ) : null}
                    {canSendEmail ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn('rounded-lg', contrastActionClass)}
                        onClick={() => onSendEmail(record)}
                      >
                        <Mail className="size-3.5" />
                        Enviar por correo
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={contrastDeleteClass}
                        aria-label="Borrar"
                        disabled={!record.consultation}
                        onClick={() => onDelete(record)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatShortDate(record.registeredAt)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'block text-xs',
                      darkRow ? 'text-white/80' : 'text-muted-foreground',
                    )}
                  >
                    {record.documentType}
                  </span>
                  <span>{record.documentNumber ?? '—'}</span>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {getConsultationPatientName(record)}
                    {visitActive ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
                          darkRow
                            ? 'bg-amber-300 text-amber-950'
                            : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        En curso
                      </span>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell onClick={(event: MouseEvent) => event.stopPropagation()}>
                  <WarrantyButton
                    active={record.isWarranty}
                    disabled={!canToggleWarranty}
                    onDarkBackground={darkRow}
                    onToggle={
                      canToggleWarranty
                        ? () => onToggleWarranty(record)
                        : undefined
                    }
                  />
                </TableCell>
                <TableCell>{record.age ?? '—'}</TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {record.condition ?? '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {`OI  ${formatEyePrescription(
                    clinical?.oiSphere ?? null,
                    clinical?.oiCylinder ?? null,
                    clinical?.oiAxis ?? null,
                  )}`}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {`OD  ${formatEyePrescription(
                    clinical?.odSphere ?? null,
                    clinical?.odCylinder ?? null,
                    clinical?.odAxis ?? null,
                  )}`}
                </TableCell>
                <TableCell>{clinical?.dp ?? '—'}</TableCell>
                <TableCell>
                  {clinical?.addValue === null || clinical?.addValue === undefined
                    ? '—'
                    : formatSignedDecimal(clinical.addValue)}
                </TableCell>
                <TableCell>
                  {clinical?.glucoseMgDl === null ||
                  clinical?.glucoseMgDl === undefined
                    ? '—'
                    : `${clinical.glucoseMgDl} mg/dL`}
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {clinical?.medicalObservations ?? '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
