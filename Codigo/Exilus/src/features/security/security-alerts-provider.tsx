import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getUnreviewedFailedLoginCount } from '@/features/security/api'
import { SecurityAlertsContext } from '@/features/security/security-alerts-context'
import { useAuth } from '@/hooks/use-auth'

interface SecurityAlertsProviderProps {
  children: ReactNode
}

export function SecurityAlertsProvider({
  children,
}: SecurityAlertsProviderProps) {
  const { user } = useAuth()
  const [unreviewedCount, setUnreviewedCount] = useState(0)
  const isAdmin = user?.role === 'admin'

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setUnreviewedCount(0)
      return
    }

    try {
      setUnreviewedCount(await getUnreviewedFailedLoginCount())
    } catch {
      setUnreviewedCount(0)
    }
  }, [isAdmin])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      unreviewedCount,
      refresh,
    }),
    [refresh, unreviewedCount],
  )

  return (
    <SecurityAlertsContext.Provider value={value}>
      {children}
    </SecurityAlertsContext.Provider>
  )
}
