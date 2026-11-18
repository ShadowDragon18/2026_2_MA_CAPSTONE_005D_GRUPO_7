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
import type { Optical } from '@/types/optical'

interface DeleteOpticalDialogProps {
  optical: Optical | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteOpticalDialog({
  optical,
  onOpenChange,
  onConfirm,
}: DeleteOpticalDialogProps) {
  const hasCaptadores = Boolean(optical && optical.captadorCount > 0)

  return (
    <AlertDialog open={optical !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar óptica</AlertDialogTitle>
          <AlertDialogDescription>
            {hasCaptadores
              ? `No se puede eliminar ${optical?.name ?? 'esta óptica'} mientras tenga captadores asignados. Reasígnalos o elimínalos primero.`
              : optical
                ? `¿Seguro que deseas eliminar ${optical.name}? Esta acción no se puede deshacer.`
                : '¿Seguro que deseas eliminar esta óptica?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">
            {hasCaptadores ? 'Cerrar' : 'Cancelar'}
          </AlertDialogCancel>
          {hasCaptadores ? null : (
            <AlertDialogAction
              variant="destructive"
              className="rounded-lg"
              onClick={onConfirm}
            >
              Borrar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
