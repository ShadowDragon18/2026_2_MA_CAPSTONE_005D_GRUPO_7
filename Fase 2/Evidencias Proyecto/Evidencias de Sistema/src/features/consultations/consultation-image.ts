import {
  formatSignedDecimal,
  getConsultationDocumentLabel,
  getConsultationPatientName,
} from '@/features/consultations/utils'
import { APP_NAME, LOGO_SRC } from '@/lib/constants'
import type { ConsultationRecord } from '@/types/consultation'

const SCALE = 2
const WIDTH = 920
const PADDING = 40
const HEADER_HEIGHT = 104
const LOGO_MAX_WIDTH = 220
const LOGO_MAX_HEIGHT = 64

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return ['—']
  }

  const lines: string[] = []
  let current = words[0] ?? ''

  for (const word of words.slice(1)) {
    const next = `${current} ${word}`
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  lines.push(current)
  return lines
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = LOGO_SRC
  })
}

function axisLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value)
}

function getContainedSize(
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const naturalWidth = image.naturalWidth || image.width
  const naturalHeight = image.naturalHeight || image.height
  if (!naturalWidth || !naturalHeight) {
    return { width: maxWidth, height: maxHeight }
  }

  const ratio = naturalWidth / naturalHeight
  let width = maxWidth
  let height = width / ratio
  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return { width, height }
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  rows: Array<[string, string]>,
) {
  ctx.fillStyle = '#f4f8fa'
  ctx.strokeStyle = '#d7e3e8'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#1f5f73'
  ctx.font = '700 22px Inter, Arial, sans-serif'
  ctx.fillText(title, x + 24, y + 36)

  rows.forEach(([label, value], index) => {
    const rowY = y + 70 + index * 38
    ctx.font = '500 16px Inter, Arial, sans-serif'
    ctx.fillStyle = '#6b7c86'
    ctx.fillText(label, x + 24, rowY)
    ctx.font = '700 20px Inter, Arial, sans-serif'
    ctx.fillStyle = '#17323c'
    ctx.fillText(value, x + 90, rowY)
  })
}

export async function createConsultationImage(
  record: ConsultationRecord,
  clinicName: string,
): Promise<Blob> {
  const clinical = record.consultation
  const logo = await loadLogo()
  const observations = clinical?.medicalObservations?.trim() || '—'

  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) {
    throw new Error('No fue posible crear la imagen de la consulta.')
  }
  measure.font = '16px Inter, Arial, sans-serif'
  const observationLines = wrapText(measure, observations, WIDTH - PADDING * 2 - 8)
  const height = 620 + observationLines.length * 26

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No fue posible crear la imagen de la consulta.')
  }

  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, height)

  ctx.fillStyle = '#1f5f73'
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT)

  let textX = PADDING
  if (logo) {
    const size = getContainedSize(logo, LOGO_MAX_WIDTH, LOGO_MAX_HEIGHT)
    const logoX = PADDING
    const logoY = (HEADER_HEIGHT - size.height) / 2
    ctx.drawImage(logo, logoX, logoY, size.width, size.height)
    textX = logoX + size.width + 18
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 26px Inter, Arial, sans-serif'
  ctx.fillText(clinicName || APP_NAME, textX, 44)
  ctx.font = '500 15px Inter, Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('Consulta oftalmológica', textX, 70)

  const dateLabel = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(record.registeredAt))

  ctx.fillStyle = '#17323c'
  ctx.font = '700 28px Inter, Arial, sans-serif'
  ctx.fillText(getConsultationPatientName(record), PADDING, 140)
  ctx.font = '500 16px Inter, Arial, sans-serif'
  ctx.fillStyle = '#5b6d76'
  ctx.fillText(getConsultationDocumentLabel(record), PADDING, 168)
  ctx.fillText(dateLabel, PADDING, 192)

  const panelWidth = (WIDTH - PADDING * 2 - 20) / 2
  const panelY = 220
  const panelHeight = 196

  drawPanel(ctx, PADDING, panelY, panelWidth, panelHeight, 'OD', [
    ['Esf', formatSignedDecimal(clinical?.odSphere ?? null)],
    ['Cil', formatSignedDecimal(clinical?.odCylinder ?? null)],
    ['Eje', axisLabel(clinical?.odAxis)],
  ])
  drawPanel(
    ctx,
    PADDING + panelWidth + 20,
    panelY,
    panelWidth,
    panelHeight,
    'OI',
    [
      ['Esf', formatSignedDecimal(clinical?.oiSphere ?? null)],
      ['Cil', formatSignedDecimal(clinical?.oiCylinder ?? null)],
      ['Eje', axisLabel(clinical?.oiAxis)],
    ],
  )

  const metricsY = panelY + panelHeight + 36
  const metrics: Array<[string, string]> = [
    ['DP', clinical?.dp === null || clinical?.dp === undefined ? '—' : String(clinical.dp)],
    [
      'ADD',
      clinical?.addValue === null || clinical?.addValue === undefined
        ? '—'
        : formatSignedDecimal(clinical.addValue),
    ],
    [
      'MG/DL',
      clinical?.glucoseMgDl === null || clinical?.glucoseMgDl === undefined
        ? '—'
        : `${clinical.glucoseMgDl} mg/dL`,
    ],
  ]

  metrics.forEach(([label, value], index) => {
    const x = PADDING + index * 280
    ctx.font = '500 14px Inter, Arial, sans-serif'
    ctx.fillStyle = '#6b7c86'
    ctx.fillText(label, x, metricsY)
    ctx.font = '700 22px Inter, Arial, sans-serif'
    ctx.fillStyle = '#17323c'
    ctx.fillText(value, x, metricsY + 28)
  })

  ctx.font = '700 16px Inter, Arial, sans-serif'
  ctx.fillStyle = '#1f5f73'
  ctx.fillText('Observaciones médicas', PADDING, metricsY + 78)
  ctx.font = '500 16px Inter, Arial, sans-serif'
  ctx.fillStyle = '#17323c'
  observationLines.forEach((line, index) => {
    ctx.fillText(line, PADDING, metricsY + 108 + index * 26)
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No fue posible crear la imagen de la consulta.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export function downloadConsultationImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write) {
    return
  }

  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ])
}

export function getConsultationImageFilename(record: ConsultationRecord): string {
  const name = getConsultationPatientName(record)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const date = record.registeredAt.slice(0, 10)
  return `consulta_${name || 'paciente'}_${date}.png`
}
