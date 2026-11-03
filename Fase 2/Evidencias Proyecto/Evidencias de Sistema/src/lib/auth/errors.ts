import type { AuthError } from '@supabase/supabase-js'

export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) {
    return 'No fue posible iniciar sesión.'
  }

  if (
    error.code === 'invalid_credentials' ||
    error.message.toLowerCase().includes('invalid login credentials')
  ) {
    return 'Correo o contraseña incorrectos.'
  }

  if (error.code === 'email_not_confirmed') {
    return 'Debes confirmar tu correo antes de ingresar.'
  }

  if (error.code === 'too_many_requests') {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  }

  return 'No fue posible iniciar sesión.'
}
