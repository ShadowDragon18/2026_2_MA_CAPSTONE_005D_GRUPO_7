import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/chart-card'
import { Skeleton } from '@/components/ui/skeleton'
import { isEarningsEmpty } from '@/features/dashboard/aggregate'
import { ChartEmpty } from '@/features/dashboard/chart-empty'
import { CHART_COLORS } from '@/lib/constants'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { ChartPoint } from '@/types/dashboard'

interface EarningsChartProps {
  data: ChartPoint[]
  total: number
  isLoading: boolean
}

function EarningsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string | number
}) {
  if (!active || !payload?.length) {
    return null
  }

  const value = payload[0]?.value ?? 0

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-foreground">{label}</p>
      ) : null}
      <p className="font-medium text-foreground">{formatCurrency(value)}</p>
      <p className="text-muted-foreground">Ganancia acumulada</p>
    </div>
  )
}

export function EarningsChart({
  data,
  total,
  isLoading,
}: EarningsChartProps) {
  return (
    <ChartCard
      title="Ganancias"
      description="Suma de montos pagados en el período seleccionado."
      className="min-w-0"
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : data.length === 0 || isEarningsEmpty(data) ? (
        <ChartEmpty message="Sin pagos en este período" />
      ) : (
        <div className="flex h-64 flex-col">
          <div className="mb-2">
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(total)}
            </p>
            <p className="text-xs text-muted-foreground">
              Ganancia del período
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickFormatter={(value: number) => formatNumber(value)}
                  width={52}
                />
                <Tooltip content={<EarningsTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Ganancia"
                  stroke={CHART_COLORS.secondary}
                  fill={CHART_COLORS.secondary}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
