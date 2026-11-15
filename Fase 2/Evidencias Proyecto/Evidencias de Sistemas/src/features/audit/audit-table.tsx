import { Eye, ScrollText } from 'lucide-react'
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
import { AuditActionBadge } from '@/features/audit/audit-action-badge'
import { AUDIT_MODULE_LABELS, getAuditRoleLabel } from '@/features/audit/utils'
import { formatDateTime } from '@/lib/format'
import type { AuditLog } from '@/types/audit'

interface AuditTableProps {
  records: AuditLog[]
  isLoading: boolean
  onView: (record: AuditLog) => void
}

export function AuditTable({ records, isLoading, onView }: AuditTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Sin registros"
        description="No hay eventos de auditoría para los filtros seleccionados."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha y hora</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Módulo</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(record.createdAt)}
              </TableCell>
              <TableCell className="font-medium">{record.userName}</TableCell>
              <TableCell>{getAuditRoleLabel(record.userRole)}</TableCell>
              <TableCell>
                <AuditActionBadge action={record.action} />
              </TableCell>
              <TableCell>{AUDIT_MODULE_LABELS[record.entityType]}</TableCell>
              <TableCell>{record.entityLabel ?? '—'}</TableCell>
              <TableCell className="max-w-[280px] truncate">
                {record.description}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ver detalle"
                  onClick={() => onView(record)}
                >
                  <Eye />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
