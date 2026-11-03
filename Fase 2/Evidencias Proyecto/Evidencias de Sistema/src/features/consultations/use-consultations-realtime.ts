import { mapClinical } from '@/features/consultations/utils'
import { realtimeRowId } from '@/lib/realtime/payload'
import { useRealtimeTable } from '@/lib/realtime/use-realtime-table'
import type { ConsultationRow } from '@/lib/supabase/database'
import type { RealtimeStatus } from '@/lib/realtime/types'
import type { ConsultationClinicalData } from '@/types/consultation'

interface UseConsultationsRealtimeOptions {
  enabled?: boolean
  onUpsert: (patientId: string, clinical: ConsultationClinicalData) => void
  onDelete: (consultationId: string) => void
}

export function useConsultationsRealtime({
  enabled = true,
  onUpsert,
  onDelete,
}: UseConsultationsRealtimeOptions): RealtimeStatus {
  return useRealtimeTable({
    table: 'consultations',
    enabled,
    onEvent: (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = realtimeRowId(payload.old)
        if (id) {
          onDelete(id)
        }
        return
      }

      const row = payload.new as ConsultationRow
      if (!row.id || !row.patient_id) {
        return
      }

      onUpsert(row.patient_id, mapClinical(row))
    },
  })
}
