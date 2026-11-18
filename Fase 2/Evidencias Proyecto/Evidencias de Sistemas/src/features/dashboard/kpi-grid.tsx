import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/stat-card'
import type { DashboardKpis } from '@/types/dashboard'

interface KpiGridProps {
  kpis?: DashboardKpis
  isLoading: boolean
}

export function KpiGrid({ kpis, isLoading }: KpiGridProps) {
  if (isLoading || !kpis) {
    return <Skeleton className="h-[5.5rem] w-full rounded-xl" />
  }

  return (
    <StatCard
      title="Pacientes registrados"
      description="Cantidad de registros en el período seleccionado."
      value={kpis.patientsRegistered.value}
      changePercent={kpis.patientsRegistered.changePercent}
      icon={Users}
    />
  )
}
