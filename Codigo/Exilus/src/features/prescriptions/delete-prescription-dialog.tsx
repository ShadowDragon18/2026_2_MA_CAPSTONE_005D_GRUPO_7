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
import { getPrescriptionPatientName } from '@/features/prescriptions/utils'
import type { Prescription } from '@/types/prescription'

interface DeletePrescriptionDialogProps {
  prescription: Prescription | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeletePrescriptionDialog({
  prescription,
  onOpenChange,
  onConfirm,
}: DeletePrescriptionDialogProps) {
  return (
    <AlertDialog open={prescription !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar receta</AlertDialogTitle>
          <AlertDialogDescription>
            {prescription
              ? `¿Seguro que deseas eliminar la receta de ${getPrescriptionPatientName(prescription)}? Esta acción no se puede deshacer.`
              : '¿Seguro que deseas eliminar esta receta?'}
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
