
import { logger } from '@/utils/logger';
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Use the actual Supabase project credentials
export const supabaseUrl = 'https://fxelhfwaoizqyecikscu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc'

// Service role key for server-side operations (used by edge functions)
export const supabaseServiceRoleKey = typeof window === 'undefined'
  ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    undefined
  : undefined

// Debug logging for environment variables (without exposing sensitive data)
if (import.meta.env.DEV) {
  logger.log('🔧 Supabase Environment Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
    keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET'
  });
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  logger.error(
    '❌ Supabase credentials missing. Check configuration.',
    {
      supabaseUrl: supabaseUrl || 'MISSING',
      supabaseAnonKey: supabaseAnonKey ? '[PRESENT]' : 'MISSING'
    }
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
  
  try {
    // Add UTF-8 encoding headers to ensure proper character handling
    const headers = new Headers(init?.headers);
    headers.set('Accept-Charset', 'UTF-8');
    
    // Set Content-Type with charset for requests with body
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json; charset=UTF-8');
    }
    
    const response = await fetch(input, {
      ...init,
      headers,
    })
    
    if (logLevel === 'debug') {
      const url = typeof input === 'string' ? input : input.toString()
      logger.log(
        `📡 [Supabase] ${method} ${url} -> ${response.status} in ${
          Date.now() - start
        }ms`
      )
    }
    
    // Log authentication errors for debugging
    if (!response.ok && response.status === 401) {
      logger.error('🔐 Supabase Authentication Error:', {
        url: typeof input === 'string' ? input : input.toString(),
        status: response.status,
        method
      });
    }
    
    return response
  } catch (error) {
    logger.error('🚨 Supabase Request Failed:', {
      url: typeof input === 'string' ? input : input.toString(),
      method,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    });
    throw error;
  }
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: loggingFetch },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Export a function to check if Supabase is ready
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    logger.error('❌ Supabase client not initialized');
    return false;
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logger.error('❌ Supabase connection test failed:', error);
      return false;
    }
    logger.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection test error:', error);
    return false;
  }
};
