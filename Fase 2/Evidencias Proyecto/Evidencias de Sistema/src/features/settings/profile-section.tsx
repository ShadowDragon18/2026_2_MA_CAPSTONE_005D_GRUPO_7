import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormStatus } from '@/features/settings/form-status'
import {
  passwordChangeSchema,
  profileNameSchema,
  type PasswordChangeValues,
  type ProfileNameValues,
} from '@/features/settings/schemas'
import {
  updateOwnFullName,
  updateOwnPassword,
} from '@/features/settings/profile-api'
import { useAuth } from '@/hooks/use-auth'
import { ROLE_LABELS } from '@/types/roles'

export function ProfileSection() {
  const { user, refreshUser } = useAuth()
  const [nameStatus, setNameStatus] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const nameForm = useForm<ProfileNameValues>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
    },
    values: {
      fullName: user?.fullName ?? '',
    },
  })

  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  if (!user) {
    return null
  }

  async function handleNameSubmit(values: ProfileNameValues) {
    setNameStatus(null)
    try {
      await updateOwnFullName(values.fullName)
      await refreshUser()
      setNameStatus({
        tone: 'success',
        message: 'El nombre se actualizó correctamente.',
      })
    } catch (error) {
      setNameStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar el nombre.',
      })
    }
  }

  async function handlePasswordSubmit(values: PasswordChangeValues) {
    if (!user) {
      return
    }

    setPasswordStatus(null)
    try {
      await updateOwnPassword({
        email: user.email,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      setPasswordStatus({
        tone: 'success',
        message: 'La contraseña se actualizó correctamente.',
      })
    } catch (error) {
      setPasswordStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar la contraseña.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nombre</CardTitle>
          <CardDescription>
            Este nombre aparece en el menú y en toda la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm">
            <p className="font-medium text-foreground">{user.fullName}</p>
            <p className="text-muted-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
          <Form {...nameForm}>
            <form
              className="space-y-4"
              onSubmit={nameForm.handleSubmit(handleNameSubmit)}
            >
              <FormField
                control={nameForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input className="h-10 rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {nameStatus ? (
                <FormStatus tone={nameStatus.tone} message={nameStatus.message} />
              ) : null}
              <Button
                type="submit"
                className="rounded-lg"
                disabled={nameForm.formState.isSubmitting}
              >
                {nameForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  'Guardar nombre'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu contraseña actual y la nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        className="h-10 rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        className="h-10 rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        className="h-10 rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {passwordStatus ? (
                <FormStatus
                  tone={passwordStatus.tone}
                  message={passwordStatus.message}
                />
              ) : null}
              <Button
                type="submit"
                className="rounded-lg"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Actualizando…
                  </>
                ) : (
                  'Actualizar contraseña'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
