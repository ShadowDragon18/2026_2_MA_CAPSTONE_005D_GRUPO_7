import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createCaptador,
  deleteCaptador,
  deleteCaptadorEntry,
  listCaptadorEntries,
  listCaptadores,
  updateCaptador,
  updateCaptadorEntry,
} from '@/features/captadores/api'
import { CaptadorEntriesCards } from '@/features/captadores/captador-entries-cards'
import { CaptadorEntryFormDialog } from '@/features/captadores/captador-entry-form-dialog'
import { CaptadorFormDialog } from '@/features/captadores/captador-form-dialog'
import { CaptadoresCards } from '@/features/captadores/captadores-cards'
import { CaptadoresToolbar } from '@/features/captadores/captadores-toolbar'
import { DeleteCaptadorDialog } from '@/features/captadores/delete-captador-dialog'
import { DeleteCaptadorEntryDialog } from '@/features/captadores/delete-captador-entry-dialog'
import {
  canDeleteCaptadores,
  canWriteCaptadores,
} from '@/features/captadores/permissions'
import type {
  CaptadorEntryFormValues,
  CaptadorFormValues,
} from '@/features/captadores/schema'
import { groupCaptadorEntriesByDay } from '@/features/captadores/utils'
import { listOpticalOptions } from '@/features/optics/api'
import { useAuth } from '@/hooks/use-auth'
import type {
  Captador,
  CaptadorEntry,
  CaptadorFilters,
} from '@/types/captador'
import { EMPTY_CAPTADOR_FILTERS } from '@/types/captador'
import type { OpticalOption } from '@/types/optical'

export function CaptadoresPage() {
  const { user } = useAuth()
  const canWrite = user ? canWriteCaptadores(user.role) : false
  const canDelete = user ? canDeleteCaptadores(user.role) : false

  const [filters, setFilters] = useState<CaptadorFilters>(EMPTY_CAPTADOR_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [entries, setEntries] = useState<CaptadorEntry[]>([])
  const [catalog, setCatalog] = useState<Captador[]>([])
  const [opticals, setOpticals] = useState<OpticalOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCaptador, setEditingCaptador] = useState<Captador | null>(null)
  const [captadorToDelete, setCaptadorToDelete] = useState<Captador | null>(null)
  const [editingEntry, setEditingEntry] = useState<CaptadorEntry | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<CaptadorEntry | null>(null)

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
    [filters, debouncedSearch],
  )

  const loadPage = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextEntries, nextCatalog, nextOpticals] = await Promise.all([
        listCaptadorEntries(queryFilters),
        listCaptadores(),
        listOpticalOptions(),
      ])
      setEntries(nextEntries)
      setCatalog(nextCatalog)
      setOpticals(nextOpticals)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar las captaciones.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const groups = useMemo(
    () => groupCaptadorEntriesByDay(entries),
    [entries],
  )

  function replaceCatalog(updated: Captador) {
    setCatalog((current) =>
      current
        .map((item) => (item.id === updated.id ? updated : item))
        .sort((left, right) =>
          `${left.firstName} ${left.lastName ?? ''}`.localeCompare(
            `${right.firstName} ${right.lastName ?? ''}`,
            'es',
          ),
        ),
    )
  }

  async function handleCreate(values: CaptadorFormValues) {
    try {
      const created = await createCaptador(values)
      setCatalog((current) =>
        [...current, created].sort((left, right) =>
          `${left.firstName} ${left.lastName ?? ''}`.localeCompare(
            `${right.firstName} ${right.lastName ?? ''}`,
            'es',
          ),
        ),
      )
      setFormOpen(false)
      setEditingCaptador(null)
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'No fue posible crear el captador.',
      )
    }
  }

  async function handleUpdate(values: CaptadorFormValues) {
    if (!editingCaptador) {
      return
    }

    try {
      const updated = await updateCaptador(editingCaptador.id, values)
      replaceCatalog(updated)
      setEntries((current) =>
        current.map((item) =>
          item.captadorId === updated.id
            ? {
                ...item,
                captadorFirstName: updated.firstName,
                captadorLastName: updated.lastName,
                opticalId: updated.opticalId,
                opticalName: updated.opticalName,
              }
            : item,
        ),
      )
      setFormOpen(false)
      setEditingCaptador(null)
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No fue posible actualizar el captador.',
      )
    }
  }

  async function handleConfirmDelete() {
    if (!captadorToDelete) {
      return
    }

    try {
      await deleteCaptador(captadorToDelete.id)
      setCatalog((current) =>
        current.filter((item) => item.id !== captadorToDelete.id),
      )
      setCaptadorToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No fue posible eliminar el captador.',
      )
      setCaptadorToDelete(null)
    }
  }

  async function handleUpdateEntry(values: CaptadorEntryFormValues) {
    if (!editingEntry) {
      return
    }

    try {
      const updated = await updateCaptadorEntry(editingEntry.id, values)
      setEntries((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setEditingEntry(null)
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No fue posible actualizar la captación.',
      )
    }
  }

  async function handleConfirmDeleteEntry() {
    if (!entryToDelete) {
      return
    }

    try {
      await deleteCaptadorEntry(entryToDelete.id)
      setEntries((current) =>
        current.filter((item) => item.id !== entryToDelete.id),
      )
      setEntryToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No fue posible eliminar la captación.',
      )
      setEntryToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Captadores"
        description="Cada paciente derivado aparece el día que se registró, para saber cuántos llevó cada captador y cuánto pagarle."
        actions={
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => setCatalogOpen(true)}
              >
                Catálogo
              </Button>
              <Button
                className="rounded-lg"
                disabled={opticals.length === 0}
                onClick={() => {
                  setEditingCaptador(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Nuevo captador
              </Button>
            </div>
          ) : null
        }
      />

      <CaptadoresToolbar
        filters={filters}
        opticals={opticals}
        onFiltersChange={setFilters}
      />

      {canWrite && opticals.length === 0 && !isLoading ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Crea una óptica antes de registrar captadores.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <CaptadorEntriesCards
        groups={groups}
        isLoading={isLoading}
        canWrite={canWrite}
        canDelete={canDelete}
        onEdit={setEditingEntry}
        onDelete={setEntryToDelete}
      />

      {canWrite ? (
        <>
          <CaptadorFormDialog
            open={formOpen}
            captador={editingCaptador}
            opticals={opticals}
            onOpenChange={(open) => {
              setFormOpen(open)
              if (!open) {
                setEditingCaptador(null)
              }
            }}
            onSubmit={editingCaptador ? handleUpdate : handleCreate}
          />

          <CaptadorEntryFormDialog
            open={editingEntry !== null}
            entry={editingEntry}
            onOpenChange={(open) => {
              if (!open) {
                setEditingEntry(null)
              }
            }}
            onSubmit={handleUpdateEntry}
          />

          <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Catálogo de captadores</DialogTitle>
                <DialogDescription>
                  Personas disponibles al registrar un paciente. El pago diario
                  se calcula con las captaciones de abajo.
                </DialogDescription>
              </DialogHeader>
              <CaptadoresCards
                captadores={catalog}
                isLoading={false}
                canWrite={canWrite}
                canDelete={canDelete}
                onEdit={(captador) => {
                  setEditingCaptador(captador)
                  setFormOpen(true)
                }}
                onDelete={setCaptadorToDelete}
              />
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {canDelete ? (
        <>
          <DeleteCaptadorDialog
            captador={captadorToDelete}
            onOpenChange={(open) => {
              if (!open) {
                setCaptadorToDelete(null)
              }
            }}
            onConfirm={() => {
              void handleConfirmDelete()
            }}
          />
          <DeleteCaptadorEntryDialog
            entry={entryToDelete}
            onOpenChange={(open) => {
              if (!open) {
                setEntryToDelete(null)
              }
            }}
            onConfirm={() => {
              void handleConfirmDeleteEntry()
            }}
          />
        </>
      ) : null}
    </div>
  )
}
