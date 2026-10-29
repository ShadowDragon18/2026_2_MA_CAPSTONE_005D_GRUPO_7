/**
 * Contratos previstos para la capa de datos de Supabase.
 * Se ampliarán al implementar cada módulo. No representan aún el esquema clínico.
 */

import type { UserRole } from '@/types/roles'

export interface Profile {
  id: string
  fullName: string
  role: UserRole
  createdAt: string
}

export type { Patient } from '@/types/patient'

export interface Appointment {
  id: string
}

export type { ConsultationRecord as Consultation } from '@/types/consultation'

export interface Prescription {
  id: string
}

export interface ClinicalDocument {
  id: string
}

export interface AuditLog {
  id: string
}
