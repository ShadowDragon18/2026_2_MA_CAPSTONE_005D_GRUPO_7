import { z } from 'zod'

export const opticalFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre de la óptica'),
})

export type OpticalFormValues = z.infer<typeof opticalFormSchema>

export function getOpticalFormDefaults(): OpticalFormValues {
  return {
    name: '',
  }
}
