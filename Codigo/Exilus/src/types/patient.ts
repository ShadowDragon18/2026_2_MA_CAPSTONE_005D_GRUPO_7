export const DOCUMENT_TYPES = ['RUT', 'Passport', 'Extranjero'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const BENEFIT_TYPES = [
  'Fonasa',
  'Fonasa A',
  'Bloqueado',
  'Extranjero',
] as const
export type BenefitType = (typeof BENEFIT_TYPES)[number]

export const PAYMENT_METHODS = [
  'Transferencia',
  'Efectivo',
  'Débito',
  'P/P',
  'Pagado',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = ['Pagado', 'P/P'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type PatientDateFilter =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'this_year'

export type PatientCompletionFilter = 'all' | 'incomplete' | 'complete'

export interface Patient {
  id: string
  registeredAt: string
  documentType: DocumentType
  documentNumber: string | null
  firstName: string
  middleName: string | null
  lastName: string | null
  secondLastName: string | null
  age: number | null
  benefit: BenefitType | null
  captadorFirstName: string | null
  captadorLastName: string | null
  opticalName: string | null
  amount: number
  entryTime: string | null
  exitTime: string | null
  durationMinutes: number | null
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus | null
  generalObservation: string | null
  condition: string | null
  email: string | null
  colorTag: string | null
  isWarranty: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface PatientFilters {
  search: string
  date: PatientDateFilter
  opticalName: string
  paymentStatus: PaymentStatus | 'all'
  completion: PatientCompletionFilter
}

export const EMPTY_PATIENT_FILTERS: PatientFilters = {
  search: '',
  date: 'all',
  opticalName: '',
  paymentStatus: 'all',
  completion: 'all',
}
