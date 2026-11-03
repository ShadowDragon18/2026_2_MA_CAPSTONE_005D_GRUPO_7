import { z } from 'zod'

const optionalSignedDecimal = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^-?\d+([.,]\d+)?$/.test(value),
    'Ingresa un número válido',
  )

const optionalNonNegativeDecimal = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d+([.,]\d+)?$/.test(value),
    'Ingresa un número válido',
  )
  .refine((value) => {
    if (value === '') {
      return true
    }
    return Number(value.replace(',', '.')) >= 0
  }, 'El valor no puede ser negativo')

export const consultationFormSchema = z.object({
  oiSphere: optionalSignedDecimal,
  oiCylinder: optionalSignedDecimal,
  oiAxis: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Ingresa un eje válido')
    .refine((value) => {
      if (value === '') {
        return true
      }
      const axis = Number(value)
      return axis >= 0 && axis <= 180
    }, 'El eje debe estar entre 0 y 180'),
  odSphere: optionalSignedDecimal,
  odCylinder: optionalSignedDecimal,
  odAxis: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Ingresa un eje válido')
    .refine((value) => {
      if (value === '') {
        return true
      }
      const axis = Number(value)
      return axis >= 0 && axis <= 180
    }, 'El eje debe estar entre 0 y 180'),
  dp: optionalNonNegativeDecimal,
  addValue: optionalNonNegativeDecimal,
  glucoseMgDl: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Ingresa un valor entero')
    .refine((value) => {
      if (value === '') {
        return true
      }
      return Number(value) >= 0
    }, 'El valor no puede ser negativo'),
  medicalObservations: z.string().trim(),
})

export type ConsultationFormValues = z.infer<typeof consultationFormSchema>

export function getConsultationFormDefaults(): ConsultationFormValues {
  return {
    oiSphere: '',
    oiCylinder: '',
    oiAxis: '',
    odSphere: '',
    odCylinder: '',
    odAxis: '',
    dp: '',
    addValue: '',
    glucoseMgDl: '',
    medicalObservations: '',
  }
}
