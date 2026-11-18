import { captadorNameStyle } from '@/features/captadores/utils'
import { cn } from '@/lib/utils'

export function CaptadorNameChip({
  id,
  name,
  className,
}: {
  id: string
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block max-w-full rounded-md px-2 py-0.5 font-medium break-words whitespace-normal',
        className,
      )}
      style={captadorNameStyle(id)}
    >
      {name}
    </span>
  )
}
