import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  AUTH_STORAGE_KEY,
  createAuthStorage,
} from '@/lib/auth/storage'
import type { Database } from '@/lib/supabase/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey)
}

function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
      storage: createAuthStorage(),
    },
  })
}

export const supabase = createSupabaseClient()

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  return supabase
}
