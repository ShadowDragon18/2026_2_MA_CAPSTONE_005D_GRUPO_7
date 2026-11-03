import { LayoutGrid, Table2 } from 'lucide-react'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WarrantyFilters, WarrantyViewMode } from '@/types/warranty'

interface WarrantyToolbarProps {
  filters: WarrantyFilters
  viewMode: WarrantyViewMode
  onFiltersChange: (filters: WarrantyFilters) => void
  onViewModeChange: (mode: WarrantyViewMode) => void
}

export function WarrantyToolbar({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
}: WarrantyToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        wrapperClassName="flex-1"
        placeholder="Buscar por nombre, documento, condición u óptica"
        value={filters.search}
        onChange={(event) =>
          onFiltersChange({ ...filters, search: event.target.value })
        }
      />
      <div
        className="inline-flex self-start rounded-xl border border-border bg-card p-1"
        role="group"
        aria-label="Vista"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={viewMode === 'cards'}
          className={cn(
            'rounded-lg',
            viewMode === 'cards' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          )}
          onClick={() => onViewModeChange('cards')}
        >
          <LayoutGrid className="size-4" />
          Tarjetas
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={viewMode === 'table'}
          className={cn(
            'rounded-lg',
            viewMode === 'table' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          )}
          onClick={() => onViewModeChange('table')}
        >
          <Table2 className="size-4" />
          Tabla
        </Button>
      </div>
    </div>
  )
}
