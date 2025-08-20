import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartRunRequest {
  scenarioId: string;
}

interface StartRunResponse {
  success: boolean;
  runId?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { scenarioId }: StartRunRequest = await req.json();

    if (!scenarioId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scenario ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting training run for user ${user.id}, scenario ${scenarioId}`);

    // Check if scenario exists and is active
    const { data: scenario, error: scenarioError } = await supabaseClient
      .from('training_scenarios')
      .select('id, initial_budget, title')
      .eq('id', scenarioId)
      .eq('is_active', true)
      .single();

    if (scenarioError || !scenario) {
      console.error('Scenario error:', scenarioError);
      return new Response(
        JSON.stringify({ success: false, error: 'Scenario not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has an active run for this scenario
    const { data: existingRun } = await supabaseClient
      .from('training_runs')
      .select('id')
      .eq('scenario_id', scenarioId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingRun) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          runId: existingRun.id,
          message: 'Resumed existing training run'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new training run
    const { data: newRun, error: runError } = await supabaseClient
      .from('training_runs')
      .insert({
        scenario_id: scenarioId,
        user_id: user.id,
        current_budget: scenario.initial_budget,
        status: 'active'
      })
      .select('id')
      .single();

    if (runError || !newRun) {
      console.error('Run creation error:', runError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create training run' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Training run created: ${newRun.id}`);

    const response: StartRunResponse = {
      success: true,
      runId: newRun.id
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in training-start-run:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});