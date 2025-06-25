
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Read Supabase credentials from environment variables, with fallback defaults
const DEFAULT_SUPABASE_URL = 'https://fxelhfwaoizqyecikscu.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc'

const supabaseUrl =
  import.meta.env.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL

const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY

if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_ANON_KEY) {
  console.warn(
    'Using built-in Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY to use your own project.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
