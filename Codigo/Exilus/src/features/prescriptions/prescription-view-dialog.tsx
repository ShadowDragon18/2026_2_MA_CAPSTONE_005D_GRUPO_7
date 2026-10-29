import { Download, Mail, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PrescriptionSheet } from '@/features/prescriptions/prescription-sheet'
import type { Prescription } from '@/types/prescription'

interface PrescriptionViewDialogProps {
  prescription: Prescription | null
  clinicName: string
  canPrint: boolean
  canDownloadPdf: boolean
  canSendEmail: boolean
  onOpenChange: (open: boolean) => void
  onPrint: (record: Prescription) => void
  onDownloadPdf: (record: Prescription) => void
  onSendEmail: (record: Prescription) => void
}

export function PrescriptionViewDialog({
  prescription,
  clinicName,
  canPrint,
  canDownloadPdf,
  canSendEmail,
  onOpenChange,
  onPrint,
  onDownloadPdf,
  onSendEmail,
}: PrescriptionViewDialogProps) {
  return (
    <Dialog open={prescription !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receta oftalmológica</DialogTitle>
          <DialogDescription>
            Vista lista para imprimir, descargar o enviar.
          </DialogDescription>
        </DialogHeader>

        {prescription ? (
          <PrescriptionSheet
            prescription={prescription}
            clinicName={clinicName}
          />
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          {prescription && canPrint ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onPrint(prescription)}
            >
              <Printer className="size-3.5" />
              Imprimir
            </Button>
          ) : null}
          {prescription && canDownloadPdf ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onDownloadPdf(prescription)}
            >
              <Download className="size-3.5" />
              Descargar PDF
            </Button>
          ) : null}
          {prescription && canSendEmail ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onSendEmail(prescription)}
            >
              <Mail className="size-3.5" />
              Enviar por correo
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
