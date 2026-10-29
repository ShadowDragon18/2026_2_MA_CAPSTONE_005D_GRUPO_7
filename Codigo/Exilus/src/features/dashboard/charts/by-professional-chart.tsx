import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/chart-card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartEmpty } from '@/features/dashboard/chart-empty'
import { ChartTooltip } from '@/features/dashboard/chart-tooltip'
import { CHART_COLORS } from '@/lib/constants'
import type { NamedValue } from '@/types/dashboard'

interface ByProfessionalChartProps {
  data: NamedValue[]
  isLoading: boolean
}

export function ByProfessionalChart({
  data,
  isLoading,
}: ByProfessionalChartProps) {
  return (
    <ChartCard
      title="Ópticas"
      description="Ópticas con más pacientes registrados en el período."
      className="min-w-0"
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : data.length === 0 ? (
        <ChartEmpty />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'var(--color-muted)' }}
              />
              <Bar
                dataKey="value"
                name="Pacientes"
                fill={CHART_COLORS.primary}
                radius={[6, 6, 0, 0]}
                barSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
