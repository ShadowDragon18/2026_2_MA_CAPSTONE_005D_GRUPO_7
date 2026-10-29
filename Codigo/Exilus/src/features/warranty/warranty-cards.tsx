import { BadgeCheck } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { isDarkHexColor } from '@/features/consultations/colors'
import { getPatientFullName } from '@/features/patients/utils'
import { formatShortDate } from '@/lib/format'
import { cn, getInitials } from '@/lib/utils'
import type { WarrantyRecord } from '@/types/warranty'

interface WarrantyCardsProps {
  records: WarrantyRecord[]
  isLoading: boolean
  onSelect: (record: WarrantyRecord) => void
}

export function WarrantyCards({
  records,
  isLoading,
  onSelect,
}: WarrantyCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-xl" />
        ))}
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => {
        const { patient } = record
        const name = getPatientFullName(patient)
        const color = patient.colorTag
        const darkAccent = Boolean(color && isDarkHexColor(color))

        return (
          <button
            key={patient.id}
            type="button"
            onClick={() => onSelect(record)}
            className={cn(
              'rounded-xl border border-border bg-card p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring',
              color && 'border-l-[5px]',
            )}
            style={color ? { borderLeftColor: color } : undefined}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  darkAccent
                    ? 'text-white'
                    : color
                      ? 'text-black'
                      : 'bg-primary/10 text-primary',
                )}
                style={color ? { backgroundColor: color } : undefined}
              >
                {getInitials(name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {patient.documentNumber
                    ? `${patient.documentType} ${patient.documentNumber}`
                    : patient.documentType}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <BadgeCheck className="size-3.5" />
                Garantía
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Edad</dt>
                <dd>{patient.age ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Registro</dt>
                <dd>{formatShortDate(patient.registeredAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Condición</dt>
                <dd className="truncate">{patient.condition || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Óptica</dt>
                <dd className="truncate">{patient.opticalName || '—'}</dd>
              </div>
            </dl>
          </button>
        )
      })}
    </div>
  )
}
