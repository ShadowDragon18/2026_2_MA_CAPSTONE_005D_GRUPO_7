import { z } from 'zod'
import { TIME_INPUT_PATTERN } from '@/features/patients/time'
import { getDefaultPatientAmount } from '@/lib/config/clinic'
import {
  BENEFIT_TYPES,
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '@/types/patient'

const optionalBenefit = z.union([z.enum(BENEFIT_TYPES), z.literal('')])
const optionalPaymentMethod = z.union([z.enum(PAYMENT_METHODS), z.literal('')])
const optionalPaymentStatus = z.union([z.enum(PAYMENT_STATUSES), z.literal('')])

export const patientFormSchema = z
  .object({
    documentType: z.enum(DOCUMENT_TYPES),
    documentNumber: z.string().trim(),
    firstName: z.string().trim().min(1, 'Ingresa el primer nombre'),
    middleName: z.string().trim(),
    lastName: z.string().trim(),
    secondLastName: z.string().trim(),
    age: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d+$/.test(value), 'Ingresa una edad válida')
      .refine((value) => {
        if (value === '') {
          return true
        }
        const age = Number(value)
        return age >= 0 && age <= 130
      }, 'Ingresa una edad válida'),
    benefit: optionalBenefit,
    opticalId: z.string(),
    captadorId: z.string(),
    amount: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^\d+([.,]\d+)?$/.test(value),
        'Ingresa un monto válido',
      )
      .refine((value) => {
        if (value === '') {
          return true
        }
        return Number(value.replace(',', '.')) >= 0
      }, 'El monto no puede ser negativo'),
    paymentMethod: optionalPaymentMethod,
    paymentStatus: optionalPaymentStatus,
    generalObservation: z.string().trim(),
    condition: z.string().trim(),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        'Ingresa un correo válido',
      ),
    automaticTime: z.boolean(),
    entryTime: z.string(),
    exitTime: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.documentType !== 'Extranjero' && values.documentNumber.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['documentNumber'],
        message:
          values.documentType === 'RUT' ? 'Ingresa el RUT' : 'Ingresa el pasaporte',
      })
    }

    if (values.automaticTime) {
      return
    }

    if (values.entryTime !== '' && !TIME_INPUT_PATTERN.test(values.entryTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['entryTime'],
        message: 'Ingresa una hora de entrada válida',
      })
    }

    if (values.exitTime !== '' && !TIME_INPUT_PATTERN.test(values.exitTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['exitTime'],
        message: 'Ingresa una hora de salida válida',
      })
    }

    if (values.exitTime !== '' && values.entryTime === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['entryTime'],
        message: 'Ingresa la hora de entrada',
      })
    }

    if (values.captadorId !== '' && values.opticalId === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['captadorId'],
        message: 'Selecciona una óptica primero',
      })
    }
  })

export type PatientFormValues = z.infer<typeof patientFormSchema>

export function getPatientFormDefaults(): PatientFormValues {
  return {
    documentType: 'RUT',
    documentNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    age: '',
    benefit: '',
    opticalId: '',
    captadorId: '',
    amount: String(getDefaultPatientAmount()),
    paymentMethod: '',
    paymentStatus: '',
    generalObservation: '',
    condition: '',
    email: '',
    automaticTime: true,
    entryTime: '',
    exitTime: '',
  }
}
