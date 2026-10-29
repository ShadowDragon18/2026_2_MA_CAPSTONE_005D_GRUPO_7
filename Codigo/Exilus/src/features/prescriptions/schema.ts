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

const optionalAxis = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+$/.test(value), 'Ingresa un eje válido')
  .refine((value) => {
    if (value === '') {
      return true
    }
    const axis = Number(value)
    return axis >= 0 && axis <= 180
  }, 'El eje debe estar entre 0 y 180')

export const prescriptionFormSchema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  consultationId: z.string().min(1, 'Selecciona una consulta'),
  odSphere: optionalSignedDecimal,
  odCylinder: optionalSignedDecimal,
  odAxis: optionalAxis,
  oiSphere: optionalSignedDecimal,
  oiCylinder: optionalSignedDecimal,
  oiAxis: optionalAxis,
  dp: optionalNonNegativeDecimal,
  addValue: optionalNonNegativeDecimal,
  observations: z.string().trim(),
  indications: z.string().trim(),
})

export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>

export function getPrescriptionFormDefaults(): PrescriptionFormValues {
  return {
    patientId: '',
    consultationId: '',
    odSphere: '',
    odCylinder: '',
    odAxis: '',
    oiSphere: '',
    oiCylinder: '',
    oiAxis: '',
    dp: '',
    addValue: '',
    observations: '',
    indications: '',
  }
}
