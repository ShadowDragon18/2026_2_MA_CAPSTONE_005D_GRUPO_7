import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartCard } from '@/components/chart-card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartEmpty } from '@/features/dashboard/chart-empty'
import { ChartTooltip } from '@/features/dashboard/chart-tooltip'
import { CHART_COLORS } from '@/lib/constants'
import type { NamedValue } from '@/types/dashboard'

const SLICE_COLORS = [CHART_COLORS.secondary, CHART_COLORS.quaternary]

interface NewVsReturningChartProps {
  data: NamedValue[]
  isLoading: boolean
}

export function NewVsReturningChart({
  data,
  isLoading,
}: NewVsReturningChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const slices = data.filter((item) => item.value > 0)

  return (
    <ChartCard
      title="Estado de pago"
      description="Pacientes pagados y por pagar en el período."
      className="min-w-0"
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : total === 0 ? (
        <ChartEmpty />
      ) : (
        <div className="flex h-64 flex-col">
          <div className="relative min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                >
                  {slices.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">pacientes</p>
            </div>
          </div>
          <ul className="mt-2 flex justify-center gap-4 text-xs">
            {data.map((item, index) => (
              <li key={item.name} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
                  }}
                />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}
