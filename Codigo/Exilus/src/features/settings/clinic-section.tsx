import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  clinicSettingsSchema,
  type ClinicSettingsValues,
} from '@/features/settings/schemas'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import { FALLBACK_CLINIC_SETTINGS, HEX_COLOR_PATTERN } from '@/types/clinic'

const MAX_QUICK_COLORS = 12

export function ClinicSection() {
  const { settings, save } = useClinicSettings()
  const [quickColors, setQuickColors] = useState<string[]>(settings.quickColors)
  const [status, setStatus] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const form = useForm<ClinicSettingsValues>({
    resolver: zodResolver(clinicSettingsSchema),
    values: {
      clinicName: settings.clinicName,
      defaultAmount: String(settings.defaultAmount),
      defaultCaptadorAmount: String(settings.defaultCaptadorAmount),
    },
  })

  useEffect(() => {
    setQuickColors(settings.quickColors)
  }, [settings.quickColors])

  async function handleSubmit(values: ClinicSettingsValues) {
    setStatus(null)
    const colors = quickColors.filter((color) => HEX_COLOR_PATTERN.test(color))

    if (colors.length === 0) {
      setStatus({
        tone: 'error',
        message: 'Agrega al menos un color rápido válido.',
      })
      return
    }

    try {
      await save({
        clinicName: values.clinicName,
        defaultAmount: Number(values.defaultAmount.replace(',', '.')),
        defaultCaptadorAmount: Number(
          values.defaultCaptadorAmount.replace(',', '.'),
        ),
        quickColors: colors.map((color) => color.toUpperCase()),
      })
      setStatus({
        tone: 'success',
        message: 'La configuración de la clínica se guardó correctamente.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No fue posible guardar la configuración.',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clínica</CardTitle>
        <CardDescription>
          Estos valores se usan en pacientes y captadores nuevos, y en los
          colores rápidos. Los registros anteriores no se modifican.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="clinicName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la clínica</FormLabel>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto predeterminado del paciente</FormLabel>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultCaptadorAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio predeterminado del captador</FormLabel>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Colores rápidos</p>
                <p className="text-xs text-muted-foreground">
                  Aparecen en Consulta. Cambiar la paleta no altera colores ya
                  asignados a pacientes.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickColors.map((color, index) => (
                  <div key={`${color}-${index}`} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={HEX_COLOR_PATTERN.test(color) ? color : '#2563EB'}
                      onChange={(event) => {
                        const next = [...quickColors]
                        next[index] = event.target.value.toUpperCase()
                        setQuickColors(next)
                      }}
                      className="size-10 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                      aria-label={`Color ${index + 1}`}
                    />
                    <Input
                      value={color}
                      onChange={(event) => {
                        const next = [...quickColors]
                        next[index] = event.target.value.toUpperCase()
                        setQuickColors(next)
                      }}
                      className="h-10 rounded-lg font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar color"
                      disabled={quickColors.length <= 1}
                      onClick={() => {
                        setQuickColors(
                          quickColors.filter((_, colorIndex) => colorIndex !== index),
                        )
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                disabled={quickColors.length >= MAX_QUICK_COLORS}
                onClick={() => {
                  setQuickColors([
                    ...quickColors,
                    FALLBACK_CLINIC_SETTINGS.quickColors[
                      quickColors.length %
                        FALLBACK_CLINIC_SETTINGS.quickColors.length
                    ],
                  ])
                }}
              >
                <Plus className="size-4" />
                Agregar color
              </Button>
            </div>

            {status ? (
              <FormStatus tone={status.tone} message={status.message} />
            ) : null}

            <Button
              type="submit"
              className="rounded-lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Guardar clínica'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
