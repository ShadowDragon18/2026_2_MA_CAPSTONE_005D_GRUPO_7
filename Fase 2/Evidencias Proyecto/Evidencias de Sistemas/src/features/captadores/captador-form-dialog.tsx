import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { NativeSelect } from '@/components/native-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  captadorFormSchema,
  getCaptadorFormDefaults,
  type CaptadorFormValues,
} from '@/features/captadores/schema'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import { CAPTADOR_PAYMENT_STATUSES, type Captador } from '@/types/captador'
import type { OpticalOption } from '@/types/optical'

interface CaptadorFormDialogProps {
  open: boolean
  captador: Captador | null
  opticals: OpticalOption[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CaptadorFormValues) => Promise<void>
}

export function CaptadorFormDialog({
  open,
  captador,
  opticals,
  onOpenChange,
  onSubmit,
}: CaptadorFormDialogProps) {
  const { settings } = useClinicSettings()
  const form = useForm<CaptadorFormValues>({
    resolver: zodResolver(captadorFormSchema),
    defaultValues: getCaptadorFormDefaults(settings.defaultCaptadorAmount),
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      captador
        ? {
            firstName: captador.firstName,
            lastName: captador.lastName ?? '',
            opticalId: captador.opticalId,
            amount: String(captador.amount),
            paymentStatus: captador.paymentStatus,
          }
        : getCaptadorFormDefaults(settings.defaultCaptadorAmount),
    )
  }, [form, open, captador, settings.defaultCaptadorAmount])

  async function handleSubmit(values: CaptadorFormValues) {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {captador ? 'Editar captador' : 'Nuevo captador'}
          </DialogTitle>
          <DialogDescription>
            {captador
              ? 'Actualiza los datos y la óptica asignada.'
              : 'Registra un captador y asígnalo a una óptica.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-2">
                    Nombre
                    <span className="text-[11px] font-medium text-destructive">
                      Obligatorio
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      className="rounded-lg"
                      placeholder="Nombre"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-2">
                    Apellido
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Opcional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-lg"
                      placeholder="Apellido"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opticalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-2">
                    Óptica
                    <span className="text-[11px] font-medium text-destructive">
                      Obligatorio
                    </span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect
                      className="rounded-lg"
                      {...field}
                    >
                      <option value="">Selecciona una óptica</option>
                      {opticals.map((optical) => (
                        <option key={optical.id} value={optical.id}>
                          {optical.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-2">
                    Precio
                    <span className="text-[11px] font-medium text-destructive">
                      Obligatorio
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-lg"
                      inputMode="decimal"
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-2">
                    Estado de pago
                    <span className="text-[11px] font-medium text-destructive">
                      Obligatorio
                    </span>
                  </FormLabel>
                  <FormControl>
                    <NativeSelect className="rounded-lg" {...field}>
                      {CAPTADOR_PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-lg"
                disabled={form.formState.isSubmitting || opticals.length === 0}
              >
                {captador ? 'Guardar' : 'Crear captador'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
