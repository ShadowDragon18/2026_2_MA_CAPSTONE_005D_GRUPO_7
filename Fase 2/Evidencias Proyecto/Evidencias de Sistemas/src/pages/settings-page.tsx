import { Outlet } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { SettingsNav } from '@/features/settings/settings-nav'

export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Perfil, apariencia y administración de Exilus."
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsNav />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
