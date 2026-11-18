import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getPatient } from '@/features/patients/api'
import { PaymentStatusBadge } from '@/features/patients/payment-status-badge'
import {
  getCaptadorName,
  getPatientFullName,
} from '@/features/patients/utils'
import {
  formatCurrency,
  formatDurationMinutes,
  formatShortDate,
  formatTime,
} from '@/lib/format'
import type { Patient } from '@/types/patient'

interface PatientDetailDialogProps {
  patientId: string | null
  fallbackName?: string
  onOpenChange: (open: boolean) => void
}

export function PatientDetailDialog({
  patientId,
  fallbackName,
  onOpenChange,
}: PatientDetailDialogProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) {
      setPatient(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void getPatient(patientId)
      .then((loaded) => {
        if (!cancelled) {
          setPatient(loaded)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setPatient(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar el paciente.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [patientId])

  const title = patient
    ? getPatientFullName(patient)
    : fallbackName || 'Ficha del paciente'

  return (
    <Dialog open={patientId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Datos registrados en el módulo Pacientes.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : patient ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField
              label="Fecha registro"
              value={formatShortDate(patient.registeredAt)}
            />
            <DetailField
              label="Documento"
              value={
                patient.documentNumber
                  ? `${patient.documentType} ${patient.documentNumber}`
                  : patient.documentType
              }
            />
            <DetailField label="Primer nombre" value={display(patient.firstName)} />
            <DetailField
              label="Segundo nombre"
              value={display(patient.middleName)}
            />
            <DetailField
              label="Primer apellido"
              value={display(patient.lastName)}
            />
            <DetailField
              label="Segundo apellido"
              value={display(patient.secondLastName)}
            />
            <DetailField label="Correo" value={display(patient.email)} />
            <DetailField label="Edad" value={display(patient.age)} />
            <DetailField label="Prestación" value={display(patient.benefit)} />
            <DetailField label="Óptica" value={display(patient.opticalName)} />
            <DetailField
              label="Captador"
              value={display(getCaptadorName(patient) || null)}
            />
            <DetailField label="Monto" value={formatCurrency(patient.amount)} />
            <DetailField
              label="Modo de pago"
              value={display(patient.paymentMethod)}
            />
            <div>
              <p className="text-xs text-muted-foreground">Estado de pago</p>
              <div className="mt-1">
                {patient.paymentStatus ? (
                  <PaymentStatusBadge status={patient.paymentStatus} />
                ) : (
                  <p className="text-sm text-foreground">—</p>
                )}
              </div>
            </div>
            <DetailField
              label="H. entrada"
              value={patient.entryTime ? formatTime(patient.entryTime) : '—'}
            />
            <DetailField
              label="H. salida"
              value={patient.exitTime ? formatTime(patient.exitTime) : '—'}
            />
            <DetailField
              label="Promedio"
              value={
                patient.durationMinutes === null
                  ? '—'
                  : formatDurationMinutes(patient.durationMinutes)
              }
            />
            <DetailField
              label="Garantía"
              value={patient.isWarranty ? 'Activa' : 'No'}
            />
            <div className="sm:col-span-2">
              <DetailField
                label="Observación general"
                value={display(patient.generalObservation)}
              />
            </div>
            <div className="sm:col-span-2">
              <DetailField
                label="Condición"
                value={display(patient.condition)}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  )
}
