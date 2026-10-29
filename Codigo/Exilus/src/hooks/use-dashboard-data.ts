import { useEffect, useState } from 'react'
import { getDashboardSnapshot } from '@/features/dashboard/api'
import { useAuth } from '@/hooks/use-auth'
import type { DashboardSnapshot } from '@/types/dashboard'
import type { PeriodKey } from '@/types/period'

export function useDashboardData(period: PeriodKey) {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setData(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void getDashboardSnapshot(period, {
      includeAudit: user.role === 'admin',
    })
      .then((snapshot) => {
        if (!cancelled) {
          setData(snapshot)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setData(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar el dashboard.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [period, user])

  return { data, isLoading, error }
}
