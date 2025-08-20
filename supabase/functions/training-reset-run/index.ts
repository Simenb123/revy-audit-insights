import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetRunRequest {
  runId: string;
}

interface ResetRunResponse {
  success: boolean;
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

    const { runId }: ResetRunRequest = await req.json();

    if (!runId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Run ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Resetting training run ${runId} for user ${user.id}`);

    // Verify the run belongs to the user
    const { data: run, error: runError } = await supabaseClient
      .from('training_runs')
      .select('id, scenario_id')
      .eq('id', runId)
      .eq('user_id', user.id)
      .single();

    if (runError || !run) {
      console.error('Run verification error:', runError);
      return new Response(
        JSON.stringify({ success: false, error: 'Training run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the scenario to reset initial budget
    const { data: scenario, error: scenarioError } = await supabaseClient
      .from('training_scenarios')
      .select('initial_budget')
      .eq('id', run.scenario_id)
      .single();

    if (scenarioError || !scenario) {
      console.error('Scenario error:', scenarioError);
      return new Response(
        JSON.stringify({ success: false, error: 'Scenario not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete all run states (this will cascade and remove the action history)
    const { error: deleteStatesError } = await supabaseClient
      .from('training_run_states')
      .delete()
      .eq('run_id', runId);

    if (deleteStatesError) {
      console.error('Delete states error:', deleteStatesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to reset run states' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset the training run to initial state
    const { error: resetError } = await supabaseClient
      .from('training_runs')
      .update({
        current_budget: scenario.initial_budget,
        actions_taken: 0,
        current_step: 1,
        total_score: 0,
        status: 'active',
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', runId);

    if (resetError) {
      console.error('Reset error:', resetError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to reset training run' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Training run ${runId} reset successfully`);

    const response: ResetRunResponse = {
      success: true
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in training-reset-run:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});