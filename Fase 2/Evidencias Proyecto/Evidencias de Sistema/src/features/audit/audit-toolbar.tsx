import { NativeSelect } from '@/components/native-select'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AUDIT_MODULE_LABELS } from '@/features/audit/utils'
import { cn } from '@/lib/utils'
import {
  AUDIT_ENTITY_TYPES,
  type AuditActionFilter,
  type AuditDateFilter,
  type AuditEntityType,
  type AuditFilters,
  type AuditUserOption,
} from '@/types/audit'

const DATE_FILTERS: { value: AuditDateFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este año' },
  { value: 'custom', label: 'Rango' },
]

const ACTION_FILTERS: { value: AuditActionFilter; label: string }[] = [
  { value: 'all', label: 'Todas las acciones' },
  { value: 'create', label: 'Crear' },
  { value: 'update', label: 'Editar' },
  { value: 'delete', label: 'Eliminar' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'block', label: 'Bloquear' },
  { value: 'unblock', label: 'Desbloquear' },
  { value: 'other', label: 'Otros' },
]

interface AuditToolbarProps {
  filters: AuditFilters
  users: AuditUserOption[]
  hasActiveFilters: boolean
  onFiltersChange: (filters: AuditFilters) => void
  onClearFilters: () => void
}

export function AuditToolbar({
  filters,
  users,
  hasActiveFilters,
  onFiltersChange,
  onClearFilters,
}: AuditToolbarProps) {
  return (
    <div className="space-y-3">
      <SearchInput
        placeholder="Buscar por usuario, acción, registro, módulo o descripción"
        value={filters.search}
        onChange={(event) =>
          onFiltersChange({ ...filters, search: event.target.value })
        }
      />

      <div
        className="inline-flex max-w-full flex-wrap rounded-xl border border-border bg-card p-1"
        role="group"
        aria-label="Fecha"
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

      {filters.date === 'custom' ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            className="h-10 rounded-lg sm:w-44"
            aria-label="Desde"
            value={filters.fromDate}
            onChange={(event) =>
              onFiltersChange({ ...filters, fromDate: event.target.value })
            }
          />
          <Input
            type="date"
            className="h-10 rounded-lg sm:w-44"
            aria-label="Hasta"
            value={filters.toDate}
            onChange={(event) =>
              onFiltersChange({ ...filters, toDate: event.target.value })
            }
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <NativeSelect
          className="w-full lg:w-56"
          value={filters.userId}
          aria-label="Usuario"
          onChange={(event) =>
            onFiltersChange({ ...filters, userId: event.target.value })
          }
        >
          <option value="">Todos los usuarios</option>
          <option value="none">Sin usuario</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          className="w-full lg:w-48"
          value={filters.entityType}
          aria-label="Módulo"
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              entityType: event.target.value as AuditEntityType | 'all',
            })
          }
        >
          <option value="all">Todos los módulos</option>
          {AUDIT_ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {AUDIT_MODULE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          className="w-full lg:w-48"
          value={filters.action}
          aria-label="Acción"
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              action: event.target.value as AuditActionFilter,
            })
          }
        >
          {ACTION_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={onClearFilters}
          >
            Limpiar filtros
          </Button>
        ) : null}
      </div>
    </div>
  )
}
