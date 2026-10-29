import { jsPDF } from 'jspdf'
import {
  buildPrescriptionDocument,
  getPrescriptionPdfFilename,
} from '@/features/prescriptions/utils'
import type { Prescription } from '@/types/prescription'

async function loadLogoDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src)
    if (!response.ok) {
      return null
    }
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null)
      }
      reader.onerror = () => {
        reject(new Error('No fue posible leer el logo.'))
      }
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function downloadPrescriptionPdf(
  prescription: Prescription,
  clinicName: string,
): Promise<void> {
  const model = buildPrescriptionDocument(prescription, clinicName)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18
  let y = 18

  const logoDataUrl = await loadLogoDataUrl(model.logoSrc)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, y, 28, 12)
    } catch {
      // Continúa sin logo si el formato no es compatible.
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(model.clinicName, margin + 34, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Receta oftalmológica', margin + 34, y + 11)

  y += 22
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('RECETA OFTALMOLÓGICA', pageWidth / 2, y, { align: 'center' })
  y += 12

  const meta: Array<[string, string]> = [
    ['Paciente', model.patientName],
    ['Documento', model.documentLabel],
    ['Edad', model.ageLabel],
    ['Fecha', model.dateLabel],
  ]

  doc.setFontSize(10)
  for (const [label, value] of meta) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90)
    doc.text(label.toUpperCase(), margin, y)
    doc.setTextColor(17)
    doc.setFont('helvetica', 'bold')
    doc.text(value, margin + 32, y)
    y += 7
  }

  y += 4
  const colWidth = (pageWidth - margin * 2 - 8) / 2
  drawEyeBox(doc, margin, y, colWidth, 'OD', [
    ['Esfera', model.odSphere],
    ['Cilindro', model.odCylinder],
    ['Eje', model.odAxis],
  ])
  drawEyeBox(doc, margin + colWidth + 8, y, colWidth, 'OI', [
    ['Esfera', model.oiSphere],
    ['Cilindro', model.oiCylinder],
    ['Eje', model.oiAxis],
  ])
  y += 32

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90)
  doc.text('DP', margin, y)
  doc.setTextColor(17)
  doc.setFont('helvetica', 'bold')
  doc.text(model.dp, margin + 12, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90)
  doc.text('ADD', margin + colWidth + 8, y)
  doc.setTextColor(17)
  doc.setFont('helvetica', 'bold')
  doc.text(model.add, margin + colWidth + 20, y)
  y += 14

  y = drawWrappedBlock(doc, 'Indicaciones', model.indications, margin, y, pageWidth)
  drawWrappedBlock(doc, 'Observaciones', model.observations, margin, y, pageWidth)

  doc.save(getPrescriptionPdfFilename(prescription))
}

function drawEyeBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  metrics: Array<[string, string]>,
): void {
  doc.setDrawColor(180)
  doc.roundedRect(x, y, width, 28, 2, 2)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17)
  doc.text(title, x + 4, y + 7)

  const cell = width / 3
  metrics.forEach(([label, value], index) => {
    const cx = x + 4 + cell * index
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(90)
    doc.text(label.toUpperCase(), cx, y + 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17)
    doc.text(value, cx, y + 22)
  })
}

function drawWrappedBlock(
  doc: jsPDF,
  title: string,
  value: string,
  margin: number,
  y: number,
  pageWidth: number,
): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90)
  doc.text(title.toUpperCase(), margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(17)
  const lines = doc.splitTextToSize(value, pageWidth - margin * 2)
  doc.text(lines, margin, y)
  return y + lines.length * 6 + 6
}
