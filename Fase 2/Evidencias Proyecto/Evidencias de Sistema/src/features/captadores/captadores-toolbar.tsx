import { NativeSelect } from '@/components/native-select'
import { SearchInput } from '@/components/search-input'
import { cn } from '@/lib/utils'
import {
  CAPTADOR_PAYMENT_STATUSES,
  type CaptadorFilters,
  type CaptadorPaymentStatus,
} from '@/types/captador'
import type { OpticalOption } from '@/types/optical'
import type { PatientDateFilter } from '@/types/patient'

const DATE_FILTERS: { value: PatientDateFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este año' },
]

interface CaptadoresToolbarProps {
  filters: CaptadorFilters
  opticals: OpticalOption[]
  onFiltersChange: (filters: CaptadorFilters) => void
}

export function CaptadoresToolbar({
  filters,
  opticals,
  onFiltersChange,
}: CaptadoresToolbarProps) {
  return (
    <div className="space-y-3">
      <SearchInput
        placeholder="Buscar por captador, paciente u óptica"
        value={filters.search}
        onChange={(event) =>
          onFiltersChange({ ...filters, search: event.target.value })
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="inline-flex max-w-full flex-wrap rounded-xl border border-border bg-card p-1"
          role="group"
          aria-label="Fecha de captación"
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

        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            className="w-full sm:w-48"
            value={filters.opticalId ?? ''}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                opticalId: event.target.value || undefined,
              })
            }
            aria-label="Óptica"
          >
            <option value="">Todas las ópticas</option>
            {opticals.map((optical) => (
              <option key={optical.id} value={optical.id}>
                {optical.name}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            className="w-full sm:w-40"
            value={filters.paymentStatus}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                paymentStatus: event.target.value as
                  | CaptadorPaymentStatus
                  | 'all',
              })
            }
            aria-label="Estado de pago"
          >
            <option value="all">Todos</option>
            {CAPTADOR_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
    </div>
  )
}
