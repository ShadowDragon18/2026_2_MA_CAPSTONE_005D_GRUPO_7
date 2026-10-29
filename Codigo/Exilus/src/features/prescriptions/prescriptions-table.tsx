import {
  Download,
  Eye,
  FileText,
  Mail,
  Pencil,
  Printer,
  Trash2,
} from 'lucide-react'
import type { ReactNode } from 'react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatEyePrescription } from '@/features/consultations/utils'
import {
  formatAdd,
  formatDp,
  getPrescriptionDocumentLabel,
  getPrescriptionPatientName,
} from '@/features/prescriptions/utils'
import { formatShortDate } from '@/lib/format'
import type { Prescription } from '@/types/prescription'

interface PrescriptionsTableProps {
  records: Prescription[]
  isLoading: boolean
  canEdit: boolean
  canDelete: boolean
  canPrint: boolean
  canDownloadPdf: boolean
  canSendEmail: boolean
  onView: (record: Prescription) => void
  onEdit: (record: Prescription) => void
  onPrint: (record: Prescription) => void
  onDownloadPdf: (record: Prescription) => void
  onSendEmail: (record: Prescription) => void
  onDelete: (record: Prescription) => void
}

export function PrescriptionsTable({
  records,
  isLoading,
  canEdit,
  canDelete,
  canPrint,
  canDownloadPdf,
  canSendEmail,
  onView,
  onEdit,
  onPrint,
  onDownloadPdf,
  onSendEmail,
  onDelete,
}: PrescriptionsTableProps) {
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
        icon={FileText}
        title="Sin recetas"
        description="Crea una receta a partir de una consulta existente."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>OD</TableHead>
            <TableHead>OI</TableHead>
            <TableHead>DP</TableHead>
            <TableHead>ADD</TableHead>
            <TableHead>Creada por</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{formatShortDate(record.prescriptionDate)}</TableCell>
              <TableCell className="font-medium">
                {getPrescriptionPatientName(record)}
              </TableCell>
              <TableCell>{getPrescriptionDocumentLabel(record)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {`OD  ${formatEyePrescription(
                  record.odSphere,
                  record.odCylinder,
                  record.odAxis,
                )}`}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {`OI  ${formatEyePrescription(
                  record.oiSphere,
                  record.oiCylinder,
                  record.oiAxis,
                )}`}
              </TableCell>
              <TableCell>{formatDp(record.dp)}</TableCell>
              <TableCell>{formatAdd(record.addValue)}</TableCell>
              <TableCell>{record.createdByName ?? '—'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <ActionButton label="Ver" onClick={() => onView(record)}>
                    <Eye />
                  </ActionButton>
                  {canEdit ? (
                    <ActionButton label="Editar" onClick={() => onEdit(record)}>
                      <Pencil />
                    </ActionButton>
                  ) : null}
                  {canPrint ? (
                    <ActionButton
                      label="Imprimir"
                      onClick={() => onPrint(record)}
                    >
                      <Printer />
                    </ActionButton>
                  ) : null}
                  {canDownloadPdf ? (
                    <ActionButton
                      label="Descargar PDF"
                      onClick={() => onDownloadPdf(record)}
                    >
                      <Download />
                    </ActionButton>
                  ) : null}
                  {canSendEmail ? (
                    <ActionButton
                      label="Enviar por correo"
                      onClick={() => onSendEmail(record)}
                    >
                      <Mail />
                    </ActionButton>
                  ) : null}
                  {canDelete ? (
                    <ActionButton
                      label="Borrar"
                      destructive
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 />
                    </ActionButton>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  destructive = false,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={destructive ? 'text-destructive' : undefined}
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
