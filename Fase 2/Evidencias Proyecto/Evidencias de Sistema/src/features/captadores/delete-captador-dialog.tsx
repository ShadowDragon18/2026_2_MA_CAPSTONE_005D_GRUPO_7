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
import { getCaptadorFullName } from '@/features/captadores/utils'
import type { Captador } from '@/types/captador'

interface DeleteCaptadorDialogProps {
  captador: Captador | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteCaptadorDialog({
  captador,
  onOpenChange,
  onConfirm,
}: DeleteCaptadorDialogProps) {
  return (
    <AlertDialog open={captador !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar captador</AlertDialogTitle>
          <AlertDialogDescription>
            {captador
              ? `¿Seguro que deseas eliminar a ${getCaptadorFullName(captador)}? Esta acción no se puede deshacer.`
              : '¿Seguro que deseas eliminar este captador?'}
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
