import { useEffect, useId, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type {
  RealtimeEvent,
  RealtimePayload,
  RealtimeStatus,
  RealtimeTable,
} from '@/lib/realtime/types'

interface UseRealtimeTableOptions<Table extends RealtimeTable> {
  table: Table
  enabled?: boolean
  event?: RealtimeEvent
  filter?: string
  onEvent: (payload: RealtimePayload<Table>) => void
}

export function useRealtimeTable<Table extends RealtimeTable>({
  table,
  enabled = true,
  event = '*',
  filter,
  onEvent,
}: UseRealtimeTableOptions<Table>): RealtimeStatus {
  const instanceId = useId()
  const onEventRef = useRef(onEvent)
  const [status, setStatus] = useState<RealtimeStatus>('idle')

  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled || !supabase) {
      setStatus('idle')
      return
    }

    const client = supabase
    const channelName = `exilus:${table}:${event}:${filter ?? 'all'}:${instanceId}`
    setStatus('subscribing')

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          onEventRef.current(payload as RealtimePayload<Table>)
        },
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('subscribed')
          return
        }

        if (
          subscriptionStatus === 'CHANNEL_ERROR' ||
          subscriptionStatus === 'TIMED_OUT'
        ) {
          setStatus('error')
        }
      })

    return () => {
      setStatus('idle')
      void client.removeChannel(channel)
    }
  }, [enabled, event, filter, instanceId, table])

  return status
}
