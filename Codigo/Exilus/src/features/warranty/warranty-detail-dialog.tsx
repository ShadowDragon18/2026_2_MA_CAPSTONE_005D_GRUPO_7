import { BadgeCheck } from 'lucide-react'
import { PaymentStatusBadge } from '@/features/patients/payment-status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatEyePrescription,
  formatSignedDecimal,
} from '@/features/consultations/utils'
import { getCaptadorName, getPatientFullName } from '@/features/patients/utils'
import { displayValue } from '@/features/warranty/utils'
import {
  formatCurrency,
  formatDurationMinutes,
  formatShortDate,
  formatTime,
} from '@/lib/format'
import type { WarrantyRecord } from '@/types/warranty'

interface WarrantyDetailDialogProps {
  record: WarrantyRecord | null
  onOpenChange: (open: boolean) => void
}

export function WarrantyDetailDialog({
  record,
  onOpenChange,
}: WarrantyDetailDialogProps) {
  const patient = record?.patient
  const clinical = record?.consultation

  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {patient ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getPatientFullName(patient)}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 uppercase dark:bg-emerald-950/40 dark:text-emerald-300">
                  <BadgeCheck className="size-3.5" />
                  Garantía
                </span>
              </DialogTitle>
              <DialogDescription>
                Ficha completa del paciente con garantía activa.
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Datos del paciente
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField
                  label="Documento"
                  value={
                    patient.documentNumber
                      ? `${patient.documentType} ${patient.documentNumber}`
                      : patient.documentType
                  }
                />
                <DetailField label="Edad" value={displayValue(patient.age)} />
                <DetailField
                  label="Fecha de registro"
                  value={formatShortDate(patient.registeredAt)}
                />
                <DetailField
                  label="Correo"
                  value={displayValue(patient.email)}
                />
                <DetailField
                  label="Prestación"
                  value={displayValue(patient.benefit)}
                />
                <DetailField
                  label="Condición"
                  value={displayValue(patient.condition)}
                />
                <DetailField
                  label="Captador"
                  value={displayValue(getCaptadorName(patient) || null)}
                />
                <DetailField
                  label="Óptica"
                  value={displayValue(patient.opticalName)}
                />
                <DetailField
                  label="Monto"
                  value={formatCurrency(patient.amount)}
                />
                <DetailField
                  label="Medio de pago"
                  value={displayValue(patient.paymentMethod)}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Estado de pago</p>
                  <div className="mt-1">
                    {patient.paymentStatus ? (
                      <PaymentStatusBadge status={patient.paymentStatus} />
                    ) : (
                      <p className="text-sm">—</p>
                    )}
                  </div>
                </div>
                <DetailField
                  label="Hora de entrada"
                  value={
                    patient.entryTime ? formatTime(patient.entryTime) : '—'
                  }
                />
                <DetailField
                  label="Hora de salida"
                  value={patient.exitTime ? formatTime(patient.exitTime) : '—'}
                />
                <DetailField
                  label="Duración"
                  value={
                    patient.durationMinutes === null
                      ? '—'
                      : formatDurationMinutes(patient.durationMinutes)
                  }
                />
                <div className="sm:col-span-2">
                  <DetailField
                    label="Observación general"
                    value={displayValue(patient.generalObservation)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Datos clínicos
              </h3>
              {clinical ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField
                    label="OI"
                    value={formatEyePrescription(
                      clinical.oiSphere,
                      clinical.oiCylinder,
                      clinical.oiAxis,
                    )}
                  />
                  <DetailField
                    label="OD"
                    value={formatEyePrescription(
                      clinical.odSphere,
                      clinical.odCylinder,
                      clinical.odAxis,
                    )}
                  />
                  <DetailField
                    label="DP"
                    value={formatSignedDecimal(clinical.dp)}
                  />
                  <DetailField
                    label="ADD"
                    value={formatSignedDecimal(clinical.addValue)}
                  />
                  <DetailField
                    label="MG/DL"
                    value={displayValue(clinical.glucoseMgDl)}
                  />
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Observaciones médicas"
                      value={displayValue(clinical.medicalObservations)}
                    />
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Este paciente aún no tiene datos de consulta.
                </p>
              )}
            </section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  )
}
