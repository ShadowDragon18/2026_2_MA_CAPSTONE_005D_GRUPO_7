import { logAuditEvent } from '@/features/audit/api'
import { setCachedClinicSettings } from '@/lib/config/clinic'
import { requireSupabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/database'
import {
  FALLBACK_CLINIC_SETTINGS,
  HEX_COLOR_PATTERN,
  type ClinicSettings,
} from '@/types/clinic'

function parseAmount(
  value: number | string,
  fallback: number,
): number {
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) ? amount : fallback
}

function parseQuickColors(value: Json): string[] {
  if (!Array.isArray(value)) {
    return [...FALLBACK_CLINIC_SETTINGS.quickColors]
  }

  const colors = value.filter(
    (item): item is string =>
      typeof item === 'string' && HEX_COLOR_PATTERN.test(item),
  )

  return colors.length > 0
    ? colors.map((color) => color.toUpperCase())
    : [...FALLBACK_CLINIC_SETTINGS.quickColors]
}

function mapClinicSettings(
  row: {
    clinic_name: string
    default_amount: number | string
    default_captador_amount: number | string
    quick_colors: Json
    updated_at: string
    updated_by: string | null
  },
): ClinicSettings {
  return {
    clinicName: row.clinic_name.trim() || FALLBACK_CLINIC_SETTINGS.clinicName,
    defaultAmount: parseAmount(
      row.default_amount,
      FALLBACK_CLINIC_SETTINGS.defaultAmount,
    ),
    defaultCaptadorAmount: parseAmount(
      row.default_captador_amount,
      FALLBACK_CLINIC_SETTINGS.defaultCaptadorAmount,
    ),
    quickColors: parseQuickColors(row.quick_colors),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }
}

export async function getClinicSettings(): Promise<ClinicSettings> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('clinic_settings')
    .select('clinic_name, default_amount, default_captador_amount, quick_colors, updated_at, updated_by')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) {
    setCachedClinicSettings(FALLBACK_CLINIC_SETTINGS)
    return FALLBACK_CLINIC_SETTINGS
  }

  const settings = mapClinicSettings(data)
  setCachedClinicSettings(settings)
  return settings
}

export async function updateClinicSettings(input: {
  clinicName: string
  defaultAmount: number
  defaultCaptadorAmount: number
  quickColors: string[]
  updatedBy: string
}): Promise<ClinicSettings> {
  const current = await getClinicSettings()
  const client = requireSupabase()
  const { data, error } = await client
    .from('clinic_settings')
    .update({
      clinic_name: input.clinicName.trim() || FALLBACK_CLINIC_SETTINGS.clinicName,
      default_amount: input.defaultAmount,
      default_captador_amount: input.defaultCaptadorAmount,
      quick_colors: input.quickColors,
      updated_by: input.updatedBy,
    })
    .eq('id', 1)
    .select('clinic_name, default_amount, default_captador_amount, quick_colors, updated_at, updated_by')
    .single()

  if (error || !data) {
    throw new Error('No fue posible guardar la configuración de la clínica.')
  }

  const settings = mapClinicSettings(data)
  setCachedClinicSettings(settings)

  if (current.clinicName !== settings.clinicName) {
    await logAuditEvent({
      action: 'update',
      entityType: 'settings',
      entityId: null,
      entityLabel: 'Clínica',
      description: 'Nombre de la clínica modificado',
      oldData: { clinicName: current.clinicName },
      newData: { clinicName: settings.clinicName },
    })
  }

  if (current.defaultAmount !== settings.defaultAmount) {
    await logAuditEvent({
      action: 'update',
      entityType: 'settings',
      entityId: null,
      entityLabel: 'Clínica',
      description: 'Monto predeterminado modificado',
      oldData: { amount: current.defaultAmount },
      newData: { amount: settings.defaultAmount },
    })
  }

  if (current.defaultCaptadorAmount !== settings.defaultCaptadorAmount) {
    await logAuditEvent({
      action: 'update',
      entityType: 'settings',
      entityId: null,
      entityLabel: 'Clínica',
      description: 'Precio predeterminado del captador modificado',
      oldData: { defaultCaptadorAmount: current.defaultCaptadorAmount },
      newData: { defaultCaptadorAmount: settings.defaultCaptadorAmount },
    })
  }

  if (
    JSON.stringify(current.quickColors) !== JSON.stringify(settings.quickColors)
  ) {
    await logAuditEvent({
      action: 'update',
      entityType: 'settings',
      entityId: null,
      entityLabel: 'Clínica',
      description: 'Colores rápidos modificados',
      oldData: { quickColors: current.quickColors },
      newData: { quickColors: settings.quickColors },
    })
  }

  return settings
}
