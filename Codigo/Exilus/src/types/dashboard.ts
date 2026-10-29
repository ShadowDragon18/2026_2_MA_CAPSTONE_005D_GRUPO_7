import type { PaymentStatus } from '@/types/patient'

export interface KpiMetric {
  value: number
  changePercent: number
}

export interface CaptadorPayableKpi extends KpiMetric {
  unpaidCount: number
  totalCount: number
}

export interface DashboardKpis {
  patientsRegistered: KpiMetric
  captadorPayable: CaptadorPayableKpi
}

export interface ChartPoint {
  label: string
  value: number
}

export interface ActivityPoint {
  label: string
  patients: number
  consultations: number
  prescriptions: number
}

export interface NamedValue {
  name: string
  value: number
}

export type ActivityKind =
  | 'patient_registered'
  | 'patient_updated'
  | 'prescription_issued'
  | 'consultation_completed'
  | 'user_created'

export interface ActivityItem {
  id: string
  kind: ActivityKind
  title: string
  personName: string
  minutesAgo: number
}

export type AppointmentStatus = 'waiting' | 'in_progress' | 'completed'

export interface AgendaAppointment {
  id: string
  time: string
  patientName: string
  reason: string
  paymentStatus: PaymentStatus | null
  status: AppointmentStatus
}

export interface DashboardSnapshot {
  kpis: DashboardKpis
  activityOverTime: ActivityPoint[]
  paymentStatus: NamedValue[]
  byOptical: NamedValue[]
  recentActivity: ActivityItem[]
  todaysAgenda: AgendaAppointment[]
  averageVisitMinutes: number | null
}
