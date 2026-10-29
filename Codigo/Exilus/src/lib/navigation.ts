import type { NavSection } from '@/types/navigation'
import type { UserRole } from '@/types/roles'

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'patients',
        label: 'Pacientes',
        path: '/pacientes',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'warranty',
        label: 'Garantía',
        path: '/garantia',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'optics',
        label: 'Ópticas',
        path: '/opticas',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'captadores',
        label: 'Captadores',
        path: '/captadores',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'consultations',
        label: 'Consulta',
        path: '/atenciones',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'prescriptions',
        label: 'Recetas',
        path: '/recetas',
        roles: ['admin', 'ophthalmologist', 'reception'],
      },
      {
        id: 'settings',
        label: 'Configuración',
        path: '/configuracion',
        roles: ['admin', 'ophthalmologist', 'reception'],
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
        roles: ['admin'],
      },
      {
        id: 'audit',
        label: 'Auditoría',
        path: '/auditoria',
        roles: ['admin'],
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
  return role === 'ophthalmologist' ? '/pacientes' : '/dashboard'
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
