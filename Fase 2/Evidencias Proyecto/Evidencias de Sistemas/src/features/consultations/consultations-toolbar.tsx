import { SearchInput } from '@/components/search-input'
import { NativeSelect } from '@/components/native-select'
import type { ConsultationFilters, ConsultationSort } from '@/types/consultation'

interface ConsultationsToolbarProps {
  filters: ConsultationFilters
  onFiltersChange: (filters: ConsultationFilters) => void
}

export function ConsultationsToolbar({
  filters,
  onFiltersChange,
}: ConsultationsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        wrapperClassName="flex-1"
        placeholder="Buscar por nombre, apellido, documento o condición"
        value={filters.search}
        onChange={(event) =>
          onFiltersChange({ ...filters, search: event.target.value })
        }
      />

      <NativeSelect
        className="w-full lg:w-56"
        value={filters.sort}
        aria-label="Orden"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            sort: event.target.value as ConsultationSort,
          })
        }
      >
        <option value="recent">Más recientes primero</option>
        <option value="oldest">Más antiguos primero</option>
      </NativeSelect>
    </div>
  )
}
