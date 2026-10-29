import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { listWarrantyRecords } from '@/features/warranty/api'
import { WarrantyCards } from '@/features/warranty/warranty-cards'
import { WarrantyDetailDialog } from '@/features/warranty/warranty-detail-dialog'
import { WarrantyTable } from '@/features/warranty/warranty-table'
import { WarrantyToolbar } from '@/features/warranty/warranty-toolbar'
import type {
  WarrantyFilters,
  WarrantyRecord,
  WarrantyViewMode,
} from '@/types/warranty'
import { EMPTY_WARRANTY_FILTERS } from '@/types/warranty'

export function WarrantyPage() {
  const [filters, setFilters] = useState<WarrantyFilters>(EMPTY_WARRANTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<WarrantyViewMode>('cards')
  const [records, setRecords] = useState<WarrantyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<WarrantyRecord | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search])

  const queryFilters = useMemo(
    () => ({ search: debouncedSearch }),
    [debouncedSearch],
  )

  const loadRecords = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    setError(null)

    try {
      setRecords(await listWarrantyRecords(queryFilters))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar las garantías.',
      )
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }, [queryFilters])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState === 'visible') {
        void loadRecords({ silent: true })
      }
    }

    const intervalId = window.setInterval(refreshIfVisible, 5000)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [loadRecords])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garantía"
        description="Pacientes con garantía activa y su ficha completa."
      />

      <WarrantyToolbar
        filters={filters}
        viewMode={viewMode}
        onFiltersChange={setFilters}
        onViewModeChange={setViewMode}
      />

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {viewMode === 'cards' ? (
        <WarrantyCards
          records={records}
          isLoading={isLoading}
          onSelect={setSelected}
        />
      ) : (
        <WarrantyTable
          records={records}
          isLoading={isLoading}
          onSelect={setSelected}
        />
      )}

      <WarrantyDetailDialog
        record={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
          }
        }}
      />
    </div>
  )
}
