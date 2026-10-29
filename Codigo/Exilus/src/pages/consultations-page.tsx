import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { ColorPickerBar } from '@/features/consultations/color-picker-bar'
import { ConsultationFormDialog } from '@/features/consultations/consultation-form-dialog'
import { ConsultationsTable } from '@/features/consultations/consultations-table'
import { ConsultationsToolbar } from '@/features/consultations/consultations-toolbar'
import { DeleteConsultationDialog } from '@/features/consultations/delete-consultation-dialog'
import { MissingEmailDialog } from '@/features/consultations/missing-email-dialog'
import {
  deleteConsultation,
  listConsultationRecords,
  saveConsultation,
  setPatientColorTag,
} from '@/features/consultations/api'
import { finishPatientVisit, setPatientWarranty } from '@/features/patients/api'
import {
  canChangeConsultationColor,
  canDeleteConsultations,
  canEditConsultations,
  canFinishConsultationVisit,
  canSendConsultationEmail,
  canToggleConsultationWarranty,
} from '@/features/consultations/permissions'
import type { ConsultationFormValues } from '@/features/consultations/schema'
import {
  buildGmailComposeUrl,
  isValidPatientEmail,
  sortConsultationsByVisit,
} from '@/features/consultations/utils'
import { canCreatePrescriptions } from '@/features/prescriptions/permissions'
import { useAuth } from '@/hooks/use-auth'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import type {
  ConsultationFilters,
  ConsultationRecord,
} from '@/types/consultation'
import { EMPTY_CONSULTATION_FILTERS } from '@/types/consultation'

export function ConsultationsPage() {
  const { user } = useAuth()
  const { settings } = useClinicSettings()
  const navigate = useNavigate()
  const canEdit = user ? canEditConsultations(user.role) : false
  const canDelete = user ? canDeleteConsultations(user.role) : false
  const canChangeColor = user ? canChangeConsultationColor(user.role) : false
  const canSendEmail = user ? canSendConsultationEmail(user.role) : false
  const canToggleWarranty = user
    ? canToggleConsultationWarranty(user.role)
    : false
  const canFinishVisit = user ? canFinishConsultationVisit(user.role) : false
  const canCreatePrescription = user
    ? canCreatePrescriptions(user.role)
    : false

  const [filters, setFilters] = useState<ConsultationFilters>(
    EMPTY_CONSULTATION_FILTERS,
  )
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(
    null,
  )
  const [recordToDelete, setRecordToDelete] =
    useState<ConsultationRecord | null>(null)
  const [missingEmailOpen, setMissingEmailOpen] = useState(false)

  const rowIds = useMemo(
    () => records.map((record) => record.patientId),
    [records],
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const visibleSelectedIds = useMemo(() => {
    const visible = new Set(rowIds)
    const next = new Set<string>()
    for (const id of selectedIds) {
      if (visible.has(id)) {
        next.add(id)
      }
    }
    return next
  }, [rowIds, selectedIds])

  const selectedCount = visibleSelectedIds.size
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length
  const someSelected = selectedCount > 0 && !allSelected

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search])

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch,
      sort: filters.sort,
    }),
    [debouncedSearch, filters.sort],
  )

  const loadRecords = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    setError(null)

    try {
      setRecords(await listConsultationRecords(queryFilters))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar las consultas.',
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

    const intervalId = window.setInterval(refreshIfVisible, 4000)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [loadRecords])

  function replaceRecord(next: ConsultationRecord) {
    setRecords((current) =>
      current.map((record) =>
        record.patientId === next.patientId ? next : record,
      ),
    )
  }

  async function handleSave(values: ConsultationFormValues) {
    if (!editingRecord) {
      return
    }

    try {
      const saved = await saveConsultation(
        editingRecord.patientId,
        editingRecord.consultation?.id ?? null,
        values,
      )
      replaceRecord(saved)
      setEditingRecord(null)
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No fue posible guardar la consulta.'
      setError(message)
      throw saveError
    }
  }

  async function handleConfirmDelete() {
    if (!recordToDelete?.consultation) {
      return
    }

    try {
      await deleteConsultation(recordToDelete.consultation.id)
      replaceRecord({
        ...recordToDelete,
        consultation: null,
      })
      setRecordToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No fue posible eliminar la consulta.',
      )
    }
  }

  async function handleSelectColor(color: string | null) {
    if (!canChangeColor || visibleSelectedIds.size === 0) {
      return
    }

    const selected = records.filter((record) =>
      visibleSelectedIds.has(record.patientId),
    )

    try {
      const updated = await Promise.all(
        selected.map(async (record) => {
          const colorTag = await setPatientColorTag(record.patientId, color)
          return { ...record, colorTag }
        }),
      )

      const byId = new Map(
        updated.map((record) => [record.patientId, record] as const),
      )
      setRecords((current) =>
        current.map((record) => byId.get(record.patientId) ?? record),
      )
    } catch (colorError) {
      setError(
        colorError instanceof Error
          ? colorError.message
          : 'No fue posible actualizar el color.',
      )
    }
  }

  async function handleFinishVisit(record: ConsultationRecord) {
    try {
      const updated = await finishPatientVisit(record.patientId)
      setRecords((current) =>
        sortConsultationsByVisit(
          current.map((item) =>
            item.patientId === record.patientId
              ? {
                  ...item,
                  entryTime: updated.entryTime,
                  exitTime: updated.exitTime,
                }
              : item,
          ),
        ),
      )
    } catch (visitError) {
      setError(
        visitError instanceof Error
          ? visitError.message
          : 'No fue posible registrar la salida.',
      )
    }
  }

  async function handleToggleWarranty(record: ConsultationRecord) {
    try {
      const updated = await setPatientWarranty(record.patientId, !record.isWarranty)
      replaceRecord({
        ...record,
        isWarranty: updated.isWarranty,
      })
    } catch (warrantyError) {
      setError(
        warrantyError instanceof Error
          ? warrantyError.message
          : 'No fue posible actualizar la garantía.',
      )
    }
  }

  function handleSendEmail(record: ConsultationRecord) {
    if (!isValidPatientEmail(record.email)) {
      setMissingEmailOpen(true)
      return
    }

    window.open(buildGmailComposeUrl(record), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consulta"
        description="Datos oftalmológicos de los pacientes registrados."
        actions={
          canChangeColor ? (
            <ColorPickerBar
              selectedCount={selectedCount}
              disabled={selectedCount === 0}
              colors={settings.quickColors}
              onSelectColor={(color) => {
                void handleSelectColor(color)
              }}
            />
          ) : null
        }
      />

      <ConsultationsToolbar filters={filters} onFiltersChange={setFilters} />

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ConsultationsTable
        records={records}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        canSendEmail={canSendEmail}
        selectedIds={visibleSelectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={(selected) => {
          setSelectedIds(selected ? new Set(rowIds) : new Set())
        }}
        onToggleOne={(id, selected) => {
          setSelectedIds((current) => {
            const next = new Set(current)
            if (selected) {
              next.add(id)
            } else {
              next.delete(id)
            }
            return next
          })
        }}
        onSelectRow={(id) => {
          setSelectedIds(new Set([id]))
        }}
        canToggleWarranty={canToggleWarranty}
        canFinishVisit={canFinishVisit}
        canCreatePrescription={canCreatePrescription}
        onEdit={setEditingRecord}
        onDelete={setRecordToDelete}
        onSendEmail={handleSendEmail}
        onToggleWarranty={(record) => {
          void handleToggleWarranty(record)
        }}
        onFinishVisit={(record) => {
          void handleFinishVisit(record)
        }}
        onCreatePrescription={(record) => {
          if (!record.consultation) {
            return
          }
          navigate(
            `/recetas?paciente=${record.patientId}&consulta=${record.consultation.id}`,
          )
        }}
      />

      {canEdit ? (
        <ConsultationFormDialog
          open={editingRecord !== null}
          record={editingRecord}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRecord(null)
            }
          }}
          onSubmit={handleSave}
        />
      ) : null}

      {canDelete ? (
        <DeleteConsultationDialog
          record={recordToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setRecordToDelete(null)
            }
          }}
          onConfirm={() => {
            void handleConfirmDelete()
          }}
        />
      ) : null}

      <MissingEmailDialog
        open={missingEmailOpen}
        onOpenChange={setMissingEmailOpen}
      />
    </div>
  )
}
