const numberFormatter = new Intl.NumberFormat('es-CL')

const percentFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
  signDisplay: 'always',
})

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatChangePercent(value: number): string {
  return `${percentFormatter.format(value)}%`
}

export function formatLongDate(date: Date): string {
  const formatted = dateFormatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const shortDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatShortDate(value: string): string {
  return shortDateFormatter.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return `${formatShortDate(value)} ${formatTime(value)}`
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(value))
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes} min`
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatMinutesAgo(minutes: number): string {
  if (minutes < 1) {
    return 'Hace un momento'
  }

  if (minutes < 60) {
    return minutes === 1 ? 'Hace 1 minuto' : `Hace ${minutes} minutos`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`
  }

  const days = Math.floor(hours / 24)
  return days === 1 ? 'Hace 1 día' : `Hace ${days} días`
}
