import {
  buildPrescriptionDocument,
  type PrescriptionDocumentModel,
} from '@/features/prescriptions/utils'
import type { Prescription } from '@/types/prescription'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderPrintHtml(
  document: PrescriptionDocumentModel,
  logoUrl: string,
): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Receta oftalmológica</title>
    <style>
      @page { margin: 16mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 13px;
        line-height: 1.45;
      }
      .sheet { max-width: 720px; margin: 0 auto; }
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 2px solid #111;
        padding-bottom: 16px;
        margin-bottom: 20px;
      }
      .logo {
        height: 48px;
        width: auto;
        background: #000;
        border-radius: 8px;
        padding: 4px 8px;
      }
      .clinic { font-size: 18px; font-weight: 700; }
      h1 {
        margin: 0 0 20px;
        font-size: 16px;
        letter-spacing: 0.08em;
        text-align: center;
      }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; }
      .label { color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      .value { font-size: 14px; font-weight: 600; }
      .eyes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .eye {
        border: 1px solid #d4d4d4;
        border-radius: 10px;
        padding: 12px;
      }
      .eye h2 { margin: 0 0 10px; font-size: 13px; }
      .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .extra { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .block { margin-bottom: 16px; }
      .block p { margin: 6px 0 0; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <img class="logo" src="${escapeHtml(logoUrl)}" alt="Exilus" />
        <div>
          <div class="clinic">${escapeHtml(document.clinicName)}</div>
          <div>Receta oftalmológica</div>
        </div>
      </div>
      <h1>RECETA OFTALMOLÓGICA</h1>
      <div class="meta">
        <div>
          <div class="label">Paciente</div>
          <div class="value">${escapeHtml(document.patientName)}</div>
        </div>
        <div>
          <div class="label">Documento</div>
          <div class="value">${escapeHtml(document.documentLabel)}</div>
        </div>
        <div>
          <div class="label">Edad</div>
          <div class="value">${escapeHtml(document.ageLabel)}</div>
        </div>
        <div>
          <div class="label">Fecha</div>
          <div class="value">${escapeHtml(document.dateLabel)}</div>
        </div>
      </div>
      <div class="eyes">
        <section class="eye">
          <h2>OD</h2>
          <div class="metrics">
            <div><div class="label">Esfera</div><div class="value">${escapeHtml(document.odSphere)}</div></div>
            <div><div class="label">Cilindro</div><div class="value">${escapeHtml(document.odCylinder)}</div></div>
            <div><div class="label">Eje</div><div class="value">${escapeHtml(document.odAxis)}</div></div>
          </div>
        </section>
        <section class="eye">
          <h2>OI</h2>
          <div class="metrics">
            <div><div class="label">Esfera</div><div class="value">${escapeHtml(document.oiSphere)}</div></div>
            <div><div class="label">Cilindro</div><div class="value">${escapeHtml(document.oiCylinder)}</div></div>
            <div><div class="label">Eje</div><div class="value">${escapeHtml(document.oiAxis)}</div></div>
          </div>
        </section>
      </div>
      <div class="extra">
        <div><div class="label">DP</div><div class="value">${escapeHtml(document.dp)}</div></div>
        <div><div class="label">ADD</div><div class="value">${escapeHtml(document.add)}</div></div>
      </div>
      <div class="block">
        <div class="label">Indicaciones</div>
        <p>${escapeHtml(document.indications)}</p>
      </div>
      <div class="block">
        <div class="label">Observaciones</div>
        <p>${escapeHtml(document.observations)}</p>
      </div>
    </div>
  </body>
</html>`
}

export function printPrescription(
  prescription: Prescription,
  clinicName: string,
): void {
  const documentModel = buildPrescriptionDocument(prescription, clinicName)
  const logoUrl = new URL(documentModel.logoSrc, window.location.origin).toString()
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')

  if (!printWindow) {
    throw new Error('El navegador bloqueó la ventana de impresión.')
  }

  printWindow.document.open()
  printWindow.document.write(renderPrintHtml(documentModel, logoUrl))
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => {
    printWindow.print()
  }, 250)
}
