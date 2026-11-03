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

interface DeletePatientDialogProps {
  patient: Patient | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeletePatientDialog({
  patient,
  onOpenChange,
  onConfirm,
}: DeletePatientDialogProps) {
  return (
    <AlertDialog open={patient !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar paciente</AlertDialogTitle>
          <AlertDialogDescription>
            {patient
              ? `¿Seguro que deseas eliminar a ${getPatientFullName(patient)}? Esta acción no se puede deshacer.`
              : '¿Seguro que deseas eliminar este paciente?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-lg"
            onClick={onConfirm}
          >
            Borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
