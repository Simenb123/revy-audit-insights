import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { log, error as logError } from './log.ts'

export { createClient }

export function getSupabase(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Supabase credentials missing: URL or anon key not set');
  } else {
    log('🔐 Initializing Supabase client');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });
}
