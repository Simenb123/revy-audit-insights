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
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const { jobId, storagePath } = await req.json() as {
      jobId: string;
      storagePath?: string;
    };

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Job ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log(`🧹 Processing cleanup for job ${jobId}`);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('status, bucket_name, file_path')
      .eq('id', jobId)
      .single();

    if (jobError) {
      throw new Error(`Failed to fetch job details: ${jobError.message}`);
    }

    if (!job) {
      throw new Error('Job not found');
    }

    // Only cleanup if job is completed successfully
    if (job.status === 'completed') {
      let cleanupPath = storagePath;
      
      // Construct cleanup path from job data if not provided
      if (!cleanupPath && job.bucket_name && job.file_path) {
        cleanupPath = `${job.bucket_name}/${job.file_path}`;
      }

      if (cleanupPath) {
        try {
          // Parse bucket and path from storage path
          const pathParts = cleanupPath.split('/');
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');

          console.log(`🗑️ Cleaning up file: ${filePath} from bucket: ${bucket}`);

          // Delete the uploaded file
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (deleteError) {
            console.warn(`⚠️ Failed to delete file ${filePath}: ${deleteError.message}`);
            // Don't fail the entire operation if file deletion fails
          } else {
            console.log(`✅ Successfully cleaned up file: ${filePath}`);
            
            // Update job to mark file as cleaned up
            await supabase
              .from('import_jobs')
              .update({ 
                metadata: { 
                  file_cleaned_up: true, 
                  cleaned_up_at: new Date().toISOString() 
                } 
              })
              .eq('id', jobId);
          }
        } catch (cleanupError) {
          console.warn(`⚠️ Error during file cleanup: ${cleanupError}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Cleanup processed for job ${jobId}`,
      status: job.status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Cleanup error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error during cleanup'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});