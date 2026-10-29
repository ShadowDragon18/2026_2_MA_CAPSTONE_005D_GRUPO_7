import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

export function ModulePlaceholder({
  title,
  description,
  icon,
}: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} estará disponible pronto`}
        description="Este módulo se conectará a Supabase en una próxima fase. La navegación ya está activa y el acceso se filtrará también con Row Level Security."
      />
    </div>
  )
}
