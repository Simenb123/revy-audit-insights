
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl =
  import.meta.env.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

// Service role key for server-side operations (used by edge functions)
export const supabaseServiceRoleKey =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
  )
}

if (!supabaseServiceRoleKey) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY not found. Some AI features may not work properly. Set this key for full functionality.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
