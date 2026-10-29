import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/login-schema'
import { useAuth } from '@/hooks/use-auth'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

export function LoginPage() {
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)

    try {
      await login(values.email, values.password, values.remember)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión.'
      setFormError(message)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute -top-24 -left-16 size-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <BrandLogo imgClassName="h-14" />
        <div className="relative max-w-md space-y-3">
          <p className="text-sm font-medium tracking-[0.2em] text-teal-200/80 uppercase">
            {APP_NAME}
          </p>
          <h2 className="text-3xl font-semibold text-white">{APP_TAGLINE}</h2>
          <p className="text-sm leading-6 text-zinc-400">
            Una plataforma moderna para la consulta: pacientes, agenda,
            atenciones y recetas en un mismo lugar.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo imgClassName="h-12" />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Bienvenido a Exilus
              </h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="correo@exilus.cl"
                          className="h-10 rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
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

                <div className="flex items-center justify-between gap-3">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Recordarme</FormLabel>
                      </FormItem>
                    )}
                  />
                  <Link
                    to="/recuperar-contrasena"
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {formError ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="h-10 w-full rounded-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Ingresando…
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  )
}
