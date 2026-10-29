import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { logAuditEvent } from '@/features/audit/api'
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context'
import {
  getLoginThrottle,
  recordLoginAttempt,
} from '@/features/security/api'
import { getAuthErrorMessage } from '@/lib/auth/errors'
import { mapAuthUser } from '@/lib/auth/map-user'
import {
  clearRememberPreference,
  setRememberPreference,
} from '@/lib/auth/storage'
import { requireSupabase, supabase } from '@/lib/supabase/client'
import { getProfileByUserId } from '@/lib/supabase/profiles'
import type { AuthUser } from '@/types/auth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null)
      return
    }

    const profile = await getProfileByUserId(session.user.id)
    if (!profile.is_active) {
      await requireSupabase().auth.signOut()
      setUser(null)
      return
    }

    setUser(mapAuthUser(session.user, profile))
  }, [])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session)
        .catch(() => {
          if (!cancelled) {
            setUser(null)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false)
          }
        })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void applySession(session).catch(() => {
          if (!cancelled) {
            setUser(null)
          }
        })
      }, 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applySession])

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const client = requireSupabase()
      setRememberPreference(remember)

      const throttle = await getLoginThrottle(email)
      if (throttle.isBlocked) {
        await recordLoginAttempt({
          email,
          success: false,
          reason: 'rate_limited',
        })
        await logAuditEvent({
          action: 'block',
          entityType: 'security',
          entityLabel: email,
          description: 'Acceso bloqueado por intentos fallidos',
          actorName: email,
        })
        throw new Error(
          'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.',
        )
      }

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        await recordLoginAttempt({
          email,
          success: false,
          reason: 'invalid_credentials',
        })
        await logAuditEvent({
          action: 'login',
          entityType: 'security',
          entityLabel: email,
          description: 'Login fallido',
          actorName: email,
        })
        throw new Error(
          error?.code === 'too_many_requests'
            ? getAuthErrorMessage(error)
            : 'Correo o contraseña incorrectos.',
        )
      }

      try {
        const profile = await getProfileByUserId(data.user.id)
        if (!profile.is_active) {
          await logAuditEvent({
            action: 'block',
            entityType: 'security',
            entityId: data.user.id,
            entityLabel: profile.full_name || email,
            description: 'Acceso bloqueado',
          })
          await client.auth.signOut()
          setUser(null)
          await recordLoginAttempt({
            email,
            success: false,
            reason: 'blocked',
            userId: data.user.id,
          })
          throw new Error(
            'Tu acceso está bloqueado. Contacta al administrador.',
          )
        }

        await recordLoginAttempt({
          email,
          success: true,
          reason: 'success',
          userId: data.user.id,
        })
        await logAuditEvent({
          action: 'login',
          entityType: 'security',
          entityId: data.user.id,
          entityLabel: profile.full_name || email,
          description: 'Login exitoso',
        })
        setUser(mapAuthUser(data.user, profile))
      } catch (profileError) {
        await client.auth.signOut()
        setUser(null)
        throw profileError
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    if (supabase) {
      await logAuditEvent({
        action: 'logout',
        entityType: 'security',
        entityId: user?.id ?? null,
        entityLabel: user?.fullName ?? user?.email ?? null,
        description: 'Logout',
      })
      await supabase.auth.signOut()
    }

    clearRememberPreference()
    setUser(null)
  }, [user])

  const refreshUser = useCallback(async () => {
    const client = requireSupabase()
    const {
      data: { session },
    } = await client.auth.getSession()
    await applySession(session)
  }, [applySession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
