import { mapAuditLog } from '@/features/audit/utils'
import { realtimeRowId } from '@/lib/realtime/payload'
import { useRealtimeTable } from '@/lib/realtime/use-realtime-table'
import type { AuditLogRow } from '@/lib/supabase/database'
import type { RealtimeStatus } from '@/lib/realtime/types'
import type { AuditLog } from '@/types/audit'

interface UseAuditRealtimeOptions {
  enabled?: boolean
  onInsert: (record: AuditLog) => void
}

export function useAuditRealtime({
  enabled = true,
  onInsert,
}: UseAuditRealtimeOptions): RealtimeStatus {
  return useRealtimeTable({
    table: 'audit_logs',
    enabled,
    event: 'INSERT',
    onEvent: (payload) => {
      if (!realtimeRowId(payload.new)) {
        return
      }

      try {
        onInsert(mapAuditLog(payload.new as AuditLogRow))
      } catch {
        return
      }
    },
  })
}
