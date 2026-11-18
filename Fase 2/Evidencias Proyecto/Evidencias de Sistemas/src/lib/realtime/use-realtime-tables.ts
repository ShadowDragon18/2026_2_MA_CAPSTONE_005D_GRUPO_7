import { useEffect, useId, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type {
  RealtimePayload,
  RealtimeStatus,
  RealtimeTable,
} from '@/lib/realtime/types'

interface UseRealtimeTablesOptions<Table extends RealtimeTable> {
  tables: readonly Table[]
  enabled?: boolean
  onEvent: (table: Table, payload: RealtimePayload<Table>) => void
}

export function useRealtimeTables<Table extends RealtimeTable>({
  tables,
  enabled = true,
  onEvent,
}: UseRealtimeTablesOptions<Table>): RealtimeStatus {
  const instanceId = useId()
  const onEventRef = useRef(onEvent)
  const tablesRef = useRef(tables)
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const tablesKey = tables.join(',')

  onEventRef.current = onEvent
  tablesRef.current = tables

  useEffect(() => {
    const currentTables = tablesRef.current

    if (!enabled || !supabase || currentTables.length === 0) {
      setStatus('idle')
      return
    }

    const client = supabase
    const channelName = `exilus:multi:${tablesKey}:${instanceId}`
    setStatus('subscribing')

    let channel = client.channel(channelName)

    for (const table of currentTables) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload) => {
          onEventRef.current(table, payload as RealtimePayload<Table>)
        },
      )
    }

    channel.subscribe((subscriptionStatus) => {
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
  }, [enabled, instanceId, tablesKey])

  return status
}
