import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainingContextRequest {
  sessionId: string;
}

interface TrainingContextResponse {
  session: any;
  actions: any[];
  progress: any;
  library: any[];
  userChoices: any[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { sessionId }: TrainingContextRequest = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select(`
        *,
        training_programs(name, description)
      `)
      .eq('id', sessionId)
      .eq('is_published', true)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found or not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's progress for this session
    const { data: progress } = await supabase
      .from('training_session_progress')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    // Get available actions for this session
    const { data: actions } = await supabase
      .from('training_actions_catalog')
      .select('*')
      .eq('session_id', sessionId)
      .order('category', { ascending: true });

    // Get user's choices for this session
    const { data: userChoices } = await supabase
      .from('training_run_choices')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // Get session library (knowledge articles)
    const { data: library } = await supabase
      .from('training_session_library')
      .select(`
        training_library_collections(
          name,
          description,
          training_library_items(
            knowledge_articles(
              id,
              title,
              summary,
              content,
              reference_code,
              valid_from,
              valid_until,
              knowledge_categories(name)
            )
          )
        )
      `)
      .eq('session_id', sessionId);

    // Flatten library structure for easier consumption
    const flatLibrary = library?.flatMap(item => 
      (item.training_library_collections as any)?.training_library_items?.map((libraryItem: any) => ({
        ...libraryItem.knowledge_articles,
        collection_name: (item.training_library_collections as any)?.name
      })) || []
    ) || [];

    const response: TrainingContextResponse = {
      session,
      actions: actions || [],
      progress,
      library: flatLibrary,
      userChoices: userChoices || []
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in training-context function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});