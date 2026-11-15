import { createContext } from 'react'

export interface SecurityAlertsContextValue {
  unreviewedCount: number
  refresh: () => Promise<void>
}

export const SecurityAlertsContext =
  createContext<SecurityAlertsContextValue | null>(null)
