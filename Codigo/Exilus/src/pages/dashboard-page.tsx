import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { AppointmentsChart } from '@/features/dashboard/charts/appointments-chart'
import { ByProfessionalChart } from '@/features/dashboard/charts/by-professional-chart'
import { NewVsReturningChart } from '@/features/dashboard/charts/new-vs-returning-chart'
import { KpiGrid } from '@/features/dashboard/kpi-grid'
import {
  canViewDashboardAudit,
  canViewDashboardOptical,
  canViewDashboardPayment,
} from '@/features/dashboard/permissions'
import { RecentActivity } from '@/features/dashboard/recent-activity'
import { TodaysAgenda } from '@/features/dashboard/todays-agenda'
import { useAuth } from '@/hooks/use-auth'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import type { PeriodKey } from '@/types/period'

export function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<PeriodKey>('today')
  const { data, isLoading, error } = useDashboardData(period)
  const showAudit = user ? canViewDashboardAudit(user.role) : false
  const showPayment = user ? canViewDashboardPayment(user.role) : false
  const showOptical = user ? canViewDashboardOptical(user.role) : false

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general de la consulta."
        actions={<PeriodFilter value={period} onChange={setPeriod} />}
      />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <KpiGrid
        kpis={data?.kpis}
        isLoading={isLoading}
        showCaptadorPayable={showPayment}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <AppointmentsChart
          data={data?.activityOverTime ?? []}
          isLoading={isLoading}
          className={showPayment ? undefined : 'lg:col-span-3'}
        />
        {showPayment ? (
          <NewVsReturningChart
            data={data?.paymentStatus ?? []}
            isLoading={isLoading}
          />
        ) : null}
      </div>

      {showOptical ? (
        <ByProfessionalChart
          data={data?.byOptical ?? []}
          isLoading={isLoading}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {showAudit ? (
          <RecentActivity
            items={data?.recentActivity ?? []}
            isLoading={isLoading}
          />
        ) : null}
        <TodaysAgenda
          appointments={data?.todaysAgenda ?? []}
          isLoading={isLoading}
          averageVisitMinutes={data?.averageVisitMinutes ?? null}
          className={showAudit ? undefined : 'lg:col-span-2'}
        />
      </div>
    </div>
  )
}
