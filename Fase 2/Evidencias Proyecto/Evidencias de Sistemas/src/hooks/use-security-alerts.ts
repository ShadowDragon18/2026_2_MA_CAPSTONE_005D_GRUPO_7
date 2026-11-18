import { useContext } from 'react'
import { SecurityAlertsContext } from '@/features/security/security-alerts-context'

export function useSecurityAlerts() {
  const context = useContext(SecurityAlertsContext)

  if (!context) {
    throw new Error(
      'useSecurityAlerts debe usarse dentro de SecurityAlertsProvider.',
    )
  }

  return context
}
