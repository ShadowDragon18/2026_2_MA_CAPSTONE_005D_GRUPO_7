import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getClinicSettings,
  mapClinicSettings,
  updateClinicSettings,
} from '@/features/clinic/api'
import { isFilledRealtimeRow } from '@/lib/realtime/payload'
import { useRealtimeTable } from '@/lib/realtime/use-realtime-table'
import { setCachedClinicSettings } from '@/lib/config/clinic'
import type { ClinicSettingsRow } from '@/lib/supabase/database'
import { ClinicSettingsContext } from '@/features/clinic/clinic-settings-context'
import { useAuth } from '@/hooks/use-auth'
import { FALLBACK_CLINIC_SETTINGS, type ClinicSettings } from '@/types/clinic'

interface ClinicSettingsProviderProps {
  children: ReactNode
}

export function ClinicSettingsProvider({
  children,
}: ClinicSettingsProviderProps) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<ClinicSettings>(
    FALLBACK_CLINIC_SETTINGS,
  )
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setSettings(await getClinicSettings())
    } catch {
      setSettings(FALLBACK_CLINIC_SETTINGS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setSettings(FALLBACK_CLINIC_SETTINGS)
      setIsLoading(false)
      return
    }

    void refresh()
  }, [refresh, user])

  useRealtimeTable({
    table: 'clinic_settings',
    enabled: Boolean(user),
    event: 'UPDATE',
    onEvent: (payload) => {
      if (!isFilledRealtimeRow(payload.new)) {
        return
      }

      const next = mapClinicSettings(payload.new as ClinicSettingsRow)
      setCachedClinicSettings(next)
      setSettings(next)
    },
  })

  const save = useCallback(
    async (input: {
      clinicName: string
      defaultAmount: number
      defaultCaptadorAmount: number
      quickColors: string[]
    }) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para guardar la configuración.')
      }

      setSettings(
        await updateClinicSettings({
          ...input,
          updatedBy: user.id,
        }),
      )
    },
    [user],
  )

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      refresh,
      save,
    }),
    [isLoading, refresh, save, settings],
  )

  return (
    <ClinicSettingsContext.Provider value={value}>
      {children}
    </ClinicSettingsContext.Provider>
  )
}
