import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ColorPickerBar } from '@/features/consultations/color-picker-bar'
import {
  createPatient,
  deletePatient,
  finishPatientVisit,
  listOpticalNames,
  listPatients,
  setPatientColor,
  setPatientWarranty,
  startPatientVisit,
  updatePatient,
  updatePatientVisitTimes,
} from '@/features/patients/api'
import { DeletePatientDialog } from '@/features/patients/delete-patient-dialog'
import { PatientFormDialog } from '@/features/patients/patient-form-dialog'
import { StartNewVisitDialog } from '@/features/patients/start-new-visit-dialog'
import {
  canChangePatientColor,
  canDeletePatients,
  canWritePatients,
} from '@/features/patients/permissions'
import { PatientsTable } from '@/features/patients/patients-table'
import { PatientsToolbar } from '@/features/patients/patients-toolbar'
import type { PatientFormValues } from '@/features/patients/schema'
import { useDragSelection } from '@/features/patients/use-drag-selection'
import { useAuth } from '@/hooks/use-auth'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import type { Patient, PatientFilters } from '@/types/patient'
import { EMPTY_PATIENT_FILTERS } from '@/types/patient'

export function PatientsPage() {
  const { user } = useAuth()
  const { settings } = useClinicSettings()
  const canWrite = user ? canWritePatients(user.role) : false
  const canDelete = user ? canDeletePatients(user.role) : false
  const canChangeColor = user ? canChangePatientColor(user.role) : false

  const [filters, setFilters] = useState<PatientFilters>(EMPTY_PATIENT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [opticalNames, setOpticalNames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [patientToRestart, setPatientToRestart] = useState<Patient | null>(null)

  const rowIds = useMemo(() => patients.map((patient) => patient.id), [patients])
  const selection = useDragSelection(rowIds)

  const hasActiveFilters =
    filters.search !== '' ||
    filters.date !== 'all' ||
    filters.opticalName !== '' ||
    filters.paymentStatus !== 'all' ||
    filters.completion !== 'all'

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
      opticalName: filters.opticalName,
      paymentStatus: filters.paymentStatus,
      completion: filters.completion,
    }),
    [
      debouncedSearch,
      filters.date,
      filters.opticalName,
      filters.paymentStatus,
      filters.completion,
    ],
  )

  const loadPatients = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextPatients, nextOpticals] = await Promise.all([
        listPatients(queryFilters),
        listOpticalNames(),
      ])
      setPatients(nextPatients)
      setOpticalNames(nextOpticals)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar los pacientes.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  function replacePatient(next: Patient) {
    setPatients((current) =>
      current.map((patient) => (patient.id === next.id ? next : patient)),
    )
  }

  async function handleCreate(values: PatientFormValues) {
    try {
      await createPatient(values)
      await loadPatients()
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : 'No fue posible crear el paciente.'
      setError(message)
      throw createError
    }
  }

  async function handleUpdate(values: PatientFormValues) {
    if (!editingPatient) {
      return
    }

    try {
      const updated = await updatePatient(
        editingPatient.id,
        values,
        editingPatient,
      )
      replacePatient(updated)
      setEditingPatient(null)
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : 'No fue posible actualizar el paciente.'
      setError(message)
      throw updateError
    }
  }

  async function handleConfirmDelete() {
    if (!patientToDelete) {
      return
    }

    try {
      await deletePatient(patientToDelete.id)
      setPatients((current) =>
        current.filter((patient) => patient.id !== patientToDelete.id),
      )
      setPatientToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No fue posible eliminar el paciente.',
      )
    }
  }

  async function handleStartVisit(patient: Patient) {
    try {
      replacePatient(await startPatientVisit(patient.id))
      setPatientToRestart(null)
    } catch (visitError) {
      setError(
        visitError instanceof Error
          ? visitError.message
          : 'No fue posible registrar la entrada.',
      )
      setPatientToRestart(null)
    }
  }

  async function handleFinishVisit(patient: Patient) {
    try {
      replacePatient(await finishPatientVisit(patient.id))
    } catch (visitError) {
      setError(
        visitError instanceof Error
          ? visitError.message
          : 'No fue posible registrar la salida.',
      )
    }
  }

  async function handleVisitTimesChange(
    patient: Patient,
    times: { entryTime: string | null; exitTime: string | null },
  ) {
    try {
      replacePatient(await updatePatientVisitTimes(patient.id, times))
    } catch (timeError) {
      setError(
        timeError instanceof Error
          ? timeError.message
          : 'No fue posible actualizar las horas.',
      )
    }
  }

  async function handleSelectColor(color: string | null) {
    if (!canChangeColor || selection.selectedCount === 0) {
      return
    }

    const selected = patients.filter((patient) =>
      selection.selectedIds.has(patient.id),
    )

    try {
      const updated = await Promise.all(
        selected.map((patient) => setPatientColor(patient.id, color)),
      )
      const byId = new Map(updated.map((patient) => [patient.id, patient] as const))
      setPatients((current) =>
        current.map((patient) => byId.get(patient.id) ?? patient),
      )
    } catch (colorError) {
      setError(
        colorError instanceof Error
          ? colorError.message
          : 'No fue posible actualizar el color.',
      )
    }
  }

  async function handleToggleWarranty(patient: Patient) {
    try {
      replacePatient(await setPatientWarranty(patient.id, !patient.isWarranty))
    } catch (warrantyError) {
      setError(
        warrantyError instanceof Error
          ? warrantyError.message
          : 'No fue posible actualizar la garantía.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description="Registro de pacientes de la consulta."
        actions={
          <div className="flex flex-col items-end gap-3">
            {canWrite ? (
              <Button
                className="rounded-lg"
                onClick={() => {
                  setEditingPatient(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Nuevo paciente
              </Button>
            ) : null}
            {canChangeColor ? (
              <ColorPickerBar
                selectedCount={selection.selectedCount}
                disabled={selection.selectedCount === 0}
                colors={settings.quickColors}
                onSelectColor={(color) => {
                  void handleSelectColor(color)
                }}
              />
            ) : null}
          </div>
        }
      />

      <PatientsToolbar
        filters={filters}
        opticalNames={opticalNames}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters(EMPTY_PATIENT_FILTERS)}
      />

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <PatientsTable
        patients={patients}
        isLoading={isLoading}
        canWrite={canWrite}
        canDelete={canDelete}
        selectedIds={selection.selectedIds}
        allSelected={selection.allSelected}
        someSelected={selection.someSelected}
        onToggleAll={selection.toggleAll}
        onToggleOne={selection.toggleOne}
        onRowPointerDown={selection.handleRowPointerDown}
        onRowDragOver={selection.dragOver}
        isDragging={selection.isDragging}
        onEdit={(patient) => {
          setEditingPatient(patient)
          setFormOpen(true)
        }}
        onDelete={setPatientToDelete}
        onToggleWarranty={(patient) => {
          void handleToggleWarranty(patient)
        }}
        onStartVisit={(patient) => {
          void handleStartVisit(patient)
        }}
        onStartNewVisit={setPatientToRestart}
        onFinishVisit={(patient) => {
          void handleFinishVisit(patient)
        }}
        onChangeVisitTimes={(patient, times) => {
          void handleVisitTimesChange(patient, times)
        }}
      />

      {canWrite ? (
        <PatientFormDialog
          open={formOpen}
          patient={editingPatient}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setEditingPatient(null)
            }
          }}
          onSubmit={editingPatient ? handleUpdate : handleCreate}
        />
      ) : null}

      {canWrite ? (
        <StartNewVisitDialog
          patient={patientToRestart}
          onOpenChange={(open) => {
            if (!open) {
              setPatientToRestart(null)
            }
          }}
          onConfirm={() => {
            if (patientToRestart) {
              void handleStartVisit(patientToRestart)
            }
          }}
        />
      ) : null}

      {canDelete ? (
        <DeletePatientDialog
          patient={patientToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setPatientToDelete(null)
            }
          }}
          onConfirm={() => {
            void handleConfirmDelete()
          }}
        />
      ) : null}
    </div>
  )
}
