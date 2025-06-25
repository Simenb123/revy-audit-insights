
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Direct configuration for Lovable environment
const supabaseUrl = 'https://fxelhfwaoizqyecikscu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc'

// Service role key for server-side operations (used by edge functions)
export const supabaseServiceRoleKey = typeof window === 'undefined'
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE2MzY3OSwiZXhwIjo2MDYwNzM5Njc5fQ.wV1UanmVsR4VZ4KYz8F3Rv1HrKqG8hPXjEsT4VB7W7c'
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
