import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
  getOpticalFormDefaults,
  opticalFormSchema,
  type OpticalFormValues,
} from '@/features/optics/schema'
import type { Optical } from '@/types/optical'

interface OpticalFormDialogProps {
  open: boolean
  optical: Optical | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: OpticalFormValues) => Promise<void>
}

export function OpticalFormDialog({
  open,
  optical,
  onOpenChange,
  onSubmit,
}: OpticalFormDialogProps) {
  const form = useForm<OpticalFormValues>({
    resolver: zodResolver(opticalFormSchema),
    defaultValues: getOpticalFormDefaults(),
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      optical
        ? { name: optical.name }
        : getOpticalFormDefaults(),
    )
  }, [form, open, optical])

  async function handleSubmit(values: OpticalFormValues) {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {optical ? 'Editar óptica' : 'Nueva óptica'}
          </DialogTitle>
          <DialogDescription>
            {optical
              ? 'Actualiza el nombre de la óptica.'
              : 'Registra una óptica para asignar captadores.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
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
                      placeholder="Nombre de la óptica"
                      {...field}
                    />
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
                disabled={form.formState.isSubmitting}
              >
                {optical ? 'Guardar' : 'Crear óptica'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
