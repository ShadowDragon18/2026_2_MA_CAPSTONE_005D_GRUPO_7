import { Pipette, Trash2 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HEX_COLOR_PATTERN } from '@/types/clinic'
import { cn } from '@/lib/utils'

interface Hsv {
  h: number
  s: number
  v: number
}

interface ColorPickerFieldProps {
  value: string
  label: string
  canRemove: boolean
  onChange: (color: string) => void
  onRemove: () => void
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

function parseHex(value: string): string | null {
  const hex = value.startsWith('#') ? value : `#${value}`
  if (!HEX_COLOR_PATTERN.test(hex)) {
    return null
  }
  return hex.toUpperCase()
}

function hsvToRgb(hsv: Hsv): { r: number; g: number; b: number } {
  const chroma = hsv.v * hsv.s
  const hue = hsv.h / 60
  const x = chroma * (1 - Math.abs((hue % 2) - 1))
  const m = hsv.v - chroma

  let red = 0
  let green = 0
  let blue = 0

  if (hue >= 0 && hue < 1) {
    red = chroma
    green = x
  } else if (hue < 2) {
    red = x
    green = chroma
  } else if (hue < 3) {
    green = chroma
    blue = x
  } else if (hue < 4) {
    green = x
    blue = chroma
  } else if (hue < 5) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  }
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === red) {
      h = ((green - blue) / delta) % 6
    } else if (max === green) {
      h = (blue - red) / delta + 2
    } else {
      h = (red - green) / delta + 4
    }
    h *= 60
    if (h < 0) {
      h += 360
    }
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hexToHsv(hex: string): Hsv {
  const value = hex.replace('#', '')
  return rgbToHsv(
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  )
}

function hsvToHex(hsv: Hsv): string {
  const { r, g, b } = hsvToRgb(hsv)
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
}

function hueColor(h: number): string {
  return hsvToHex({ h, s: 1, v: 1 })
}

interface EyeDropperApi {
  open: () => Promise<{ sRGBHex: string }>
}

function getEyeDropperConstructor(): (new () => EyeDropperApi) | null {
  const ctor = Reflect.get(window, 'EyeDropper')
  return typeof ctor === 'function' ? (ctor as new () => EyeDropperApi) : null
}

export function ColorPickerField({
  value,
  label,
  canRemove,
  onChange,
  onRemove,
}: ColorPickerFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(parseHex(value) ?? '#2563EB'))
  const [hexInput, setHexInput] = useState(value)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const [eyeDropperAvailable] = useState(() => getEyeDropperConstructor() !== null)
  const hsvRef = useRef(hsv)
  const hex = hsvToHex(hsv)
  hsvRef.current = hsv

  useEffect(() => {
    const next = parseHex(value)
    if (!next || next === hex) {
      return
    }
    setHsv(hexToHsv(next))
    setHexInput(next)
  }, [hex, value])

  useEffect(() => {
    if (!open) {
      return
    }

    function placePanel() {
      const trigger = triggerRef.current
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const width = 272
      const height = 292
      const gap = 8
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - width - 12,
      )
      const below = rect.bottom + gap
      const top =
        below + height > window.innerHeight - 12
          ? Math.max(12, rect.top - height - gap)
          : below

      setPanelStyle({ top, left, width })
    }

    placePanel()
    window.addEventListener('resize', placePanel)
    window.addEventListener('scroll', placePanel, true)

    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', placePanel)
      window.removeEventListener('scroll', placePanel, true)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function commitHsv(next: Hsv) {
    setHsv(next)
    const nextHex = hsvToHex(next)
    setHexInput(nextHex)
    onChange(nextHex)
  }

  function pointerRatio(
    event: ReactPointerEvent<HTMLDivElement>,
  ): { x: number; y: number } {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height),
    }
  }

  function startAreaDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    onMove: (x: number, y: number) => void,
  ) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const { x, y } = pointerRatio(event)
    onMove(x, y)
  }

  async function pickFromScreen() {
    const Constructor = getEyeDropperConstructor()
    if (!Constructor) {
      return
    }
    const dropper = new Constructor()

    try {
      const result = await dropper.open()
      const next = parseHex(result.sRGBHex)
      if (!next) {
        return
      }
      setHsv(hexToHsv(next))
      setHexInput(next)
      onChange(next)
    } catch {
      return
    }
  }

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-2.5">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'size-12 shrink-0 rounded-xl border border-black/10 shadow-sm transition',
          'hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        )}
        style={{ backgroundColor: parseHex(value) ?? hex }}
      />
      <Input
        value={hexInput}
        onChange={(event) => {
          const nextValue = event.target.value.toUpperCase()
          setHexInput(nextValue)
          const next = parseHex(nextValue)
          if (next) {
            setHsv(hexToHsv(next))
            onChange(next)
          }
        }}
        className="h-10 rounded-lg font-mono"
        aria-label={`${label} hexadecimal`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Quitar color"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-50 rounded-2xl border border-border bg-popover p-3 shadow-xl"
              style={panelStyle}
            >
              <div
                className="relative h-40 touch-none cursor-crosshair overflow-hidden rounded-xl"
                onPointerDown={(event) => {
                  startAreaDrag(event, (x, y) => {
                    commitHsv({ ...hsvRef.current, s: x, v: 1 - y })
                  })
                }}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                    return
                  }
                  const { x, y } = pointerRatio(event)
                  commitHsv({ ...hsvRef.current, s: x, v: 1 - y })
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: hueColor(hsv.h) }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #fff, transparent)',
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(to top, #000, transparent)',
                  }}
                />
                <div
                  className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{
                    left: `${hsv.s * 100}%`,
                    top: `${(1 - hsv.v) * 100}%`,
                    backgroundColor: hex,
                  }}
                />
              </div>

              <div
                className="relative mt-3 h-3.5 touch-none cursor-ew-resize rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                }}
                onPointerDown={(event) => {
                  startAreaDrag(event, (x) => {
                    commitHsv({ ...hsvRef.current, h: x * 360 })
                  })
                }}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                    return
                  }
                  const { x } = pointerRatio(event)
                  commitHsv({ ...hsvRef.current, h: x * 360 })
                }}
              >
                <div
                  className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{
                    left: `${(hsv.h / 360) * 100}%`,
                    backgroundColor: hueColor(hsv.h),
                  }}
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className="size-8 rounded-lg border border-black/10"
                  style={{ backgroundColor: hex }}
                />
                <p className="flex-1 font-mono text-sm">{hex}</p>
                {eyeDropperAvailable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Gotero"
                    onClick={() => {
                      void pickFromScreen()
                    }}
                  >
                    <Pipette className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
