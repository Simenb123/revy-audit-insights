import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplyActionRequest {
  runId: string;
  actionId: string;
  notes?: string;
}

interface ApplyActionResponse {
  success: boolean;
  revealText?: string;
  newBudget?: number;
  scoreImpact?: number;
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

    const { runId, actionId, notes }: ApplyActionRequest = await req.json();

    if (!runId || !actionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Run ID and Action ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Applying action ${actionId} to run ${runId} for user ${user.id}`);

    // Verify the run belongs to the user and is active
    const { data: run, error: runError } = await supabaseClient
      .from('training_runs')
      .select('id, current_budget, actions_taken, total_score, status')
      .eq('id', runId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (runError || !run) {
      console.error('Run verification error:', runError);
      return new Response(
        JSON.stringify({ success: false, error: 'Training run not found or not active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the action details
    const { data: action, error: actionError } = await supabaseClient
      .from('training_actions')
      .select('id, cost, reveal_text, score_impact, risk_impact')
      .eq('id', actionId)
      .single();

    if (actionError || !action) {
      console.error('Action error:', actionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Action not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has enough budget
    if (run.current_budget < action.cost) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient budget for this action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if action was already applied to this run
    const { data: existingState } = await supabaseClient
      .from('training_run_states')
      .select('id')
      .eq('run_id', runId)
      .eq('action_id', actionId)
      .single();

    if (existingState) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action already applied to this run' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate new values
    const newBudget = run.current_budget - action.cost;
    const newScore = run.total_score + (action.score_impact || 0);
    const newActionsCount = run.actions_taken + 1;

    // Apply the action - create run state record
    const { error: stateError } = await supabaseClient
      .from('training_run_states')
      .insert({
        run_id: runId,
        action_id: actionId,
        cost_paid: action.cost,
        notes: notes || null
      });

    if (stateError) {
      console.error('State creation error:', stateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to apply action' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the training run
    const { error: updateError } = await supabaseClient
      .from('training_runs')
      .update({
        current_budget: newBudget,
        actions_taken: newActionsCount,
        total_score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Run update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update training run' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Action applied successfully. New budget: ${newBudget}, New score: ${newScore}`);

    const response: ApplyActionResponse = {
      success: true,
      revealText: action.reveal_text || undefined,
      newBudget,
      scoreImpact: action.score_impact || 0
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in training-apply-action:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});