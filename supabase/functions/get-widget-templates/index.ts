import { getSupabase } from '../_shared/supabaseClient.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export default {}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Getting widget templates...');
    const supabase = getSupabase(req);

    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from('widget_templates')
      .select('widget_type, name, description, default_config')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.warn('Widget templates table error:', error);
      
      // If table doesn't exist or other database error, return empty array instead of 500
      if (error.code === '42703' || error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('Widget templates table not ready, returning empty array');
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // For other errors, return 500
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found ${data?.length || 0} widget templates`);
    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('get-widget-templates error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
