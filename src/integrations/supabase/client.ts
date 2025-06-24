
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Use environment variables if available, otherwise fall back to project defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fxelhfwaoizqyecikscu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc'

if (!supabaseUrl || (!import.meta.env.VITE_SUPABASE_ANON_KEY && !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
