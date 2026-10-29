import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { listAuditLogs, listAuditUserOptions } from '@/features/audit/api'
import { AuditDetailDialog } from '@/features/audit/audit-detail-dialog'
import { AuditTable } from '@/features/audit/audit-table'
import { AuditToolbar } from '@/features/audit/audit-toolbar'
import {
  EMPTY_AUDIT_FILTERS,
  type AuditFilters,
  type AuditLog,
  type AuditUserOption,
} from '@/types/audit'

export function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [records, setRecords] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<AuditUserOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<AuditLog | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search])

  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [debouncedSearch, filters],
  )

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.date !== 'all' ||
    filters.userId !== '' ||
    filters.entityType !== 'all' ||
    filters.action !== 'all'

  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextRecords, nextUsers] = await Promise.all([
        listAuditLogs(queryFilters),
        listAuditUserOptions(),
      ])
      setRecords(nextRecords)
      setUsers(nextUsers)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar la auditoría.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Trazabilidad de acciones sobre el sistema y la ficha clínica."
      />

      <div className="mb-4">
        <AuditToolbar
          filters={filters}
          users={users}
          hasActiveFilters={hasActiveFilters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters(EMPTY_AUDIT_FILTERS)}
        />
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <AuditTable records={records} isLoading={isLoading} onView={setViewing} />

      <AuditDetailDialog
        record={viewing}
        onOpenChange={(open) => {
          if (!open) {
            setViewing(null)
          }
        }}
      />
    </div>
  )
}
