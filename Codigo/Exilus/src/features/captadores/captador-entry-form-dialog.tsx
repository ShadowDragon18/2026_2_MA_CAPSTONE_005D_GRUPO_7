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
  captadorEntryFormSchema,
  getCaptadorEntryFormDefaults,
  type CaptadorEntryFormValues,
} from '@/features/captadores/schema'
import { getCaptadorEntryName } from '@/features/captadores/utils'
import { formatShortDate } from '@/lib/format'
import {
  CAPTADOR_PAYMENT_STATUSES,
  type CaptadorEntry,
} from '@/types/captador'

interface CaptadorEntryFormDialogProps {
  open: boolean
  entry: CaptadorEntry | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CaptadorEntryFormValues) => Promise<void>
}

export function CaptadorEntryFormDialog({
  open,
  entry,
  onOpenChange,
  onSubmit,
}: CaptadorEntryFormDialogProps) {
  const form = useForm<CaptadorEntryFormValues>({
    resolver: zodResolver(captadorEntryFormSchema),
    defaultValues: getCaptadorEntryFormDefaults(),
  })

  useEffect(() => {
    if (!open || !entry) {
      return
    }

    form.reset({
      amount: String(entry.amount),
      paymentStatus: entry.paymentStatus,
    })
  }, [form, open, entry])

  async function handleSubmit(values: CaptadorEntryFormValues) {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar captación</DialogTitle>
          <DialogDescription>
            {entry
              ? `${getCaptadorEntryName(entry)} · ${entry.opticalName} · ${formatShortDate(entry.occurredAt)}`
              : 'Actualiza el precio y el estado de pago.'}
          </DialogDescription>
        </DialogHeader>

        {entry?.patientName ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Paciente: {entry.patientName}
          </p>
        ) : null}

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
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
                      autoFocus
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
                disabled={form.formState.isSubmitting || !entry}
              >
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
