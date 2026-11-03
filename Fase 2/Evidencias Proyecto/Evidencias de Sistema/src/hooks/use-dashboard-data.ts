import { useCallback, useEffect, useState } from 'react'
import { getDashboardSnapshot } from '@/features/dashboard/api'
import { useAuth } from '@/hooks/use-auth'
import { useDebouncedCallback } from '@/lib/realtime/use-debounced-callback'
import { useRealtimeTables } from '@/lib/realtime/use-realtime-tables'
import type { RealtimeStatus } from '@/lib/realtime/types'
import type { DashboardSnapshot } from '@/types/dashboard'
import type { PeriodKey } from '@/types/period'

const DASHBOARD_TABLES = [
  'patients',
  'consultations',
  'prescriptions',
  'audit_logs',
] as const

export function useDashboardData(period: PeriodKey): {
  data: DashboardSnapshot | null
  isLoading: boolean
  error: string | null
  liveStatus: RealtimeStatus
} {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSnapshot = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        setData(null)
        setIsLoading(false)
        return
      }

      if (!options?.silent) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const snapshot = await getDashboardSnapshot(period, {
          includeAudit: user.role === 'admin',
        })
        setData(snapshot)
      } catch (loadError: unknown) {
        setData(null)
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible cargar el dashboard.',
        )
      } finally {
        if (!options?.silent) {
          setIsLoading(false)
        }
      }
    },
    [period, user],
  )

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  const refetchSilent = useDebouncedCallback(() => {
    void loadSnapshot({ silent: true })
  }, 300)

  const liveStatus = useRealtimeTables({
    tables: DASHBOARD_TABLES,
    enabled: Boolean(user),
    onEvent: () => {
      refetchSilent()
    },
  })

  return { data, isLoading, error, liveStatus }
}
