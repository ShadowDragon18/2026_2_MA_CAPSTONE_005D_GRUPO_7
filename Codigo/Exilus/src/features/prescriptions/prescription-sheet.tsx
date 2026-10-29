import { BrandLogo } from '@/components/brand-logo'
import { buildPrescriptionDocument } from '@/features/prescriptions/utils'
import type { Prescription } from '@/types/prescription'

interface PrescriptionSheetProps {
  prescription: Prescription
  clinicName: string
}

export function PrescriptionSheet({
  prescription,
  clinicName,
}: PrescriptionSheetProps) {
  const document = buildPrescriptionDocument(prescription, clinicName)

  return (
    <article className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-6 text-foreground">
      <header className="mb-6 flex items-center gap-4 border-b border-border pb-4">
        <BrandLogo imgClassName="h-9 w-auto object-contain object-left" />
        <div>
          <p className="text-lg font-semibold">{document.clinicName}</p>
          <p className="text-sm text-muted-foreground">Receta oftalmológica</p>
        </div>
      </header>

      <h2 className="mb-5 text-center text-sm font-semibold tracking-[0.16em]">
        RECETA OFTALMOLÓGICA
      </h2>

      <dl className="mb-6 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Paciente
          </dt>
          <dd className="font-medium">{document.patientName}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Documento
          </dt>
          <dd className="font-medium">{document.documentLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Edad
          </dt>
          <dd className="font-medium">{document.ageLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Fecha
          </dt>
          <dd className="font-medium">{document.dateLabel}</dd>
        </div>
      </dl>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-border p-3">
          <h3 className="mb-3 text-sm font-semibold">OD</h3>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Esfera</dt>
              <dd className="font-medium">{document.odSphere}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Cilindro</dt>
              <dd className="font-medium">{document.odCylinder}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Eje</dt>
              <dd className="font-medium">{document.odAxis}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border border-border p-3">
          <h3 className="mb-3 text-sm font-semibold">OI</h3>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Esfera</dt>
              <dd className="font-medium">{document.oiSphere}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Cilindro</dt>
              <dd className="font-medium">{document.oiCylinder}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Eje</dt>
              <dd className="font-medium">{document.oiAxis}</dd>
            </div>
          </dl>
        </section>
      </div>

      <dl className="mb-5 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
            DP
          </dt>
          <dd className="font-medium">{document.dp}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
            ADD
          </dt>
          <dd className="font-medium">{document.add}</dd>
        </div>
      </dl>

      <section className="mb-4">
        <h3 className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Indicaciones
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm">{document.indications}</p>
      </section>
      <section>
        <h3 className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Observaciones
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm">{document.observations}</p>
      </section>
    </article>
  )
}
