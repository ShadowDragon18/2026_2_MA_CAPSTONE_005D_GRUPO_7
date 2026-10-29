import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Ingresa tu correo electrónico')
    .email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
  remember: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>
