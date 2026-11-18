import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ColorPickerField } from '@/components/color-picker-field'
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
        <CardTitle>Consulta oftalmológica</CardTitle>
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
                  <FormLabel>Nombre de la Consulta Oftalmológica</FormLabel>
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
                  <ColorPickerField
                    key={index}
                    value={HEX_COLOR_PATTERN.test(color) ? color : '#2563EB'}
                    label={`Color ${index + 1}`}
                    canRemove={quickColors.length > 1}
                    onChange={(nextColor) => {
                      const next = [...quickColors]
                      next[index] = nextColor
                      setQuickColors(next)
                    }}
                    onRemove={() => {
                      setQuickColors(
                        quickColors.filter((_, colorIndex) => colorIndex !== index),
                      )
                    }}
                  />
                ))}
                {quickColors.length < MAX_QUICK_COLORS ? (
                  <button
                    type="button"
                    className="flex min-h-[4.25rem] items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-foreground"
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
                  </button>
                ) : null}
              </div>
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
                'Guardar configuración'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
