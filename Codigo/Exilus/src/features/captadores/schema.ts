import { z } from 'zod'
import { getDefaultCaptadorAmount } from '@/lib/config/clinic'
import { CAPTADOR_PAYMENT_STATUSES } from '@/types/captador'

export const captadorFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa el nombre'),
  lastName: z.string().trim(),
  opticalId: z.string().trim().min(1, 'Asigna una óptica'),
  amount: z
    .string()
    .trim()
    .refine((value) => /^\d+([.,]\d+)?$/.test(value), 'Ingresa un precio válido')
    .refine(
      (value) => Number(value.replace(',', '.')) >= 0,
      'El precio no puede ser negativo',
    ),
  paymentStatus: z.enum(CAPTADOR_PAYMENT_STATUSES),
})

export type CaptadorFormValues = z.infer<typeof captadorFormSchema>

export function getCaptadorFormDefaults(
  amount = getDefaultCaptadorAmount(),
): CaptadorFormValues {
  return {
    firstName: '',
    lastName: '',
    opticalId: '',
    amount: String(amount),
    paymentStatus: 'Por pagar',
  }
}

export const captadorEntryFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .refine((value) => /^\d+([.,]\d+)?$/.test(value), 'Ingresa un precio válido')
    .refine(
      (value) => Number(value.replace(',', '.')) >= 0,
      'El precio no puede ser negativo',
    ),
  paymentStatus: z.enum(CAPTADOR_PAYMENT_STATUSES),
})

export type CaptadorEntryFormValues = z.infer<typeof captadorEntryFormSchema>

export function getCaptadorEntryFormDefaults(
  amount = getDefaultCaptadorAmount(),
): CaptadorEntryFormValues {
  return {
    amount: String(amount),
    paymentStatus: 'Por pagar',
  }
}
