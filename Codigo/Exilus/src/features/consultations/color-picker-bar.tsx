import { Plus, X } from 'lucide-react'
import { useRef } from 'react'
import { CONSULTATION_PRESET_COLORS } from '@/features/consultations/colors'
import { cn } from '@/lib/utils'

interface ColorPickerBarProps {
  selectedCount: number
  disabled: boolean
  colors?: readonly string[]
  emptyHint?: string
  selectedHint?: (count: number) => string
  onSelectColor: (color: string | null) => void
}

export function ColorPickerBar({
  selectedCount,
  disabled,
  colors,
  emptyHint = 'Selecciona un paciente para asignar un color',
  selectedHint = (count) =>
    count === 1
      ? '1 paciente seleccionado'
      : `${count} pacientes seleccionados`,
  onSelectColor,
}: ColorPickerBarProps) {
  const paletteRef = useRef<HTMLInputElement>(null)
  const presetColors =
    colors && colors.length > 0
      ? colors
      : CONSULTATION_PRESET_COLORS.map((color) => color.hex)

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {selectedCount === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {selectedHint(selectedCount)}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        {presetColors.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            aria-label={`Color ${hex}`}
            disabled={disabled}
            onClick={() => onSelectColor(hex)}
            className={cn(
              'size-6 rounded-full border border-black/10 shadow-sm transition hover:scale-110',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            style={{ backgroundColor: hex }}
          />
        ))}

        <button
          type="button"
          title="Más colores"
          aria-label="Más colores"
          disabled={disabled}
          onClick={() => paletteRef.current?.click()}
          className={cn(
            'flex size-6 items-center justify-center rounded-full border border-dashed border-border bg-card text-muted-foreground transition hover:text-foreground hover:scale-110',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <Plus className="size-3.5" />
        </button>
        <input
          ref={paletteRef}
          type="color"
          className="sr-only"
          aria-label="Paleta completa de colores"
          onChange={(event) => {
            onSelectColor(event.target.value.toUpperCase())
          }}
        />

        <button
          type="button"
          title="Quitar color"
          aria-label="Quitar color"
          disabled={disabled}
          onClick={() => onSelectColor(null)}
          className={cn(
            'flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
