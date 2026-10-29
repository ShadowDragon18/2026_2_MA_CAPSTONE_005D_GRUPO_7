import { createContext } from 'react'
import type { ClinicSettings } from '@/types/clinic'

export interface ClinicSettingsContextValue {
  settings: ClinicSettings
  isLoading: boolean
  refresh: () => Promise<void>
  save: (input: {
    clinicName: string
    defaultAmount: number
    defaultCaptadorAmount: number
    quickColors: string[]
  }) => Promise<void>
}

export const ClinicSettingsContext =
  createContext<ClinicSettingsContextValue | null>(null)
