import { mapManagedUser } from '@/features/users/admin-api'
import { realtimeRowId } from '@/lib/realtime/payload'
import { useRealtimeTable } from '@/lib/realtime/use-realtime-table'
import type { RealtimeStatus } from '@/lib/realtime/types'
import type { ManagedUser } from '@/types/managed-user'

interface UseProfilesRealtimeOptions {
  enabled?: boolean
  onInsert: (user: ManagedUser) => void
  onUpdate: (user: ManagedUser) => void
  onDelete: (id: string) => void
}

export function useProfilesRealtime({
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseProfilesRealtimeOptions): RealtimeStatus {
  return useRealtimeTable({
    table: 'profiles',
    enabled,
    onEvent: (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = realtimeRowId(payload.old)
        if (id) {
          onDelete(id)
        }
        return
      }

      const row = payload.new
      if (!row.id) {
        return
      }

      try {
        const user = mapManagedUser({
          id: row.id,
          full_name: row.full_name,
          email: row.email,
          role: row.role,
          is_active: row.is_active,
          created_at: row.created_at,
        })
        if (payload.eventType === 'INSERT') {
          onInsert(user)
          return
        }

        onUpdate(user)
      } catch {
        return
      }
    },
  })
}
