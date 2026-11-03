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
import { Textarea } from '@/components/ui/textarea'
import {
  consultationFormSchema,
  getConsultationFormDefaults,
  type ConsultationFormValues,
} from '@/features/consultations/schema'
import {
  getConsultationDocumentLabel,
  getConsultationPatientName,
} from '@/features/consultations/utils'
import { formatShortDate } from '@/lib/format'
import type { ConsultationRecord } from '@/types/consultation'

interface ConsultationFormDialogProps {
  open: boolean
  record: ConsultationRecord | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ConsultationFormValues) => Promise<void>
}

function numberToInput(value: number | null): string {
  return value === null ? '' : String(value)
}

function toFormValues(record: ConsultationRecord): ConsultationFormValues {
  const clinical = record.consultation
  if (!clinical) {
    return getConsultationFormDefaults()
  }

  return {
    oiSphere: numberToInput(clinical.oiSphere),
    oiCylinder: numberToInput(clinical.oiCylinder),
    oiAxis: numberToInput(clinical.oiAxis),
    odSphere: numberToInput(clinical.odSphere),
    odCylinder: numberToInput(clinical.odCylinder),
    odAxis: numberToInput(clinical.odAxis),
    dp: numberToInput(clinical.dp),
    addValue: numberToInput(clinical.addValue),
    glucoseMgDl: numberToInput(clinical.glucoseMgDl),
    medicalObservations: clinical.medicalObservations ?? '',
  }
}

export function ConsultationFormDialog({
  open,
  record,
  onOpenChange,
  onSubmit,
}: ConsultationFormDialogProps) {
  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: getConsultationFormDefaults(),
  })

  useEffect(() => {
    if (!open || !record) {
      return
    }

    form.reset(toFormValues(record))
  }, [form, open, record])

  async function handleSubmit(values: ConsultationFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {record?.consultation ? 'Editar consulta' : 'Nueva consulta'}
          </DialogTitle>
          <DialogDescription>
            {record?.consultation
              ? 'Solo se modifican los datos oftalmológicos. Los datos del paciente se muestran como referencia.'
              : 'Registra los datos oftalmológicos de esta atención. Los datos del paciente se muestran como referencia.'}
          </DialogDescription>
        </DialogHeader>

        {record ? (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {getConsultationPatientName(record)}
            </p>
            <p className="mt-1 text-muted-foreground">
              {getConsultationDocumentLabel(record)} ·{' '}
              {formatShortDate(record.registeredAt)}
              {record.age !== null ? ` · ${record.age} años` : ''}
            </p>
            <p className="mt-1 text-muted-foreground">
              Condición: {record.condition ?? '—'}
            </p>
          </div>
        ) : null}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">OD</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="odSphere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esfera</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-lg"
                          inputMode="decimal"
                          placeholder="-1.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="odCylinder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cilindro</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-lg"
                          inputMode="decimal"
                          placeholder="-0.50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="odAxis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eje</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-lg"
                          inputMode="numeric"
                          placeholder="90"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">OI</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="oiSphere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esfera</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-lg"
                          inputMode="decimal"
                          placeholder="-0.75"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oiCylinder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cilindro</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-lg"
                          inputMode="decimal"
                          placeholder="-0.25"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oiAxis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eje</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-lg"
                          inputMode="numeric"
                          placeholder="80"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="dp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DP</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 rounded-lg"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ADD</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 rounded-lg"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="glucoseMgDl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MG/DL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-10 rounded-lg pr-16"
                          inputMode="numeric"
                          {...field}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                          mg/dL
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="medicalObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones médicas</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
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
                {form.formState.isSubmitting ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
