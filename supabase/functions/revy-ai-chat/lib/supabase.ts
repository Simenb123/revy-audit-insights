
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabase } from '../_shared/supabaseClient.ts';

export function getScopedClient(req: Request): SupabaseClient {
  return getSupabase(req);
}
