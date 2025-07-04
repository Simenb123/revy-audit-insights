// Production dependencies for Supabase Edge functions. These are kept separate
// from test stubs so that deployed code only includes real modules.
export { serve } from "https://deno.land/std@0.224.0/http/server.ts";
export { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
