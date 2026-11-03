interface ChartEmptyProps {
  message?: string
}

export function ChartEmpty({
  message = 'Sin datos en este período.',
}: ChartEmptyProps) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
