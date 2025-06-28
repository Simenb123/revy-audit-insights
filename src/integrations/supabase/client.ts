
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Supabase credentials from environment variables
const supabaseUrl =
  import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Service role key for server-side operations (used by edge functions)
export const supabaseServiceRoleKey = typeof window === 'undefined'
  ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    undefined
  : undefined

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
  )
}
const logLevel =
  import.meta.env.VITE_LOG_LEVEL || import.meta.env.LOG_LEVEL || 'info'

const loggingFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const method = init?.method || 'GET'
  const start = Date.now()
  const response = await fetch(input, init)
  if (logLevel === 'debug') {
    const url = typeof input === 'string' ? input : input.toString()
    console.log(
      `\uD83D\uDCE1 [Supabase] ${method} ${url} -> ${response.status} in ${
        Date.now() - start
      }ms`
    )
  }
  return response
}

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { fetch: loggingFetch }
    })
  : null
