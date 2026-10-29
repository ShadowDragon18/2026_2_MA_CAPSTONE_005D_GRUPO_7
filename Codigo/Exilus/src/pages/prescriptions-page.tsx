import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { MissingEmailDialog } from '@/features/consultations/missing-email-dialog'
import { logAuditEvent } from '@/features/audit/api'
import {
  createPrescription,
  deletePrescription,
  listPrescriptionCandidates,
  listPrescriptionPatientOptions,
  listPrescriptions,
  updatePrescription,
} from '@/features/prescriptions/api'
import { DeletePrescriptionDialog } from '@/features/prescriptions/delete-prescription-dialog'
import { downloadPrescriptionPdf } from '@/features/prescriptions/pdf'
import {
  canCreatePrescriptions,
  canDeletePrescriptions,
  canDownloadPrescriptionPdf,
  canEditPrescriptions,
  canPrintPrescriptions,
  canSendPrescriptionEmail,
} from '@/features/prescriptions/permissions'
import { PrescriptionFormDialog } from '@/features/prescriptions/prescription-form-dialog'
import { PrescriptionViewDialog } from '@/features/prescriptions/prescription-view-dialog'
import { PrescriptionsTable } from '@/features/prescriptions/prescriptions-table'
import { PrescriptionsToolbar } from '@/features/prescriptions/prescriptions-toolbar'
import { printPrescription } from '@/features/prescriptions/print'
import type { PrescriptionFormValues } from '@/features/prescriptions/schema'
import {
  buildPrescriptionGmailUrl,
  getPrescriptionPatientName,
  isValidPatientEmail,
} from '@/features/prescriptions/utils'
import { useAuth } from '@/hooks/use-auth'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import type {
  Prescription,
  PrescriptionCandidate,
  PrescriptionFilters,
  PrescriptionPatientOption,
} from '@/types/prescription'
import { EMPTY_PRESCRIPTION_FILTERS } from '@/types/prescription'

export function PrescriptionsPage() {
  const { user } = useAuth()
  const { settings } = useClinicSettings()
  const [searchParams, setSearchParams] = useSearchParams()

  const canCreate = user ? canCreatePrescriptions(user.role) : false
  const canEdit = user ? canEditPrescriptions(user.role) : false
  const canDelete = user ? canDeletePrescriptions(user.role) : false
  const canPrint = user ? canPrintPrescriptions(user.role) : false
  const canDownloadPdf = user ? canDownloadPrescriptionPdf(user.role) : false
  const canSendEmail = user ? canSendPrescriptionEmail(user.role) : false

  const [filters, setFilters] = useState<PrescriptionFilters>(
    EMPTY_PRESCRIPTION_FILTERS,
  )
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [records, setRecords] = useState<Prescription[]>([])
  const [patientOptions, setPatientOptions] = useState<
    PrescriptionPatientOption[]
  >([])
  const [candidates, setCandidates] = useState<PrescriptionCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingRecord, setEditingRecord] = useState<Prescription | null>(null)
  const [viewingRecord, setViewingRecord] = useState<Prescription | null>(null)
  const [recordToDelete, setRecordToDelete] = useState<Prescription | null>(null)
  const [presetPatientId, setPresetPatientId] = useState<string | null>(null)
  const [presetConsultationId, setPresetConsultationId] = useState<string | null>(
    null,
  )
  const [missingEmailOpen, setMissingEmailOpen] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search])

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch,
      date: filters.date,
      patientId: filters.patientId,
    }),
    [debouncedSearch, filters.date, filters.patientId],
  )

  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextRecords, nextPatients] = await Promise.all([
        listPrescriptions(queryFilters),
        listPrescriptionPatientOptions(),
      ])
      setRecords(nextRecords)
      setPatientOptions(nextPatients)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar las recetas.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    if (!canCreate) {
      return
    }

    void listPrescriptionCandidates()
      .then(setCandidates)
      .catch(() => {
        setCandidates([])
      })
  }, [canCreate])

  useEffect(() => {
    const patientId = searchParams.get('paciente')
    if (!patientId) {
      return
    }

    const consultationId = searchParams.get('consulta')
    setSearchParams({}, { replace: true })

    if (!canCreate) {
      return
    }

    setFormMode('create')
    setEditingRecord(null)
    setPresetPatientId(patientId)
    setPresetConsultationId(consultationId)
    setFormOpen(true)
  }, [canCreate, searchParams, setSearchParams])

  function openCreate() {
    setFormMode('create')
    setEditingRecord(null)
    setPresetPatientId(null)
    setPresetConsultationId(null)
    setFormOpen(true)
  }

  function openEdit(record: Prescription) {
    setFormMode('edit')
    setEditingRecord(record)
    setPresetPatientId(null)
    setPresetConsultationId(null)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setEditingRecord(null)
      setPresetPatientId(null)
      setPresetConsultationId(null)
    }
  }

  async function handleSave(values: PrescriptionFormValues) {
    try {
      if (formMode === 'edit' && editingRecord) {
        const saved = await updatePrescription(editingRecord.id, values)
        setRecords((current) =>
          current.map((record) => (record.id === saved.id ? saved : record)),
        )
        return
      }

      const saved = await createPrescription(values)
      setRecords((current) => [saved, ...current])
      void listPrescriptionPatientOptions().then(setPatientOptions)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No fue posible guardar la receta.',
      )
      throw saveError
    }
  }

  async function handleConfirmDelete() {
    if (!recordToDelete) {
      return
    }

    try {
      await deletePrescription(recordToDelete.id, recordToDelete.patientId)
      setRecords((current) =>
        current.filter((record) => record.id !== recordToDelete.id),
      )
      setRecordToDelete(null)
      void listPrescriptionPatientOptions().then(setPatientOptions)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No fue posible eliminar la receta.',
      )
    }
  }

  function handlePrint(record: Prescription) {
    try {
      printPrescription(record, settings.clinicName)
      void logAuditEvent({
        action: 'print',
        entityType: 'prescriptions',
        entityId: record.id,
        entityLabel: getPrescriptionPatientName(record),
        description: 'Receta impresa',
      })
    } catch (printError) {
      setError(
        printError instanceof Error
          ? printError.message
          : 'No fue posible abrir la impresión.',
      )
    }
  }

  async function handleDownloadPdf(record: Prescription) {
    try {
      await downloadPrescriptionPdf(record, settings.clinicName)
      await logAuditEvent({
        action: 'pdf',
        entityType: 'prescriptions',
        entityId: record.id,
        entityLabel: getPrescriptionPatientName(record),
        description: 'PDF de receta generado',
      })
    } catch (pdfError) {
      setError(
        pdfError instanceof Error
          ? pdfError.message
          : 'No fue posible descargar el PDF.',
      )
    }
  }

  function handleSendEmail(record: Prescription) {
    if (!isValidPatientEmail(record.email)) {
      setMissingEmailOpen(true)
      return
    }

    window.open(
      buildPrescriptionGmailUrl(record, settings.clinicName),
      '_blank',
      'noopener,noreferrer',
    )
    void logAuditEvent({
      action: 'email',
      entityType: 'prescriptions',
      entityId: record.id,
      entityLabel: getPrescriptionPatientName(record),
      description: 'Receta enviada a Gmail',
    })
  }

  return (
    <div>
      <div className="print:hidden">
      <PageHeader
        title="Recetas"
        description="Emisión y seguimiento de recetas oftalmológicas."
        actions={
          canCreate ? (
            <Button className="rounded-lg" onClick={openCreate}>
              Nueva receta
            </Button>
          ) : null
        }
      />

      <div className="mb-4">
        <PrescriptionsToolbar
          filters={filters}
          patients={patientOptions}
          onFiltersChange={setFilters}
        />
      </div>

      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      <PrescriptionsTable
        records={records}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        canPrint={canPrint}
        canDownloadPdf={canDownloadPdf}
        canSendEmail={canSendEmail}
        onView={setViewingRecord}
        onEdit={openEdit}
        onPrint={handlePrint}
        onDownloadPdf={(record) => {
          void handleDownloadPdf(record)
        }}
        onSendEmail={handleSendEmail}
        onDelete={setRecordToDelete}
      />
      </div>

      {canCreate || canEdit ? (
        <PrescriptionFormDialog
          open={formOpen}
          mode={formMode}
          prescription={editingRecord}
          candidates={candidates}
          presetPatientId={presetPatientId}
          presetConsultationId={presetConsultationId}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleSave}
        />
      ) : null}

      <PrescriptionViewDialog
        prescription={viewingRecord}
        clinicName={settings.clinicName}
        canPrint={canPrint}
        canDownloadPdf={canDownloadPdf}
        canSendEmail={canSendEmail}
        onOpenChange={(open) => {
          if (!open) {
            setViewingRecord(null)
          }
        }}
        onPrint={handlePrint}
        onDownloadPdf={(record) => {
          void handleDownloadPdf(record)
        }}
        onSendEmail={handleSendEmail}
      />

      {canDelete ? (
        <DeletePrescriptionDialog
          prescription={recordToDelete}
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
        description="Agrega un correo en el módulo Pacientes para poder enviar la receta por Gmail."
      />
    </div>
  )
}
