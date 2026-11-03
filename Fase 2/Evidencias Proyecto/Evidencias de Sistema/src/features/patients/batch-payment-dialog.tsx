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
import {
  batchPaymentFormSchema,
  getBatchPaymentFormDefaults,
  type BatchPaymentFormValues,
} from '@/features/patients/schema'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/types/patient'

interface BatchPaymentDialogProps {
  open: boolean
  selectedCount: number
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BatchPaymentFormValues) => Promise<void>
}

export function BatchPaymentDialog({
  open,
  selectedCount,
  onOpenChange,
  onSubmit,
}: BatchPaymentDialogProps) {
  const form = useForm<BatchPaymentFormValues>({
    resolver: zodResolver(batchPaymentFormSchema),
    defaultValues: getBatchPaymentFormDefaults(),
  })

  useEffect(() => {
    if (open) {
      form.reset(getBatchPaymentFormDefaults())
    }
  }, [form, open])

  const countLabel =
    selectedCount === 1
      ? '1 paciente seleccionado'
      : `${selectedCount} pacientes seleccionados`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar en lote</DialogTitle>
          <DialogDescription>
            Actualiza el modo de pago y el estado de pago de {countLabel}. Los
            campos que dejes vacíos no se modifican.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values)
            })}
          >
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de pago</FormLabel>
                  <FormControl>
                    <NativeSelect className="rounded-lg" {...field}>
                      <option value="">Sin cambios</option>
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
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
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de pago</FormLabel>
                  <FormControl>
                    <NativeSelect className="rounded-lg" {...field}>
                      <option value="">Sin cambios</option>
                      {PAYMENT_STATUSES.map((status) => (
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
                disabled={form.formState.isSubmitting || selectedCount === 0}
              >
                Aplicar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
