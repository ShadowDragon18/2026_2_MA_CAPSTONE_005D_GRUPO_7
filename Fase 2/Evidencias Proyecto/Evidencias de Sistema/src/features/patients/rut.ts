const RUT_BODY_PATTERN = /^[0-9]{7,8}$/

export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function computeRutDv(body: string): string {
  let sum = 0
  let multiplier = 2

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const rest = 11 - (sum % 11)
  if (rest === 11) {
    return '0'
  }
  if (rest === 10) {
    return 'K'
  }
  return String(rest)
}

export function isValidRut(value: string): boolean {
  const cleaned = cleanRut(value)
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false
  }

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  if (!RUT_BODY_PATTERN.test(body)) {
    return false
  }

  return computeRutDv(body) === dv
}

export function formatRut(value: string): string {
  const cleaned = cleanRut(value)
  if (cleaned.length === 0) {
    return ''
  }

  if (cleaned.length === 1) {
    return cleaned
  }

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${withDots}-${dv}`
}
