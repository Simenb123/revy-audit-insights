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

    const { action, bucket, path, mapping, jobId, offset = 0, limit = 50000 } = await req.json() as {
      action: "init" | "process";
      bucket?: string;
      path?: string;
      mapping?: Mapping;
      jobId?: number;
      offset?: number;
      limit?: number;
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

    // Handle init action - create job and start processing loop
    if (action === "init") {
      if (!bucket || !path || !mapping) {
        throw new Error("Missing required parameters: bucket, path, mapping");
      }

      console.log(`Starting import from ${bucket}/${path}`);
      
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

      console.log(`Created job ${job.id}`);

      // Clear staging table for this user
      await supabase.rpc('clear_shareholders_staging', { p_user_id: userId });

      // TODO: Populate staging table from CSV file
      // This should be done by a database function that reads from storage
      // For now, we'll assume the staging table is populated externally

      // Start batch processing loop
      let currentOffset = 0;
      const batchLimit = 50000;
      let totalProcessed = 0;

      while (true) {
        console.log(`Processing batch: offset=${currentOffset}, limit=${batchLimit}`);
        
        const { data: batchResult, error: batchError } = await supabase.rpc('process_shareholders_batch', {
          p_job_id: job.id,
          p_user_id: userId,
          p_offset: currentOffset,
          p_limit: batchLimit
        });

        if (batchError) {
          console.error(`Batch processing failed: ${batchError.message}`);
          // Update job status to error
          await supabase
            .from('import_jobs')
            .update({ status: 'error', error: batchError.message })
            .eq('id', job.id);
          throw new Error(`Batch processing failed: ${batchError.message}`);
        }

        if (!batchResult) {
          throw new Error('No result returned from batch processing');
        }

        const { next_offset, done, processed_count } = batchResult;
        totalProcessed += processed_count || 0;
        
        console.log(`Batch complete: processed=${processed_count}, total=${totalProcessed}, done=${done}`);

        if (done) {
          console.log(`Import completed. Total processed: ${totalProcessed}`);
          break;
        }

        currentOffset = next_offset;
      }

      return new Response(JSON.stringify({ 
        jobId: job.id,
        totalProcessed,
        status: 'completed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle process action (single batch - for backwards compatibility)
    if (action === "process") {
      if (!jobId) {
        throw new Error("Missing jobId for process action");
      }

      console.log(`Processing single batch: jobId=${jobId}, offset=${offset}, limit=${limit}`);
      
      const { data: batchResult, error: batchError } = await supabase.rpc('process_shareholders_batch', {
        p_job_id: jobId,
        p_user_id: userId,
        p_offset: offset,
        p_limit: limit
      });

      if (batchError) {
        throw new Error(`Batch processing failed: ${batchError.message}`);
      }

      if (!batchResult) {
        throw new Error('No result returned from batch processing');
      }

      const { next_offset, done, processed_count } = batchResult;

      return new Response(JSON.stringify({ 
        done,
        nextOffset: next_offset,
        processedInChunk: processed_count,
        totalProcessed: next_offset,
        jobId 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error("Unsupported action. Use 'init' or 'process'.");

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
      await supabase.from('import_jobs')
        .update({ 
          status: 'error', 
          error: errorMessage,
          rows_loaded: 0 // Reset on error
        })
        .eq('status', 'running');
      console.log('📝 Updated job status to error in database');
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