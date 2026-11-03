import { useRealtimeTable } from '@/lib/realtime/use-realtime-table'
import { realtimeRowId } from '@/lib/realtime/payload'
import { mapPatient } from '@/features/patients/utils'
import type { PatientRow } from '@/lib/supabase/database'
import type { RealtimeStatus } from '@/lib/realtime/types'
import type { Patient } from '@/types/patient'

interface UsePatientsRealtimeOptions {
  enabled?: boolean
  onInsert: (patient: Patient) => void
  onUpdate: (patient: Patient) => void
  onDelete: (id: string) => void
}

export function usePatientsRealtime({
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UsePatientsRealtimeOptions): RealtimeStatus {
  return useRealtimeTable({
    table: 'patients',
    enabled,
    onEvent: (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = realtimeRowId(payload.old)
        if (id) {
          onDelete(id)
        }
        return
      }

      try {
        const patient = mapPatient(payload.new as PatientRow)
        if (payload.eventType === 'INSERT') {
          onInsert(patient)
          return
        }

        onUpdate(patient)
      } catch {
        return
      }
    },
  })
}
