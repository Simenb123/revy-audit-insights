import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Mapping = Record<string, string>;

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
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const { action, bucket, path, mapping } = await req.json() as {
      action: "init";
      bucket?: string;
      path?: string;
      mapping?: Mapping;
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let userId: string | null = null;
    if (bearer) {
      try {
        const { data: { user } } = await supabase.auth.getUser(bearer);
        userId = user?.id ?? null;
      } catch (_) {
        // Silent fallback; userId = null
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle init action - create job and enqueue for background processing
    if (action === "init") {
      if (!bucket || !path || !mapping) {
        throw new Error("Missing required parameters: bucket, path, mapping");
      }

      console.log(`🚀 Initializing import job for ${bucket}/${path}`);
      
      // Create import job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          job_type: 'shareholders',
          status: 'running',
          total_rows: 0,
          rows_loaded: 0,
          source_path: `${bucket}/${path}`,
          user_id: userId,
        })
        .select('id')
        .single();
      
      if (jobError || !job) {
        throw new Error(`Failed to create job: ${jobError?.message || 'Unknown error'}`);
      }

      console.log(`📝 Created job ${job.id}`);

      // Add job to queue for background processing
      const { error: queueError } = await supabase
        .from('shareholder_import_queue')
        .insert({
          job_id: job.id,
          bucket,
          path,
          mapping,
          user_id: userId,
          status: 'pending',
          metadata: {
            created_via: 'edge_function',
            timestamp: new Date().toISOString()
          }
        });
      
      if (queueError) {
        // Clean up job if queueing fails
        await supabase.from('import_jobs').delete().eq('id', job.id);
        throw new Error(`Failed to enqueue job: ${queueError.message}`);
      }

      console.log(`📨 Enqueued job ${job.id} for background processing`);

      // Return immediately with HTTP 202 (Accepted)
      return new Response(JSON.stringify({ 
        jobId: job.id,
        status: 'queued',
        message: 'Import job has been queued for background processing'
      }), {
        status: 202, // HTTP 202 Accepted
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error("Unsupported action. Only 'init' is supported in this version.");

  } catch (e: any) {
    const errorMessage = String(e?.message ?? e);
    console.error('❌ Import error:', errorMessage);
    console.error('❌ Full error object:', e);
    console.error('❌ Stack trace:', e?.stack);
    
    // Update job status on error with detailed error info
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!, 
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      // Update both job and queue status to error
      await supabase.from('import_jobs')
        .update({ 
          status: 'error', 
          error: errorMessage,
          rows_loaded: 0
        })
        .eq('status', 'running');
      
      await supabase.from('shareholder_import_queue')
        .update({ 
          status: 'failed', 
          error_message: errorMessage,
          processed_at: new Date().toISOString()
        })
        .eq('status', 'pending');
        
      console.log('📝 Updated job and queue status to error in database');
    } catch (dbError) {
      console.error('❌ Failed to update job status:', dbError);
    }

    // Return detailed error response
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: {
        type: e?.constructor?.name || 'UnknownError',
        stack: e?.stack?.split('\n').slice(0, 5) // First 5 lines of stack
      }
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});