import { BadgeCheck } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PaymentStatusBadge } from '@/features/patients/payment-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPatientFullName } from '@/features/patients/utils'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { WarrantyRecord } from '@/types/warranty'

interface WarrantyTableProps {
  records: WarrantyRecord[]
  isLoading: boolean
  onSelect: (record: WarrantyRecord) => void
}

export function WarrantyTable({
  records,
  isLoading,
  onSelect,
}: WarrantyTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={BadgeCheck}
        title="Sin garantías activas"
        description="Cuando un paciente tenga garantía, su ficha aparecerá aquí."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Edad</TableHead>
          <TableHead>Condición</TableHead>
          <TableHead>Óptica</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Pago</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const { patient } = record

          return (
            <TableRow
              key={patient.id}
              className="cursor-pointer"
              onClick={() => onSelect(record)}
            >
              <TableCell>{formatShortDate(patient.registeredAt)}</TableCell>
              <TableCell>
                {patient.documentNumber
                  ? `${patient.documentType} ${patient.documentNumber}`
                  : patient.documentType}
              </TableCell>
              <TableCell className="font-medium">
                {getPatientFullName(patient)}
              </TableCell>
              <TableCell>{patient.age ?? '—'}</TableCell>
              <TableCell>{patient.condition || '—'}</TableCell>
              <TableCell>{patient.opticalName || '—'}</TableCell>
              <TableCell>{formatCurrency(patient.amount)}</TableCell>
              <TableCell>
                {patient.paymentStatus ? (
                  <PaymentStatusBadge status={patient.paymentStatus} />
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
