import type { NavSection } from '@/types/navigation'
import { MODULE_ROLES, type UserRole } from '@/types/roles'

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        roles: [...MODULE_ROLES.dashboard],
      },
      {
        id: 'patients',
        label: 'Pacientes',
        path: '/pacientes',
        roles: [...MODULE_ROLES.patients],
      },
      {
        id: 'warranty',
        label: 'Garantía',
        path: '/garantia',
        roles: [...MODULE_ROLES.warranty],
      },
      {
        id: 'optics',
        label: 'Ópticas',
        path: '/opticas',
        roles: [...MODULE_ROLES.optics],
      },
      {
        id: 'captadores',
        label: 'Captadores',
        path: '/captadores',
        roles: [...MODULE_ROLES.captadores],
      },
      {
        id: 'consultations',
        label: 'Consulta',
        path: '/atenciones',
        roles: [...MODULE_ROLES.consultations],
      },
      {
        id: 'settings',
        label: 'Configuración',
        path: '/configuracion',
        roles: [...MODULE_ROLES.settings],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    items: [
      {
        id: 'users',
        label: 'Usuarios',
        path: '/configuracion/usuarios',
        roles: [...MODULE_ROLES.users],
      },
      {
        id: 'audit',
        label: 'Auditoría',
        path: '/auditoria',
        roles: [...MODULE_ROLES.audit],
      },
    ],
  },
]

export function getVisibleSections(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0)
}

export function getHomePath(role: UserRole): string {
  if (role === 'ophthalmologist') {
    return '/atenciones'
  }

  return '/dashboard'
}

export function canAccessPath(role: UserRole, path: string): boolean {
  const item = NAV_SECTIONS.flatMap((section) => section.items).find(
    (entry) => entry.path === path,
  )

  if (!item) {
    return true
  }

  return item.roles.includes(role)
}
