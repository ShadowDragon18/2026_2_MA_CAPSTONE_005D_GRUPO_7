import { SearchInput } from '@/components/search-input'
import type { OpticalFilters } from '@/types/optical'

interface OpticalsToolbarProps {
  filters: OpticalFilters
  onFiltersChange: (filters: OpticalFilters) => void
}

export function OpticalsToolbar({
  filters,
  onFiltersChange,
}: OpticalsToolbarProps) {
  return (
    <SearchInput
      wrapperClassName="max-w-xl"
      placeholder="Buscar óptica"
      value={filters.search}
      onChange={(event) =>
        onFiltersChange({ ...filters, search: event.target.value })
      }
    />
  )
}
