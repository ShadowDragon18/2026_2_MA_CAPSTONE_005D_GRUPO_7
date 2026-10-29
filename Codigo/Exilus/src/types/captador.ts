import type { PatientDateFilter } from '@/types/patient'

export const CAPTADOR_PAYMENT_STATUSES = ['Pagado', 'Por pagar'] as const
export type CaptadorPaymentStatus = (typeof CAPTADOR_PAYMENT_STATUSES)[number]

export interface Captador {
  id: string
  firstName: string
  lastName: string | null
  opticalId: string
  opticalName: string
  amount: number
  paymentStatus: CaptadorPaymentStatus
  createdAt: string
  updatedAt: string
}

export interface CaptadorEntry {
  id: string
  captadorId: string
  captadorFirstName: string
  captadorLastName: string | null
  opticalId: string
  opticalName: string
  patientId: string | null
  patientName: string | null
  amount: number
  paymentStatus: CaptadorPaymentStatus
  occurredAt: string
  createdAt: string
  updatedAt: string
}

export interface CaptadorPersonGroup {
  captadorId: string
  name: string
  opticalName: string
  entries: CaptadorEntry[]
  totalAmount: number
  unpaidAmount: number
}

export interface CaptadorDayGroup {
  dateKey: string
  label: string
  entries: CaptadorEntry[]
  captadores: CaptadorPersonGroup[]
  totalAmount: number
  unpaidAmount: number
}

export interface CaptadorFilters {
  search: string
  date: PatientDateFilter
  paymentStatus: CaptadorPaymentStatus | 'all'
  opticalId?: string
}

export const EMPTY_CAPTADOR_FILTERS: CaptadorFilters = {
  search: '',
  date: 'today',
  paymentStatus: 'all',
}
