
import { serve } from '../deps.ts'
import { createClient } from '../deps.ts'
import { log } from "../_shared/log.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  log('🔧 Storage setup function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    log('✅ Supabase client initialized');

    // Check if client-documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'client-documents');
    
    if (!bucketExists) {
      log('📁 Creating client-documents storage bucket...');
      
      const { error: createError } = await supabase.storage.createBucket('client-documents', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'image/*',
          'text/*',
          'application/vnd.openxmlformats-officedocument.*',
          'application/msword',
          'application/vnd.ms-excel'
        ],
        fileSizeLimit: 52428800 // 50MB
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      log('✅ Storage bucket created successfully');
    } else {
      log('📁 Storage bucket already exists');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage setup completed successfully',
        bucketExists: !bucketExists
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Storage setup error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Se server logs for mer detaljert feilsøking'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
