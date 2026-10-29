import { Pencil, Play, Square, Trash2, Users } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { WarrantyButton } from '@/components/warranty-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isDarkHexColor } from '@/features/consultations/colors'
import { PaymentStatusBadge } from '@/features/patients/payment-status-badge'
import {
  applyTimeToIso,
  isoToTimeInput,
} from '@/features/patients/time'
import {
  getCaptadorName,
  getPatientFullName,
  isPatientRecordComplete,
} from '@/features/patients/utils'
import {
  formatCurrency,
  formatDurationMinutes,
  formatShortDate,
  formatTime,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Patient } from '@/types/patient'

interface PatientsTableProps {
  patients: Patient[]
  isLoading: boolean
  canWrite: boolean
  canDelete: boolean
  selectedIds: Set<string>
  allSelected: boolean
  someSelected: boolean
  onToggleAll: (selected: boolean) => void
  onToggleOne: (id: string, selected: boolean) => void
  onRowPointerDown: (event: MouseEvent, id: string) => void
  onRowDragOver: (id: string) => void
  isDragging: () => boolean
  onEdit: (patient: Patient) => void
  onDelete: (patient: Patient) => void
  onToggleWarranty: (patient: Patient) => void
  onStartVisit: (patient: Patient) => void
  onStartNewVisit: (patient: Patient) => void
  onFinishVisit: (patient: Patient) => void
  onChangeVisitTimes: (
    patient: Patient,
    times: { entryTime: string | null; exitTime: string | null },
  ) => void
}

export function PatientsTable({
  patients,
  isLoading,
  canWrite,
  canDelete,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleOne,
  onRowPointerDown,
  onRowDragOver,
  isDragging,
  onEdit,
  onDelete,
  onToggleWarranty,
  onStartVisit,
  onStartNewVisit,
  onFinishVisit,
  onChangeVisitTimes,
}: PatientsTableProps) {
  const [automaticById, setAutomaticById] = useState<Record<string, boolean>>(
    {},
  )

  function isAutomaticTime(id: string): boolean {
    return automaticById[id] !== false
  }

  function changeVisitTime(
    patient: Patient,
    field: 'entry' | 'exit',
    time: string,
  ) {
    try {
      const entryTime =
        field === 'entry'
          ? time
            ? applyTimeToIso(patient.entryTime ?? patient.registeredAt, time)
            : null
          : patient.entryTime
      const exitTime =
        field === 'exit'
          ? time
            ? applyTimeToIso(
                patient.exitTime ?? patient.entryTime ?? patient.registeredAt,
                time,
              )
            : null
          : patient.exitTime

      onChangeVisitTimes(patient, {
        entryTime,
        exitTime: entryTime ? exitTime : null,
      })
    } catch {
      return
    }
  }
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No hay pacientes"
        description="No se encontraron registros con los filtros actuales."
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table className="min-w-[1680px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 px-2">
              <span className="sr-only">Estado</span>
            </TableHead>
            <TableHead className="w-10 px-3">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Seleccionar todos"
              />
            </TableHead>
            <TableHead>Acciones</TableHead>
            <TableHead>Fecha registro</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Nombre completo</TableHead>
            <TableHead>Edad</TableHead>
            <TableHead>Prestación</TableHead>
            <TableHead>Captador</TableHead>
            <TableHead>Óptica</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Hora automática</TableHead>
            <TableHead>H. entrada</TableHead>
            <TableHead>H. salida</TableHead>
            <TableHead>Promedio</TableHead>
            <TableHead>Modo pago</TableHead>
            <TableHead>Estado pago</TableHead>
            <TableHead>Garantía</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const selected = selectedIds.has(patient.id)
            const complete = isPatientRecordComplete(patient)
            const automaticTime = isAutomaticTime(patient.id)
            const showManualTimes = canWrite && !automaticTime
            const rowColor = patient.colorTag
            const darkRow = Boolean(rowColor && isDarkHexColor(rowColor))
            const contrastActionClass = darkRow
              ? 'border-white/80 bg-white/15 text-white hover:bg-white/25 hover:text-white'
              : rowColor
                ? 'border-black/40 bg-black/10 text-black hover:bg-black/15 hover:text-black'
                : undefined
            const contrastGhostClass = darkRow
              ? 'text-white hover:bg-white/20 hover:text-white'
              : rowColor
                ? 'text-black hover:bg-black/10 hover:text-black'
                : undefined
            const contrastDeleteClass = darkRow
              ? 'text-white hover:bg-white/20 hover:text-white'
              : 'text-destructive hover:text-destructive'
            const mutedClass = darkRow ? 'text-white/80' : 'text-muted-foreground'

            return (
              <TableRow
                key={patient.id}
                data-state={selected ? 'selected' : undefined}
                className={cn(
                  !complete && !rowColor && 'bg-amber-50/70 dark:bg-amber-950/30',
                  rowColor && 'hover:bg-transparent data-[state=selected]:bg-transparent',
                  darkRow && 'text-white',
                  selected && rowColor && 'ring-2 ring-inset ring-black/35',
                )}
                style={rowColor ? { backgroundColor: rowColor } : undefined}
                onMouseDown={(event) => onRowPointerDown(event, patient.id)}
                onMouseEnter={() => onRowDragOver(patient.id)}
              >
                <TableCell className="w-8 px-2">
                  <span
                    className={cn(
                      'block h-8 w-1.5 rounded-full',
                      complete ? 'bg-transparent' : 'bg-amber-400',
                    )}
                    title={complete ? undefined : 'Falta terminar'}
                    aria-label={complete ? undefined : 'Falta terminar'}
                  />
                </TableCell>
                <TableCell className="px-3">
                  <Checkbox
                    checked={selected}
                    aria-label={`Seleccionar ${getPatientFullName(patient)}`}
                    onClick={(event) => {
                      if (isDragging()) {
                        event.preventDefault()
                      }
                    }}
                    onCheckedChange={(checked) => {
                      if (!isDragging()) {
                        onToggleOne(patient.id, checked === true)
                      }
                    }}
                  />
                </TableCell>
                <TableCell data-no-drag>
                  <div className="flex gap-1">
                    {canWrite && !patient.entryTime ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn('rounded-lg', contrastActionClass)}
                        onClick={() => onStartVisit(patient)}
                      >
                        <Play className="size-3.5" />
                        Inicio
                      </Button>
                    ) : null}
                    {canWrite && patient.entryTime && !patient.exitTime ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn('rounded-lg', contrastActionClass)}
                        onClick={() => onFinishVisit(patient)}
                      >
                        <Square className="size-3.5" />
                        Finalizar
                      </Button>
                    ) : null}
                    {canWrite && patient.entryTime && patient.exitTime ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn('rounded-lg', contrastActionClass)}
                        onClick={() => onStartNewVisit(patient)}
                      >
                        <Play className="size-3.5" />
                        Nueva consulta
                      </Button>
                    ) : null}
                    {canWrite ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={contrastGhostClass}
                        aria-label="Editar"
                        onClick={() => onEdit(patient)}
                      >
                        <Pencil />
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={contrastDeleteClass}
                        aria-label="Borrar"
                        onClick={() => onDelete(patient)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatShortDate(patient.registeredAt)}</TableCell>
                <TableCell>
                  <span className={cn('block text-xs', mutedClass)}>
                    {patient.documentType}
                  </span>
                  <span>{patient.documentNumber ?? '—'}</span>
                </TableCell>
                <TableCell className="font-medium">
                  {getPatientFullName(patient)}
                </TableCell>
                <TableCell>{patient.age ?? '—'}</TableCell>
                <TableCell>{patient.benefit ?? '—'}</TableCell>
                <TableCell>{getCaptadorName(patient) || '—'}</TableCell>
                <TableCell>{patient.opticalName ?? '—'}</TableCell>
                <TableCell>{formatCurrency(patient.amount)}</TableCell>
                <TableCell data-no-drag>
                  {canWrite ? (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={automaticTime}
                        onCheckedChange={(checked) =>
                          setAutomaticById((current) => ({
                            ...current,
                            [patient.id]: checked === true,
                          }))
                        }
                        aria-label="Hora automática"
                      />
                      <span className={mutedClass}>
                        {automaticTime ? 'Activa' : 'Manual'}
                      </span>
                    </label>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell data-no-drag={showManualTimes ? true : undefined}>
                  {showManualTimes ? (
                    <Input
                      type="time"
                      aria-label="H. entrada"
                      className="h-8 w-[7.25rem] rounded-lg"
                      value={isoToTimeInput(patient.entryTime)}
                      onChange={(event) =>
                        changeVisitTime(patient, 'entry', event.target.value)
                      }
                    />
                  ) : patient.entryTime ? (
                    formatTime(patient.entryTime)
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell data-no-drag={showManualTimes ? true : undefined}>
                  {showManualTimes ? (
                    <Input
                      type="time"
                      aria-label="H. salida"
                      className="h-8 w-[7.25rem] rounded-lg"
                      value={isoToTimeInput(patient.exitTime)}
                      onChange={(event) =>
                        changeVisitTime(patient, 'exit', event.target.value)
                      }
                    />
                  ) : patient.exitTime ? (
                    formatTime(patient.exitTime)
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {patient.durationMinutes === null
                    ? '—'
                    : formatDurationMinutes(patient.durationMinutes)}
                </TableCell>
                <TableCell>{patient.paymentMethod ?? '—'}</TableCell>
                <TableCell>
                  {patient.paymentStatus ? (
                    <PaymentStatusBadge status={patient.paymentStatus} />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell data-no-drag>
                  <WarrantyButton
                    active={patient.isWarranty}
                    disabled={!canWrite}
                    onDarkBackground={darkRow}
                    onToggle={
                      canWrite ? () => onToggleWarranty(patient) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
