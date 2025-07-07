import { createClient } from '@supabase/supabase-js'
import type { Database } from './integrations/supabase/types'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  ''

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

if (import.meta.env.DEV) {
  // @ts-expect-error -- debug helper only in development
  ;(window as any).supabase = supabase
}
export default supabase
