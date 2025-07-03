
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Factory function to create a scoped Supabase client using the caller's JWT
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

export function getScopedClient(req: Request): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });
}
