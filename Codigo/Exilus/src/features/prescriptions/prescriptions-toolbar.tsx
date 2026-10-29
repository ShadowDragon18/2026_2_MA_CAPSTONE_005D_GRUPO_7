import { NativeSelect } from '@/components/native-select'
import { SearchInput } from '@/components/search-input'
import { cn } from '@/lib/utils'
import type { PatientDateFilter } from '@/types/patient'
import type {
  PrescriptionFilters,
  PrescriptionPatientOption,
} from '@/types/prescription'

const DATE_FILTERS: { value: PatientDateFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este año' },
]

interface PrescriptionsToolbarProps {
  filters: PrescriptionFilters
  patients: PrescriptionPatientOption[]
  onFiltersChange: (filters: PrescriptionFilters) => void
}

export function PrescriptionsToolbar({
  filters,
  patients,
  onFiltersChange,
}: PrescriptionsToolbarProps) {
  return (
    <div className="space-y-3">
      <SearchInput
        placeholder="Buscar por nombre, apellido o documento"
        value={filters.search}
        onChange={(event) =>
          onFiltersChange({ ...filters, search: event.target.value })
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="inline-flex max-w-full flex-wrap rounded-xl border border-border bg-card p-1"
          role="group"
          aria-label="Fecha de receta"
        >
          {DATE_FILTERS.map((option) => {
            const isActive = option.value === filters.date

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onFiltersChange({ ...filters, date: option.value })
                }
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <NativeSelect
          className="w-full lg:w-72"
          value={filters.patientId}
          aria-label="Paciente"
          onChange={(event) =>
            onFiltersChange({ ...filters, patientId: event.target.value })
          }
        >
          <option value="">Todos los pacientes</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  )
}
