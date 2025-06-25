
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl =
  import.meta.env.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

// Service role key for server-side operations (used by edge functions)
export const supabaseServiceRoleKey = typeof window === 'undefined'
  ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  : undefined

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
  )
}


export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null
