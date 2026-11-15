import type { LoginAttemptReason } from '@/types/login-attempt'

export const LOGIN_ATTEMPT_REASON_LABELS: Record<LoginAttemptReason, string> = {
  success: 'Inicio de sesión correcto',
  invalid_credentials: 'Correo o contraseña incorrectos',
  blocked: 'Acceso bloqueado',
  rate_limited: 'Demasiados intentos',
}

export function formatUserAgent(value: string | null): string {
  if (!value) {
    return '—'
  }

  if (/Edg\//.test(value)) {
    return 'Microsoft Edge'
  }

  if (/Chrome\//.test(value) && !/Chromium/.test(value)) {
    return 'Google Chrome'
  }

  if (/Firefox\//.test(value)) {
    return 'Mozilla Firefox'
  }

  if (/Safari\//.test(value) && !/Chrome\//.test(value)) {
    return 'Safari'
  }

  return value.slice(0, 80)
}
