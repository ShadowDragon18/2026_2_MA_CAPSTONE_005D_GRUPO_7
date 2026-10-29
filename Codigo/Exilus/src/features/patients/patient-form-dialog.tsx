import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NativeSelect } from '@/components/native-select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { listCaptadores } from '@/features/captadores/api'
import { getCaptadorFullName } from '@/features/captadores/utils'
import { listOpticalOptions } from '@/features/optics/api'
import {
  getPatientFormDefaults,
  patientFormSchema,
  type PatientFormValues,
} from '@/features/patients/schema'
import { isoToTimeInput } from '@/features/patients/time'
import {
  matchCaptadorId,
  matchOpticalId,
} from '@/features/patients/utils'
import { useClinicSettings } from '@/hooks/use-clinic-settings'
import { cn } from '@/lib/utils'
import type { Captador } from '@/types/captador'
import type { OpticalOption } from '@/types/optical'
import type { Patient } from '@/types/patient'
import {
  BENEFIT_TYPES,
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '@/types/patient'

interface PatientFormDialogProps {
  open: boolean
  patient: Patient | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PatientFormValues) => Promise<void>
}

function RequirementHint({ required }: { required: boolean }) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium',
        required ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {required ? 'Obligatorio' : 'Opcional'}
    </span>
  )
}

function FieldTitle({
  children,
  required,
}: {
  children: string
  required: boolean
}) {
  return (
    <FormLabel className="flex items-center justify-between gap-2">
      {children}
      <RequirementHint required={required} />
    </FormLabel>
  )
}

function toFormValues(
  patient: Patient,
  opticals: OpticalOption[],
  captadores: Captador[],
): PatientFormValues {
  const opticalId = matchOpticalId(patient.opticalName, opticals)

  return {
    documentType: patient.documentType,
    documentNumber: patient.documentNumber ?? '',
    firstName: patient.firstName,
    middleName: patient.middleName ?? '',
    lastName: patient.lastName ?? '',
    secondLastName: patient.secondLastName ?? '',
    age: patient.age === null ? '' : String(patient.age),
    benefit: patient.benefit ?? '',
    opticalId,
    captadorId: matchCaptadorId(patient, captadores, opticalId),
    amount: String(patient.amount),
    paymentMethod: patient.paymentMethod ?? '',
    paymentStatus: patient.paymentStatus ?? '',
    generalObservation: patient.generalObservation ?? '',
    condition: patient.condition ?? '',
    email: patient.email ?? '',
    automaticTime: true,
    entryTime: isoToTimeInput(patient.entryTime),
    exitTime: isoToTimeInput(patient.exitTime),
  }
}

export function PatientFormDialog({
  open,
  patient,
  onOpenChange,
  onSubmit,
}: PatientFormDialogProps) {
  const isEditing = patient !== null
  const { settings } = useClinicSettings()
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: getPatientFormDefaults(),
  })
  const documentType = form.watch('documentType')
  const automaticTime = form.watch('automaticTime')
  const opticalId = form.watch('opticalId')
  const isForeignDocument = documentType === 'Extranjero'
  const isDocumentRequired = !isForeignDocument
  const [opticals, setOpticals] = useState<OpticalOption[]>([])
  const [captadores, setCaptadores] = useState<Captador[]>([])
  const captadoresForOptical = useMemo(
    () => captadores.filter((captador) => captador.opticalId === opticalId),
    [captadores, opticalId],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    void Promise.all([listOpticalOptions(), listCaptadores()])
      .then(([nextOpticals, nextCaptadores]) => {
        if (!cancelled) {
          setOpticals(nextOpticals)
          setCaptadores(nextCaptadores)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOpticals([])
          setCaptadores([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      patient
        ? toFormValues(patient, opticals, captadores)
        : {
            ...getPatientFormDefaults(),
            amount: String(settings.defaultAmount),
          },
    )
  }, [form, open, patient, settings.defaultAmount])

  useEffect(() => {
    if (!open || !patient) {
      return
    }

    const nextOpticalId = matchOpticalId(patient.opticalName, opticals)
    form.setValue('opticalId', nextOpticalId)
    form.setValue(
      'captadorId',
      matchCaptadorId(patient, captadores, nextOpticalId),
    )
  }, [form, open, patient, opticals, captadores])

  async function handleSubmit(values: PatientFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar paciente' : 'Nuevo paciente'}
          </DialogTitle>
          <DialogDescription>
            Solo el tipo de documento, el RUT o pasaporte y el primer nombre son
            obligatorios. El resto se puede completar después; el registro
            quedará marcado en ámbar hasta terminarlo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required>Tipo de documento</FieldTitle>
                  <FormControl>
                    <NativeSelect
                      {...field}
                      onChange={(event) => {
                        const nextType = event.target.value
                        field.onChange(event)
                        if (nextType === 'Extranjero') {
                          form.setValue('documentNumber', '')
                          form.clearErrors('documentNumber')
                        }
                      }}
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
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
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={isDocumentRequired}>
                    {documentType === 'Passport'
                      ? 'Pasaporte'
                      : documentType === 'RUT'
                        ? 'RUT'
                        : 'Número de documento'}
                  </FieldTitle>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg"
                      placeholder={
                        isForeignDocument
                          ? 'No aplica'
                          : documentType === 'Passport'
                            ? 'Ingresa el pasaporte'
                            : 'Ingresa el RUT'
                      }
                      disabled={isForeignDocument}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required>Primer nombre</FieldTitle>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Segundo nombre</FieldTitle>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
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
                  <FieldTitle required={false}>Primer apellido</FieldTitle>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondLastName"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Segundo apellido</FieldTitle>
                  <FormControl>
                    <Input className="h-10 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Correo</FieldTitle>
                  <FormControl>
                    <Input
                      type="email"
                      className="h-10 rounded-lg"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Edad</FieldTitle>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg"
                      inputMode="numeric"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefit"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Prestación</FieldTitle>
                  <FormControl>
                    <NativeSelect {...field}>
                      <option value="">Seleccionar</option>
                      {BENEFIT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
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
              name="opticalId"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Óptica</FieldTitle>
                  <FormControl>
                    <NativeSelect
                      {...field}
                      onChange={(event) => {
                        field.onChange(event)
                        form.setValue('captadorId', '')
                        form.clearErrors('captadorId')
                      }}
                    >
                      <option value="">Seleccionar óptica</option>
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
              name="captadorId"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Captador</FieldTitle>
                  <FormControl>
                    <NativeSelect {...field} disabled={!opticalId}>
                      <option value="">
                        {!opticalId
                          ? 'Selecciona una óptica primero'
                          : captadoresForOptical.length === 0
                            ? 'No hay captadores en esta óptica'
                            : 'Seleccionar captador'}
                      </option>
                      {captadoresForOptical.map((captador) => (
                        <option key={captador.id} value={captador.id}>
                          {getCaptadorFullName(captador)}
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
                  <FieldTitle required={false}>Monto</FieldTitle>
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
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FieldTitle required={false}>Modo de pago</FieldTitle>
                  <FormControl>
                    <NativeSelect {...field}>
                      <option value="">Seleccionar</option>
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
                  <FieldTitle required={false}>Estado de pago</FieldTitle>
                  <FormControl>
                    <NativeSelect {...field}>
                      <option value="">Seleccionar</option>
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

            <FormField
              control={form.control}
              name="automaticTime"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 rounded-lg border border-border px-3 py-2 sm:col-span-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="font-medium">Hora automática</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Si está activa, Inicio y Finalizar guardan la hora actual.
                      Desactívala para ingresar o corregir las horas a mano.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {automaticTime ? null : (
              <>
                <FormField
                  control={form.control}
                  name="entryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FieldTitle required={false}>H. entrada</FieldTitle>
                      <FormControl>
                        <Input
                          type="time"
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
                  name="exitTime"
                  render={({ field }) => (
                    <FormItem>
                      <FieldTitle required={false}>H. salida</FieldTitle>
                      <FormControl>
                        <Input
                          type="time"
                          className="h-10 rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="generalObservation"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FieldTitle required={false}>Observación general</FieldTitle>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FieldTitle required={false}>Condición</FieldTitle>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:col-span-2">
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
                {form.formState.isSubmitting
                  ? 'Guardando…'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear paciente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
