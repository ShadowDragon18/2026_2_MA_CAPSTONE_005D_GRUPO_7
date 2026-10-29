import { NativeSelect } from '@/components/native-select'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  PatientCompletionFilter,
  PatientDateFilter,
  PatientFilters,
  PaymentStatus,
} from '@/types/patient'
import { PAYMENT_STATUSES } from '@/types/patient'

const DATE_FILTERS: { value: PatientDateFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este año' },
]

interface PatientsToolbarProps {
  filters: PatientFilters
  opticalNames: string[]
  hasActiveFilters: boolean
  onFiltersChange: (filters: PatientFilters) => void
  onClearFilters: () => void
}

export function PatientsToolbar({
  filters,
  opticalNames,
  hasActiveFilters,
  onFiltersChange,
  onClearFilters,
}: PatientsToolbarProps) {
  return (
    <div className="space-y-3">
      <SearchInput
        placeholder="Buscar por nombre, documento, prestación, captador, óptica o pago"
        value={filters.search}
        onChange={(event) =>
          onFiltersChange({ ...filters, search: event.target.value })
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="inline-flex max-w-full flex-wrap rounded-xl border border-border bg-card p-1"
          role="group"
          aria-label="Fecha de registro"
        >
          {DATE_FILTERS.map((option) => {
            const isActive = option.value === filters.date

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFiltersChange({ ...filters, date: option.value })}
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

        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            className="w-full sm:w-48"
            value={filters.opticalName}
            onChange={(event) =>
              onFiltersChange({ ...filters, opticalName: event.target.value })
            }
            aria-label="Óptica"
          >
            <option value="">Todas las ópticas</option>
            {opticalNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            className="w-full sm:w-40"
            value={filters.paymentStatus}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                paymentStatus: event.target.value as PaymentStatus | 'all',
              })
            }
            aria-label="Estado de pago"
          >
            <option value="all">Todos</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            className="w-full sm:w-48"
            value={filters.completion}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                completion: event.target.value as PatientCompletionFilter,
              })
            }
            aria-label="Estado de ficha"
          >
            <option value="all">Todas las fichas</option>
            <option value="incomplete">Datos incompletos</option>
            <option value="complete">Datos completos</option>
          </NativeSelect>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-lg"
              onClick={onClearFilters}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
