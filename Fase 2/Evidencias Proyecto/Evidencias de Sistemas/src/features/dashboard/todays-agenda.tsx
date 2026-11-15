import { ChartCard } from '@/components/chart-card'
import { StatusBadge } from '@/components/status-badge'
import { PaymentStatusBadge } from '@/features/patients/payment-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDurationMinutes } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AgendaAppointment } from '@/types/dashboard'

interface TodaysAgendaProps {
  appointments: AgendaAppointment[]
  isLoading: boolean
  averageVisitMinutes: number | null
  className?: string
}

export function TodaysAgenda({
  appointments,
  isLoading,
  averageVisitMinutes,
  className,
}: TodaysAgendaProps) {
  const averageLabel =
    averageVisitMinutes === null
      ? 'Tiempo promedio de atención: sin datos'
      : `Tiempo promedio de atención: ${formatDurationMinutes(averageVisitMinutes)}`

  return (
    <ChartCard
      title="Pacientes de hoy"
      description={averageLabel}
      className={cn(className)}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay pacientes registrados o en atención hoy.
        </p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40"
            >
              <div className="w-14 shrink-0 pt-0.5">
                <p className="text-sm font-semibold text-primary">
                  {appointment.time}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {appointment.patientName}
                  </p>
                  <StatusBadge status={appointment.status} />
                  {appointment.paymentStatus ? (
                    <PaymentStatusBadge status={appointment.paymentStatus} />
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {appointment.reason}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
