import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { ConsultationFormDialog } from '@/features/consultations/consultation-form-dialog'
import { saveConsultation } from '@/features/consultations/api'
import { canEditConsultations } from '@/features/consultations/permissions'
import type { ConsultationFormValues } from '@/features/consultations/schema'
import { listWarrantyRecords } from '@/features/warranty/api'
import { WarrantyCards } from '@/features/warranty/warranty-cards'
import { WarrantyDetailDialog } from '@/features/warranty/warranty-detail-dialog'
import { WarrantyTable } from '@/features/warranty/warranty-table'
import { WarrantyToolbar } from '@/features/warranty/warranty-toolbar'
import { warrantyToConsultationRecord } from '@/features/warranty/utils'
import { useAuth } from '@/hooks/use-auth'
import { useDebouncedCallback } from '@/lib/realtime/use-debounced-callback'
import { useRealtimeTables } from '@/lib/realtime/use-realtime-tables'
import type { ConsultationRecord } from '@/types/consultation'
import type {
  WarrantyFilters,
  WarrantyRecord,
  WarrantyViewMode,
} from '@/types/warranty'
import { EMPTY_WARRANTY_FILTERS } from '@/types/warranty'

export function WarrantyPage() {
  const { user } = useAuth()
  const canEditPrescription = user ? canEditConsultations(user.role) : false
  const [filters, setFilters] = useState<WarrantyFilters>(EMPTY_WARRANTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<WarrantyViewMode>('table')
  const [records, setRecords] = useState<WarrantyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<WarrantyRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(
    null,
  )

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

  const refetchSilent = useDebouncedCallback(() => {
    void loadRecords({ silent: true })
  }, 250)

  const liveStatus = useRealtimeTables({
    tables: ['patients', 'consultations'],
    onEvent: () => {
      refetchSilent()
    },
  })

  async function handleSavePrescription(values: ConsultationFormValues) {
    if (!editingRecord) {
      return
    }

    try {
      const saved = await saveConsultation(
        editingRecord.patientId,
        editingRecord.consultation?.id ?? null,
        values,
      )
      setRecords((current) =>
        current.map((item) =>
          item.patient.id === saved.patientId
            ? { ...item, consultation: saved.consultation }
            : item,
        ),
      )
      setEditingRecord(null)
      setError(null)
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No fue posible guardar la receta.'
      setError(message)
      throw saveError
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garantía"
        description="Pacientes con garantía activa y sus datos de consulta."
        liveStatus={liveStatus}
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

      {viewMode === 'table' ? (
        <WarrantyTable
          records={records}
          isLoading={isLoading}
          canEditPrescription={canEditPrescription}
          onSelect={setSelected}
          onEditPrescription={(record) => {
            setEditingRecord(warrantyToConsultationRecord(record))
          }}
        />
      ) : (
        <WarrantyCards
          records={records}
          isLoading={isLoading}
          canEditPrescription={canEditPrescription}
          onSelect={setSelected}
          onEditPrescription={(record) => {
            setEditingRecord(warrantyToConsultationRecord(record))
          }}
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

      {canEditPrescription ? (
        <ConsultationFormDialog
          open={editingRecord !== null}
          record={editingRecord}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRecord(null)
            }
          }}
          onSubmit={handleSavePrescription}
        />
      ) : null}
    </div>
  )
}
