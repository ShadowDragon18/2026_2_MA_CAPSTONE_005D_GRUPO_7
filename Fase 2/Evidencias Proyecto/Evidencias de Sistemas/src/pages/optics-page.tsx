import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ColorPickerBar } from '@/features/consultations/color-picker-bar'
import { listCaptadores } from '@/features/captadores/api'
import {
  createOptical,
  deleteOptical,
  listOptics,
  setOpticalColor,
  updateOptical,
} from '@/features/optics/api'
import { DeleteOpticalDialog } from '@/features/optics/delete-optical-dialog'
import { OpticalCards } from '@/features/optics/optical-cards'
import { OpticalDetailDialog } from '@/features/optics/optical-detail-dialog'
import { OpticalFormDialog } from '@/features/optics/optical-form-dialog'
import { OpticalsToolbar } from '@/features/optics/opticals-toolbar'
import {
  canChangeOpticalColor,
  canDeleteOptics,
  canWriteOptics,
} from '@/features/optics/permissions'
import type { OpticalFormValues } from '@/features/optics/schema'
import { useAuth } from '@/hooks/use-auth'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import type { Captador } from '@/types/captador'
import type { Optical, OpticalFilters } from '@/types/optical'
import { EMPTY_OPTICAL_FILTERS } from '@/types/optical'

export function OpticsPage() {
  const { user } = useAuth()
  const { settings } = useClinicSettings()
  const canWrite = user ? canWriteOptics(user.role) : false
  const canDelete = user ? canDeleteOptics(user.role) : false
  const canChangeColor = user ? canChangeOpticalColor(user.role) : false

  const [filters, setFilters] = useState<OpticalFilters>(EMPTY_OPTICAL_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [optics, setOptics] = useState<Optical[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOptical, setEditingOptical] = useState<Optical | null>(null)
  const [opticalToDelete, setOpticalToDelete] = useState<Optical | null>(null)
  const [viewingOptical, setViewingOptical] = useState<Optical | null>(null)
  const [viewCaptadores, setViewCaptadores] = useState<Captador[]>([])
  const [viewLoading, setViewLoading] = useState(false)

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

  const loadOptics = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const next = await listOptics(queryFilters)
      setOptics(next)
      setSelectedIds((current) => {
        const valid = new Set(next.map((item) => item.id))
        return new Set([...current].filter((id) => valid.has(id)))
      })
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar las ópticas.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    void loadOptics()
  }, [loadOptics])

  useEffect(() => {
    if (!viewingOptical) {
      setViewCaptadores([])
      setViewLoading(false)
      return
    }

    let cancelled = false
    setViewLoading(true)

    void listCaptadores({ search: '', opticalId: viewingOptical.id })
      .then((next) => {
        if (!cancelled) {
          setViewCaptadores(next)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setViewCaptadores([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar los captadores.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setViewLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [viewingOptical])

  function replaceOptical(updated: Optical) {
    setOptics((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    )
  }

  function toggleSelect(id: string, selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  async function handleCreate(values: OpticalFormValues) {
    try {
      const created = await createOptical(values)
      setOptics((current) =>
        [...current, created].sort((left, right) =>
          left.name.localeCompare(right.name, 'es'),
        ),
      )
      setFormOpen(false)
      setEditingOptical(null)
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'No fue posible crear la óptica.',
      )
    }
  }

  async function handleUpdate(values: OpticalFormValues) {
    if (!editingOptical) {
      return
    }

    try {
      replaceOptical(await updateOptical(editingOptical.id, values))
      setFormOpen(false)
      setEditingOptical(null)
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No fue posible actualizar la óptica.',
      )
    }
  }

  async function handleConfirmDelete() {
    if (!opticalToDelete) {
      return
    }

    try {
      await deleteOptical(opticalToDelete.id)
      setOptics((current) =>
        current.filter((item) => item.id !== opticalToDelete.id),
      )
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(opticalToDelete.id)
        return next
      })
      setOpticalToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No fue posible eliminar la óptica.',
      )
      setOpticalToDelete(null)
    }
  }

  async function handleSelectColor(color: string | null) {
    if (!canChangeColor || selectedIds.size === 0) {
      return
    }

    const selected = optics.filter((item) => selectedIds.has(item.id))

    try {
      const updated = await Promise.all(
        selected.map((item) => setOpticalColor(item.id, color)),
      )
      const byId = new Map(updated.map((item) => [item.id, item] as const))
      setOptics((current) =>
        current.map((item) => byId.get(item.id) ?? item),
      )
    } catch (colorError) {
      setError(
        colorError instanceof Error
          ? colorError.message
          : 'No fue posible actualizar el color.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ópticas"
        description="Catálogo de ópticas y captadores asignados a cada una."
        actions={
          <div className="flex flex-col items-end gap-3">
            {canWrite ? (
              <Button
                className="rounded-lg"
                onClick={() => {
                  setEditingOptical(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Nueva óptica
              </Button>
            ) : null}
            {canChangeColor ? (
              <ColorPickerBar
                selectedCount={selectedIds.size}
                disabled={selectedIds.size === 0}
                colors={settings.quickColors}
                emptyHint="Marca una óptica para asignar un color"
                selectedHint={(count) =>
                  count === 1
                    ? '1 óptica seleccionada'
                    : `${count} ópticas seleccionadas`
                }
                onSelectColor={(color) => {
                  void handleSelectColor(color)
                }}
              />
            ) : null}
          </div>
        }
      />

      <OpticalsToolbar filters={filters} onFiltersChange={setFilters} />

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <OpticalCards
        optics={optics}
        isLoading={isLoading}
        canWrite={canWrite}
        canDelete={canDelete}
        canSelect={canChangeColor}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onOpen={setViewingOptical}
        onEdit={(optical) => {
          setEditingOptical(optical)
          setFormOpen(true)
        }}
        onDelete={setOpticalToDelete}
      />

      <OpticalDetailDialog
        optical={viewingOptical}
        captadores={viewCaptadores}
        isLoading={viewLoading}
        onOpenChange={(open) => {
          if (!open) {
            setViewingOptical(null)
          }
        }}
      />

      {canWrite ? (
        <OpticalFormDialog
          open={formOpen}
          optical={editingOptical}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setEditingOptical(null)
            }
          }}
          onSubmit={editingOptical ? handleUpdate : handleCreate}
        />
      ) : null}

      {canDelete ? (
        <DeleteOpticalDialog
          optical={opticalToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setOpticalToDelete(null)
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
