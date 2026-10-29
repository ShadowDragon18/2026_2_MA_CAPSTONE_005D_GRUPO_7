import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/chart-card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartEmpty } from '@/features/dashboard/chart-empty'
import { isActivityEmpty } from '@/features/dashboard/aggregate'
import { ChartTooltip } from '@/features/dashboard/chart-tooltip'
import { CHART_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ActivityPoint } from '@/types/dashboard'

interface AppointmentsChartProps {
  data: ActivityPoint[]
  isLoading: boolean
  className?: string
}

export function AppointmentsChart({
  data,
  isLoading,
  className,
}: AppointmentsChartProps) {
  return (
    <ChartCard
      title="Actividad del período"
      description="Pacientes registrados, consultas y recetas según el período seleccionado."
      className={cn('min-w-0 lg:col-span-2', className)}
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : data.length === 0 || isActivityEmpty(data) ? (
        <ChartEmpty />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'var(--color-border)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="patients"
                name="Pacientes"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="consultations"
                name="Consultas"
                stroke={CHART_COLORS.secondary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="prescriptions"
                name="Recetas"
                stroke={CHART_COLORS.tertiary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
