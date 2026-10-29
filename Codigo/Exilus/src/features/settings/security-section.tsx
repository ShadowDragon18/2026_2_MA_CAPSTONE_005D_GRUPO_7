import { ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  listLoginAttempts,
  markLoginAttemptsReviewed,
} from '@/features/security/api'
import {
  LOGIN_ATTEMPT_REASON_LABELS,
  formatUserAgent,
} from '@/features/security/utils'
import { FormStatus } from '@/features/settings/form-status'
import { useSecurityAlerts } from '@/hooks/use-security-alerts'
import { formatShortDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  EMPTY_LOGIN_ATTEMPT_FILTERS,
  type LoginAttempt,
  type LoginAttemptFilters,
  type LoginAttemptPeriodFilter,
  type LoginAttemptResultFilter,
} from '@/types/login-attempt'

const RESULT_FILTERS: { id: LoginAttemptResultFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'failed', label: 'Fallidos' },
  { id: 'success', label: 'Exitosos' },
  { id: 'blocked', label: 'Bloqueados' },
]

const PERIOD_FILTERS: { id: LoginAttemptPeriodFilter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
]

export function SecuritySection() {
  const { refresh } = useSecurityAlerts()
  const [filters, setFilters] = useState<LoginAttemptFilters>(
    EMPTY_LOGIN_ATTEMPT_FILTERS,
  )
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const loadAttempts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setAttempts(await listLoginAttempts(filters))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar los intentos de acceso.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void loadAttempts()
  }, [loadAttempts])

  async function handleMarkReviewed(ids?: string[]) {
    try {
      const updated = await markLoginAttemptsReviewed(ids)
      setAttempts((current) =>
        current.map((attempt) =>
          !ids || ids.includes(attempt.id)
            ? { ...attempt, isReviewed: true }
            : attempt,
        ),
      )
      await refresh()
      setStatus(
        updated > 0
          ? `${updated} intento${updated === 1 ? '' : 's'} marcado${updated === 1 ? '' : 's'} como revisado${updated === 1 ? '' : 's'}.`
          : 'No había intentos pendientes.',
      )
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'No fue posible marcar los intentos.',
      )
    }
  }

  const unreviewedIds = attempts
    .filter((attempt) => !attempt.success && !attempt.isReviewed)
    .map((attempt) => attempt.id)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Intentos de inicio de sesión</CardTitle>
          <CardDescription>
            Auditoría de accesos a Exilus. Las contraseñas nunca se registran.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          disabled={unreviewedIds.length === 0}
          onClick={() => {
            void handleMarkReviewed(unreviewedIds)
          }}
        >
          Marcar como revisados
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {RESULT_FILTERS.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              selected={filters.result === item.id}
              onClick={() => setFilters((current) => ({ ...current, result: item.id }))}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIOD_FILTERS.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              selected={filters.period === item.id}
              onClick={() =>
                setFilters((current) => ({ ...current, period: item.id }))
              }
            />
          ))}
        </div>

        {status ? <FormStatus tone="success" message={status} /> : null}
        {error ? <FormStatus tone="error" message={error} /> : null}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : attempts.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Sin intentos"
            description="Cuando alguien intente iniciar sesión, el evento aparecerá aquí."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow
                  key={attempt.id}
                  className={cn(
                    !attempt.success &&
                      'bg-destructive/5 hover:bg-destructive/10',
                  )}
                >
                  <TableCell>
                    {formatShortDate(attempt.attemptedAt)}{' '}
                    {formatTime(attempt.attemptedAt)}
                  </TableCell>
                  <TableCell>{attempt.emailAttempted}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium',
                        attempt.success
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
                      )}
                    >
                      {attempt.success ? 'Exitoso' : 'Fallido'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {LOGIN_ATTEMPT_REASON_LABELS[attempt.reason]}
                  </TableCell>
                  <TableCell>{formatUserAgent(attempt.userAgent)}</TableCell>
                  <TableCell>
                    {!attempt.success && !attempt.isReviewed ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          void handleMarkReviewed([attempt.id])
                        }}
                      >
                        Revisar
                      </Button>
                    ) : !attempt.success ? (
                      <span className="text-xs text-muted-foreground">
                        Revisado
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
