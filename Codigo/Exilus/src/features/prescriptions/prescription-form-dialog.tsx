import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, type Control } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { formatShortDate } from '@/lib/format'
import {
  getPrescriptionFormDefaults,
  prescriptionFormSchema,
  type PrescriptionFormValues,
} from '@/features/prescriptions/schema'
import {
  getCandidateConsultationLabel,
  getCandidateLabel,
  getPrescriptionDocumentLabel,
  getPrescriptionPatientName,
  numberToInput,
} from '@/features/prescriptions/utils'
import type { Prescription, PrescriptionCandidate } from '@/types/prescription'

interface PrescriptionFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  prescription: Prescription | null
  candidates: PrescriptionCandidate[]
  presetPatientId: string | null
  presetConsultationId: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PrescriptionFormValues) => Promise<void>
}

function opticalFromCandidate(
  candidate: PrescriptionCandidate | null,
): Pick<
  PrescriptionFormValues,
  | 'odSphere'
  | 'odCylinder'
  | 'odAxis'
  | 'oiSphere'
  | 'oiCylinder'
  | 'oiAxis'
  | 'dp'
  | 'addValue'
> {
  return {
    odSphere: numberToInput(candidate?.odSphere ?? null),
    odCylinder: numberToInput(candidate?.odCylinder ?? null),
    odAxis: numberToInput(candidate?.odAxis ?? null),
    oiSphere: numberToInput(candidate?.oiSphere ?? null),
    oiCylinder: numberToInput(candidate?.oiCylinder ?? null),
    oiAxis: numberToInput(candidate?.oiAxis ?? null),
    dp: numberToInput(candidate?.dp ?? null),
    addValue: numberToInput(candidate?.addValue ?? null),
  }
}

function toEditValues(prescription: Prescription): PrescriptionFormValues {
  return {
    patientId: prescription.patientId,
    consultationId: prescription.consultationId,
    odSphere: numberToInput(prescription.odSphere),
    odCylinder: numberToInput(prescription.odCylinder),
    odAxis: numberToInput(prescription.odAxis),
    oiSphere: numberToInput(prescription.oiSphere),
    oiCylinder: numberToInput(prescription.oiCylinder),
    oiAxis: numberToInput(prescription.oiAxis),
    dp: numberToInput(prescription.dp),
    addValue: numberToInput(prescription.addValue),
    observations: prescription.observations ?? '',
    indications: prescription.indications ?? '',
  }
}

export function PrescriptionFormDialog({
  open,
  mode,
  prescription,
  candidates,
  presetPatientId,
  presetConsultationId,
  onOpenChange,
  onSubmit,
}: PrescriptionFormDialogProps) {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: getPrescriptionFormDefaults(),
  })

  const patientId = form.watch('patientId')
  const consultationId = form.watch('consultationId')

  const selectedCandidate = useMemo(() => {
    if (consultationId) {
      return (
        candidates.find((candidate) => candidate.consultationId === consultationId) ??
        null
      )
    }
    return candidates.find((candidate) => candidate.patientId === patientId) ?? null
  }, [candidates, consultationId, patientId])

  const uniquePatients = useMemo(() => {
    const seen = new Set<string>()
    return candidates.filter((candidate) => {
      if (seen.has(candidate.patientId)) {
        return false
      }
      seen.add(candidate.patientId)
      return true
    })
  }, [candidates])

  const patientConsultations = useMemo(
    () => candidates.filter((candidate) => candidate.patientId === patientId),
    [candidates, patientId],
  )

  const lockedSelection = mode === 'edit' || Boolean(presetPatientId)

  useEffect(() => {
    if (!open) {
      return
    }

    if (mode === 'edit' && prescription) {
      form.reset(toEditValues(prescription))
      return
    }

    const initialPatientId = presetPatientId ?? ''
    const matching =
      (presetConsultationId
        ? candidates.find(
            (candidate) => candidate.consultationId === presetConsultationId,
          )
        : null) ??
      candidates.find((candidate) => candidate.patientId === initialPatientId) ??
      null

    form.reset({
      ...getPrescriptionFormDefaults(),
      patientId: matching?.patientId ?? initialPatientId,
      consultationId: matching?.consultationId ?? '',
      ...opticalFromCandidate(matching),
    })
  }, [candidates, form, mode, open, presetConsultationId, presetPatientId, prescription])

  useEffect(() => {
    if (!open || mode !== 'create' || lockedSelection || !patientId) {
      return
    }

    const matching =
      patientConsultations.find(
        (candidate) => candidate.consultationId === consultationId,
      ) ?? patientConsultations[0] ?? null

    if (!matching) {
      form.setValue('consultationId', '')
      return
    }

    if (matching.consultationId !== consultationId) {
      form.setValue('consultationId', matching.consultationId)
    }

    const optical = opticalFromCandidate(matching)
    form.setValue('odSphere', optical.odSphere)
    form.setValue('odCylinder', optical.odCylinder)
    form.setValue('odAxis', optical.odAxis)
    form.setValue('oiSphere', optical.oiSphere)
    form.setValue('oiCylinder', optical.oiCylinder)
    form.setValue('oiAxis', optical.oiAxis)
    form.setValue('dp', optical.dp)
    form.setValue('addValue', optical.addValue)
  }, [
    consultationId,
    form,
    lockedSelection,
    mode,
    open,
    patientConsultations,
    patientId,
  ])

  const reference = prescription ?? selectedCandidate
  const canSave = Boolean(form.watch('patientId') && form.watch('consultationId'))

  async function handleSubmit(values: PrescriptionFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar receta' : 'Nueva receta'}
          </DialogTitle>
          <DialogDescription>
            Los valores se copian desde la consulta y puedes ajustarlos sin
            modificar la consulta original.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            {mode === 'create' && !presetPatientId ? (
              <>
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente</FormLabel>
                      <FormControl>
                        <NativeSelect
                          className="h-10"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <option value="">Selecciona un paciente</option>
                          {uniquePatients.map((candidate) => (
                            <option
                              key={candidate.patientId}
                              value={candidate.patientId}
                            >
                              {getCandidateLabel(candidate)}
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
                  name="consultationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consulta</FormLabel>
                      <FormControl>
                        <NativeSelect
                          className="h-10"
                          value={field.value}
                          disabled={!patientId}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <option value="">Selecciona una consulta</option>
                          {patientConsultations.map((candidate) => (
                            <option
                              key={candidate.consultationId}
                              value={candidate.consultationId}
                            >
                              {getCandidateConsultationLabel(candidate)}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            {reference ? (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  {getPrescriptionPatientName(reference)}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {getPrescriptionDocumentLabel(reference)}
                  {reference.age !== null ? ` · ${reference.age} años` : ''}
                  {' · '}
                  {formatShortDate(
                    'prescriptionDate' in reference
                      ? reference.prescriptionDate
                      : new Date().toISOString(),
                  )}
                </p>
              </div>
            ) : null}

            {mode === 'create' && patientId && patientConsultations.length === 0 ? (
              <p className="text-sm text-destructive">
                Este paciente no tiene una consulta. Crea la consulta primero.
              </p>
            ) : null}

            <div className="grid gap-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">OD</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <OpticalField control={form.control} name="odSphere" label="Esfera" placeholder="-1.00" />
                <OpticalField control={form.control} name="odCylinder" label="Cilindro" placeholder="-0.50" />
                <OpticalField control={form.control} name="odAxis" label="Eje" placeholder="90" integer />
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">OI</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <OpticalField control={form.control} name="oiSphere" label="Esfera" placeholder="-0.75" />
                <OpticalField control={form.control} name="oiCylinder" label="Cilindro" placeholder="-0.25" />
                <OpticalField control={form.control} name="oiAxis" label="Eje" placeholder="80" integer />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <OpticalField control={form.control} name="dp" label="DP" />
              <OpticalField control={form.control} name="addValue" label="ADD" />
            </div>

            <FormField
              control={form.control}
              name="indications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicaciones</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                disabled={form.formState.isSubmitting || !canSave}
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

function OpticalField({
  control,
  name,
  label,
  placeholder,
  integer = false,
}: {
  control: Control<PrescriptionFormValues>
  name:
    | 'odSphere'
    | 'odCylinder'
    | 'odAxis'
    | 'oiSphere'
    | 'oiCylinder'
    | 'oiAxis'
    | 'dp'
    | 'addValue'
  label: string
  placeholder?: string
  integer?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              className="h-10 rounded-lg"
              inputMode={integer ? 'numeric' : 'decimal'}
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
