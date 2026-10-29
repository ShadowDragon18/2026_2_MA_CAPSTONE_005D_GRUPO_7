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
import { getCaptadorEntryName } from '@/features/captadores/utils'
import type { CaptadorEntry } from '@/types/captador'

interface DeleteCaptadorEntryDialogProps {
  entry: CaptadorEntry | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteCaptadorEntryDialog({
  entry,
  onOpenChange,
  onConfirm,
}: DeleteCaptadorEntryDialogProps) {
  const name = entry ? getCaptadorEntryName(entry) : 'esta captación'

  return (
    <AlertDialog open={entry !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar captación</AlertDialogTitle>
          <AlertDialogDescription>
            {entry?.patientName
              ? `¿Seguro que deseas eliminar la captación de ${name} por ${entry.patientName}? Esta acción no se puede deshacer.`
              : `¿Seguro que deseas eliminar la captación de ${name}? Esta acción no se puede deshacer.`}
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
