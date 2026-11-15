import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { PatientDetailDialog } from '@/features/patients/patient-detail-dialog'
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
  copyImageToClipboard,
  createConsultationImage,
  downloadConsultationImage,
  getConsultationImageFilename,
} from '@/features/consultations/consultation-image'
import {
  buildGmailComposeUrl,
  getConsultationPatientName,
  isValidPatientEmail,
  sortConsultationsByVisit,
} from '@/features/consultations/utils'
import { useConsultationsRealtime } from '@/features/consultations/use-consultations-realtime'
import { usePatientsRealtime } from '@/features/patients/use-patients-realtime'
import { useDebouncedCallback } from '@/lib/realtime/use-debounced-callback'
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
  const canEdit = user ? canEditConsultations(user.role) : false
  const canDelete = user ? canDeleteConsultations(user.role) : false
  const canChangeColor = user ? canChangeConsultationColor(user.role) : false
  const canSendEmail = user ? canSendConsultationEmail(user.role) : false
  const canToggleWarranty = user
    ? canToggleConsultationWarranty(user.role)
    : false
  const canFinishVisit = user ? canFinishConsultationVisit(user.role) : false

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
  const [viewingRecord, setViewingRecord] = useState<ConsultationRecord | null>(
    null,
  )

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

  const refetchSilent = useDebouncedCallback(() => {
    void loadRecords({ silent: true })
  }, 200)

  const patientsLive = usePatientsRealtime({
    onInsert: (patient) => {
      setRecords((current) => {
        if (current.some((item) => item.patientId === patient.id)) {
          return current
        }

        return sortConsultationsByVisit([
          {
            patientId: patient.id,
            registeredAt: patient.registeredAt,
            documentType: patient.documentType,
            documentNumber: patient.documentNumber,
            firstName: patient.firstName,
            middleName: patient.middleName,
            lastName: patient.lastName,
            secondLastName: patient.secondLastName,
            age: patient.age,
            condition: patient.condition,
            email: patient.email,
            colorTag: patient.colorTag,
            isWarranty: patient.isWarranty,
            entryTime: patient.entryTime,
            exitTime: patient.exitTime,
            consultation: null,
          },
          ...current,
        ])
      })
    },
    onUpdate: (patient) => {
      let exists = false
      setRecords((current) => {
        exists = current.some((item) => item.patientId === patient.id)
        if (!exists) {
          return current
        }

        return sortConsultationsByVisit(
          current.map((item) =>
            item.patientId === patient.id
              ? {
                  ...item,
                  registeredAt: patient.registeredAt,
                  documentType: patient.documentType,
                  documentNumber: patient.documentNumber,
                  firstName: patient.firstName,
                  middleName: patient.middleName,
                  lastName: patient.lastName,
                  secondLastName: patient.secondLastName,
                  age: patient.age,
                  condition: patient.condition,
                  email: patient.email,
                  colorTag: patient.colorTag,
                  isWarranty: patient.isWarranty,
                  entryTime: patient.entryTime,
                  exitTime: patient.exitTime,
                }
              : item,
          ),
        )
      })
      if (!exists) {
        refetchSilent()
      }
    },
    onDelete: (id) => {
      setRecords((current) =>
        current.filter((item) => item.patientId !== id),
      )
    },
  })

  const consultationsLive = useConsultationsRealtime({
    onUpsert: (patientId, clinical) => {
      let exists = false
      setRecords((current) => {
        exists = current.some((item) => item.patientId === patientId)
        if (!exists) {
          return current
        }

        return current.map((item) =>
          item.patientId === patientId ? { ...item, consultation: clinical } : item,
        )
      })
      if (!exists) {
        refetchSilent()
      }
    },
    onDelete: (consultationId) => {
      setRecords((current) =>
        current.map((item) =>
          item.consultation?.id === consultationId
            ? { ...item, consultation: null }
            : item,
        ),
      )
    },
  })

  const liveStatus =
    patientsLive === 'subscribed' || consultationsLive === 'subscribed'
      ? 'subscribed'
      : patientsLive === 'error' || consultationsLive === 'error'
        ? 'error'
        : patientsLive === 'subscribing' || consultationsLive === 'subscribing'
          ? 'subscribing'
          : 'idle'

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
      setError(null)
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

  async function handleSendEmail(record: ConsultationRecord) {
    if (!isValidPatientEmail(record.email)) {
      setMissingEmailOpen(true)
      return
    }

    try {
      const image = await createConsultationImage(record, settings.clinicName)
      downloadConsultationImage(image, getConsultationImageFilename(record))
      await copyImageToClipboard(image).catch(() => undefined)
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : 'No fue posible generar la imagen de la consulta.',
      )
    }

    window.open(buildGmailComposeUrl(record), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consulta"
        description="Datos oftalmológicos de los pacientes registrados."
        liveStatus={liveStatus}
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
        onViewPatient={setViewingRecord}
        canToggleWarranty={canToggleWarranty}
        canFinishVisit={canFinishVisit}
        onEdit={setEditingRecord}
        onDelete={setRecordToDelete}
        onSendEmail={handleSendEmail}
        onToggleWarranty={(record) => {
          void handleToggleWarranty(record)
        }}
        onFinishVisit={(record) => {
          void handleFinishVisit(record)
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

      <PatientDetailDialog
        patientId={viewingRecord?.patientId ?? null}
        fallbackName={
          viewingRecord ? getConsultationPatientName(viewingRecord) : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setViewingRecord(null)
          }
        }}
      />

      <MissingEmailDialog
        open={missingEmailOpen}
        onOpenChange={setMissingEmailOpen}
      />
    </div>
  )
}
