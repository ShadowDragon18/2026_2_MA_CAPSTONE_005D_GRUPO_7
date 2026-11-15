import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getPatientFullName } from '@/features/patients/utils'
import type { Patient } from '@/types/patient'

interface StartNewVisitDialogProps {
  patient: Patient | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function StartNewVisitDialog({
  patient,
  onOpenChange,
  onConfirm,
}: StartNewVisitDialogProps) {
  return (
    <AlertDialog open={patient !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nueva consulta</AlertDialogTitle>
          <AlertDialogDescription>
            {patient
              ? `¿Iniciar una nueva atención para ${getPatientFullName(patient)}? La consulta anterior se conserva.`
              : '¿Iniciar una nueva atención? La consulta anterior se conserva.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="rounded-lg" onClick={onConfirm}>
            Iniciar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
