import { z } from 'zod'
import { USER_ROLES } from '@/types/roles'

export const profileNameSchema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa tu nombre completo'),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

const moneyField = z
  .string()
  .trim()
  .refine((value) => /^\d+([.,]\d+)?$/.test(value), 'Ingresa un monto válido')
  .refine(
    (value) => Number(value.replace(',', '.')) >= 0,
    'El monto no puede ser negativo',
  )

export const clinicSettingsSchema = z.object({
  clinicName: z.string().trim().min(1, 'Ingresa el nombre de la clínica'),
  defaultAmount: moneyField,
  defaultCaptadorAmount: moneyField,
})

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa el nombre completo'),
  email: z.string().trim().email('Ingresa un correo válido'),
  password: z
    .string()
    .min(6, 'La contraseña temporal debe tener al menos 6 caracteres'),
  role: z.enum(USER_ROLES),
})

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa el nombre completo'),
  role: z.enum(USER_ROLES),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type ProfileNameValues = z.infer<typeof profileNameSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>
export type ClinicSettingsValues = z.infer<typeof clinicSettingsSchema>
export type CreateUserValues = z.infer<typeof createUserSchema>
export type UpdateUserValues = z.infer<typeof updateUserSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
