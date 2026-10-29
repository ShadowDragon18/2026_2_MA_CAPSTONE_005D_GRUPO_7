import { HandCoins, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/stat-card'
import { formatNumber } from '@/lib/format'
import type { DashboardKpis } from '@/types/dashboard'

interface KpiGridProps {
  kpis?: DashboardKpis
  isLoading: boolean
  showCaptadorPayable?: boolean
}

export function KpiGrid({
  kpis,
  isLoading,
  showCaptadorPayable = false,
}: KpiGridProps) {
  if (isLoading || !kpis) {
    return (
      <div
        className={
          showCaptadorPayable
            ? 'grid gap-4 md:grid-cols-2'
            : undefined
        }
      >
        <Skeleton className="h-[5.5rem] w-full rounded-xl" />
        {showCaptadorPayable ? (
          <Skeleton className="h-[5.5rem] w-full rounded-xl" />
        ) : null}
      </div>
    )
  }

  const captacionesLabel =
    kpis.captadorPayable.unpaidCount === 1
      ? '1 captación por pagar'
      : `${formatNumber(kpis.captadorPayable.unpaidCount)} captaciones por pagar`

  return (
    <div
      className={
        showCaptadorPayable ? 'grid gap-4 md:grid-cols-2' : undefined
      }
    >
      <StatCard
        title="Pacientes registrados"
        description="Cantidad de registros en el período seleccionado."
        value={kpis.patientsRegistered.value}
        changePercent={kpis.patientsRegistered.changePercent}
        icon={Users}
      />
      {showCaptadorPayable ? (
        <StatCard
          title="Por pagar a captadores"
          description={`${captacionesLabel} en el período.`}
          value={kpis.captadorPayable.value}
          changePercent={kpis.captadorPayable.changePercent}
          icon={HandCoins}
          valueFormat="currency"
        />
      ) : null}
    </div>
  )
}
