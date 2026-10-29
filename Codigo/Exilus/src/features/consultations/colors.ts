export const CONSULTATION_PRESET_COLORS = [
  { hex: '#2563EB', label: 'Azul' },
  { hex: '#14B8A6', label: 'Teal' },
  { hex: '#22C55E', label: 'Verde' },
  { hex: '#EAB308', label: 'Ámbar' },
  { hex: '#EF4444', label: 'Rojo' },
  { hex: '#8B5CF6', label: 'Violeta' },
] as const

export function isDarkHexColor(hex: string): boolean {
  const value = hex.replace('#', '')
  if (value.length !== 6) {
    return false
  }

  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

  return luminance < 0.55
}
