
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// This is a shared Supabase client instance for the revy-ai-chat function.
// By centralizing it, we ensure a single point of configuration.
export const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);
