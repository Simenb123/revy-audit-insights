import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log('🔄 Triggering import queue processing...');

    // Call the shareholder import handler
    const handlerUrl = `${supabaseUrl}/functions/v1/shareholder-import-handler`;
    const response = await fetch(handlerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    console.log('📊 Queue processing result:', result);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Queue processing triggered successfully',
      handlerResult: result
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error triggering queue processing:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});