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
import { getConsultationPatientName } from '@/features/consultations/utils'
import type { ConsultationRecord } from '@/types/consultation'

interface DeleteConsultationDialogProps {
  record: ConsultationRecord | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteConsultationDialog({
  record,
  onOpenChange,
  onConfirm,
}: DeleteConsultationDialogProps) {
  return (
    <AlertDialog open={record !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar consulta</AlertDialogTitle>
          <AlertDialogDescription>
            {record
              ? `¿Seguro que deseas eliminar los datos clínicos de ${getConsultationPatientName(record)}? El paciente seguirá en Pacientes.`
              : '¿Seguro que deseas eliminar esta consulta?'}
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
