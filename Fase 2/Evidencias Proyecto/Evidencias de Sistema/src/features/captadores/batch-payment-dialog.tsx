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
  batchCaptadorPaymentSchema,
  getBatchCaptadorPaymentDefaults,
  type BatchCaptadorPaymentValues,
} from '@/features/captadores/schema'
import { CAPTADOR_PAYMENT_STATUSES } from '@/types/captador'

interface BatchCaptadorPaymentDialogProps {
  open: boolean
  selectedCount: number
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BatchCaptadorPaymentValues) => Promise<void>
}

export function BatchCaptadorPaymentDialog({
  open,
  selectedCount,
  onOpenChange,
  onSubmit,
}: BatchCaptadorPaymentDialogProps) {
  const form = useForm<BatchCaptadorPaymentValues>({
    resolver: zodResolver(batchCaptadorPaymentSchema),
    defaultValues: getBatchCaptadorPaymentDefaults(),
  })

  useEffect(() => {
    if (open) {
      form.reset(getBatchCaptadorPaymentDefaults())
    }
  }, [form, open])

  const countLabel =
    selectedCount === 1
      ? '1 fila seleccionada'
      : `${selectedCount} filas seleccionadas`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar en lote</DialogTitle>
          <DialogDescription>
            Cambia el estado de pago de {countLabel} a Pagado o Por pagar.
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
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de pago</FormLabel>
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
