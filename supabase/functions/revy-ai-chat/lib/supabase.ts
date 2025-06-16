
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// This is a shared Supabase client instance for the revy-ai-chat function.
// Using SERVICE_ROLE_KEY to bypass RLS for knowledge search functionality
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
