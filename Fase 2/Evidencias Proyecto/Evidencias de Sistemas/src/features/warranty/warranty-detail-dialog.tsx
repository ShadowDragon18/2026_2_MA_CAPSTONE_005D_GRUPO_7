import { BadgeCheck } from 'lucide-react'
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
import { getPatientFullName } from '@/features/patients/utils'
import { displayValue } from '@/features/warranty/utils'
import { formatShortDate } from '@/lib/format'
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
                Datos de consulta del paciente con garantía activa.
              </DialogDescription>
            </DialogHeader>

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
              <DetailField
                label="Nombre"
                value={getPatientFullName(patient)}
              />
              <DetailField label="Edad" value={displayValue(patient.age)} />
              <DetailField
                label="Condición"
                value={displayValue(patient.condition)}
              />
              <DetailField
                label="OI"
                value={formatEyePrescription(
                  clinical?.oiSphere ?? null,
                  clinical?.oiCylinder ?? null,
                  clinical?.oiAxis ?? null,
                )}
              />
              <DetailField
                label="OD"
                value={formatEyePrescription(
                  clinical?.odSphere ?? null,
                  clinical?.odCylinder ?? null,
                  clinical?.odAxis ?? null,
                )}
              />
              <DetailField
                label="DP"
                value={
                  clinical?.dp === null || clinical?.dp === undefined
                    ? '—'
                    : String(clinical.dp)
                }
              />
              <DetailField
                label="ADD"
                value={
                  clinical?.addValue === null || clinical?.addValue === undefined
                    ? '—'
                    : formatSignedDecimal(clinical.addValue)
                }
              />
              <DetailField
                label="MG/DL"
                value={
                  clinical?.glucoseMgDl === null ||
                  clinical?.glucoseMgDl === undefined
                    ? '—'
                    : `${clinical.glucoseMgDl} mg/dL`
                }
              />
              <div className="sm:col-span-2">
                <DetailField
                  label="Observaciones médicas"
                  value={displayValue(clinical?.medicalObservations)}
                />
              </div>
            </div>
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
