import { BadgeCheck } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
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
  formatEyePrescription,
  formatSignedDecimal,
} from '@/features/consultations/utils'
import { getPatientFullName } from '@/features/patients/utils'
import { formatShortDate } from '@/lib/format'
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
    <div className="rounded-xl border border-border bg-card">
      <Table className="min-w-[1280px]">
        <TableHeader>
          <TableRow>
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
            const { patient, consultation } = record

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
                <TableCell>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <BadgeCheck className="size-3.5" />
                    Garantía
                  </span>
                </TableCell>
                <TableCell>{patient.age ?? '—'}</TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {patient.condition || '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatEyePrescription(
                    consultation?.oiSphere ?? null,
                    consultation?.oiCylinder ?? null,
                    consultation?.oiAxis ?? null,
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatEyePrescription(
                    consultation?.odSphere ?? null,
                    consultation?.odCylinder ?? null,
                    consultation?.odAxis ?? null,
                  )}
                </TableCell>
                <TableCell>{consultation?.dp ?? '—'}</TableCell>
                <TableCell>
                  {consultation?.addValue === null ||
                  consultation?.addValue === undefined
                    ? '—'
                    : formatSignedDecimal(consultation.addValue)}
                </TableCell>
                <TableCell>
                  {consultation?.glucoseMgDl === null ||
                  consultation?.glucoseMgDl === undefined
                    ? '—'
                    : `${consultation.glucoseMgDl} mg/dL`}
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {consultation?.medicalObservations ?? '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
