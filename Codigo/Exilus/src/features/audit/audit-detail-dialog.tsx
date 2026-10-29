import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuditActionBadge } from '@/features/audit/audit-action-badge'
import {
  AUDIT_MODULE_LABELS,
  getAuditFieldChanges,
  getAuditRoleLabel,
} from '@/features/audit/utils'
import { formatDateTime } from '@/lib/format'
import type { AuditLog } from '@/types/audit'

interface AuditDetailDialogProps {
  record: AuditLog | null
  onOpenChange: (open: boolean) => void
}

export function AuditDetailDialog({
  record,
  onOpenChange,
}: AuditDetailDialogProps) {
  const changes = record
    ? getAuditFieldChanges(record.oldData, record.newData)
    : []
  const hasBefore = Boolean(record?.oldData)
  const hasAfter = Boolean(record?.newData)

  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalle de auditoría</DialogTitle>
          <DialogDescription>
            Información del evento registrado en el sistema.
          </DialogDescription>
        </DialogHeader>

        {record ? (
          <div className="space-y-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Fecha y hora" value={formatDateTime(record.createdAt)} />
              <DetailItem label="Usuario" value={record.userName} />
              <DetailItem label="Rol" value={getAuditRoleLabel(record.userRole)} />
              <div>
                <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  Acción
                </dt>
                <dd className="mt-1">
                  <AuditActionBadge action={record.action} />
                </dd>
              </div>
              <DetailItem
                label="Módulo"
                value={AUDIT_MODULE_LABELS[record.entityType]}
              />
              <DetailItem label="Registro" value={record.entityLabel ?? '—'} />
            </dl>

            <div>
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Descripción
              </p>
              <p className="mt-1">{record.description}</p>
            </div>

            {changes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {hasBefore ? (
                  <section className="rounded-xl border border-border p-3">
                    <h3 className="mb-2 text-sm font-medium">Antes</h3>
                    <ul className="space-y-1.5">
                      {changes.map((change) => (
                        <li key={`before-${change.key}`}>
                          <span className="text-muted-foreground">{change.label}:</span>{' '}
                          {change.before}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {hasAfter ? (
                  <section className="rounded-xl border border-border p-3">
                    <h3 className="mb-2 text-sm font-medium">
                      {hasBefore ? 'Después' : 'Datos'}
                    </h3>
                    <ul className="space-y-1.5">
                      {changes.map((change) => (
                        <li key={`after-${change.key}`}>
                          <span className="text-muted-foreground">{change.label}:</span>{' '}
                          {change.after}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}
