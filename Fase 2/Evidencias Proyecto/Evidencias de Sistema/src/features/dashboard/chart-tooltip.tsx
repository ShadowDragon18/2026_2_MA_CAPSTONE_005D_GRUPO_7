interface TooltipItem {
  name?: string
  value?: number
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  valueSuffix?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-foreground">{label}</p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium text-foreground">
              {item.value}
              {valueSuffix ? ` ${valueSuffix}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
