import { useContext } from 'react'
import { ClinicSettingsContext } from '@/features/clinic/clinic-settings-context'

export function useClinicSettings() {
  const context = useContext(ClinicSettingsContext)

  if (!context) {
    throw new Error(
      'useClinicSettings debe usarse dentro de ClinicSettingsProvider.',
    )
  }

  return context
}
