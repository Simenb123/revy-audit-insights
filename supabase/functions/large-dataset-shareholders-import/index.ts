import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

type Mapping = Record<string, string>;

interface ShareholderRow {
  orgnr?: string;
  selskap?: string;
  aksjeklasse?: string;
  navn_aksjonaer?: string;
  fodselsaar_orgnr?: string;
  landkode?: string;
  antall_aksjer?: number;
  year?: number;
  user_id: string;
}

const BATCH_SIZE = 10000;

// Helper function to download and parse CSV/Excel file
async function downloadAndParseFile(supabase: any, bucket: string, path: string): Promise<any[]> {
  console.log(`📥 Downloading file from ${bucket}/${path}`);
  
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(path);
    
  if (downloadError) {
    throw new Error(`Failed to download file: ${downloadError.message}`);
  }
  
  const arrayBuffer = await fileData.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Detect file type and parse accordingly
  const isExcel = path.toLowerCase().endsWith('.xlsx') || path.toLowerCase().endsWith('.xls');
  
  if (isExcel) {
    console.log('📊 Parsing Excel file');
    const workbook = XLSX.read(uint8Array, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData.length) return [];
    
    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1) as any[][];
    
    return rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } else {
    console.log('📄 Parsing CSV file');
    const csvText = new TextDecoder('utf-8').decode(uint8Array);
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }
}

// Helper function to map raw data to ShareholderRow format
function mapRowToShareholderRow(rawRow: any, mapping: Mapping, userId: string, defaultYear: number): ShareholderRow {
  const mapped: ShareholderRow = { user_id: userId };
  
  // Map columns using the mapping object
  Object.entries(mapping).forEach(([csvColumn, stagingColumn]) => {
    const value = rawRow[csvColumn];
    if (value !== undefined && value !== null && value !== '') {
      switch (stagingColumn) {
        case 'orgnr':
          mapped.orgnr = String(value).trim();
          break;
        case 'selskap':
          mapped.selskap = String(value).trim();
          break;
        case 'aksjeklasse':
          mapped.aksjeklasse = String(value).trim();
          break;
        case 'navn_aksjonaer':
          mapped.navn_aksjonaer = String(value).trim();
          break;
        case 'fodselsaar_orgnr':
          mapped.fodselsaar_orgnr = String(value).trim();
          break;
        case 'landkode':
          mapped.landkode = String(value).trim();
          break;
        case 'antall_aksjer':
          mapped.antall_aksjer = parseInt(String(value)) || 0;
          break;
        case 'year':
          mapped.year = parseInt(String(value)) || defaultYear;
          break;
      }
    }
  });
  
  // Set defaults for missing values
  mapped.landkode = mapped.landkode || 'NO';
  mapped.year = mapped.year || defaultYear;
  mapped.antall_aksjer = mapped.antall_aksjer || 0;
  
  return mapped;
}

// Helper function to process a batch of rows
async function processBatch(
  supabase: any, 
  batch: ShareholderRow[], 
  jobId: number, 
  totalRowsProcessed: number
): Promise<{ success: boolean; processedCount: number }> {
  if (batch.length === 0) {
    return { success: true, processedCount: 0 };
  }
  
  console.log(`📊 Inserting batch of ${batch.length} rows to staging`);
  
  // Insert to staging table
  const { error: insertError } = await supabase
    .from('shareholders_staging')
    .insert(batch, { returning: 'minimal' });
    
  if (insertError) {
    throw new Error(`Failed to insert batch to staging: ${insertError.message}`);
  }
  
  console.log(`✅ Inserted ${batch.length} rows to staging, now processing...`);
  
  // Process the batch
  const { data: batchResult, error: processError } = await supabase.rpc('process_shareholders_batch', {
    p_job_id: jobId,
    p_user_id: batch[0].user_id,
    p_offset: 0,
    p_limit: batch.length
  });
  
  if (processError) {
    throw new Error(`Failed to process batch: ${processError.message}`);
  }
  
  const processedCount = batchResult?.processed_count || 0;
  console.log(`🚀 Processed ${processedCount} rows from staging to production tables`);
  
  // Update job progress
  await supabase
    .from('import_jobs')
    .update({ 
      rows_loaded: totalRowsProcessed + processedCount,
    })
    .eq('id', jobId);
    
  return { success: true, processedCount };
}

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

    // Handle init action - create job and start streaming processing
    if (action === "init") {
      if (!bucket || !path || !mapping) {
        throw new Error("Missing required parameters: bucket, path, mapping");
      }

      console.log(`🚀 Starting streaming import from ${bucket}/${path}`);
      
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

      // Clear staging table for this user
      console.log('🗑️ Clearing existing staging data...');
      await supabase.rpc('clear_shareholders_staging', { p_user_id: userId });

      // Download and parse the file
      console.log('📥 Downloading and parsing file...');
      const fileData = await downloadAndParseFile(supabase, bucket, path);
      
      if (!fileData || fileData.length === 0) {
        throw new Error('No data found in file or file is empty');
      }
      
      console.log(`📊 Found ${fileData.length} rows in file, starting batch processing...`);
      
      // Update job with total rows
      await supabase
        .from('import_jobs')
        .update({ total_rows: fileData.length })
        .eq('id', job.id);

      // Process data in batches
      let totalProcessed = 0;
      let batch: ShareholderRow[] = [];
      const defaultYear = new Date().getFullYear();
      
      for (let i = 0; i < fileData.length; i++) {
        const rawRow = fileData[i];
        
        // Skip empty rows
        if (!rawRow || Object.keys(rawRow).length === 0) {
          continue;
        }
        
        // Map the row to the ShareholderRow format
        const mappedRow = mapRowToShareholderRow(rawRow, mapping, userId, defaultYear);
        batch.push(mappedRow);
        
        // Process batch when it reaches BATCH_SIZE or at the end of file
        if (batch.length >= BATCH_SIZE || i === fileData.length - 1) {
          try {
            console.log(`🔄 Processing batch ${Math.ceil((i + 1) / BATCH_SIZE)} of ${Math.ceil(fileData.length / BATCH_SIZE)}`);
            
            const batchResult = await processBatch(supabase, batch, job.id, totalProcessed);
            
            if (batchResult.success) {
              totalProcessed += batchResult.processedCount;
              console.log(`✅ Total processed so far: ${totalProcessed}/${fileData.length}`);
            }
            
            // Clear the batch for next iteration
            batch = [];
            
          } catch (batchError) {
            console.error(`❌ Batch processing failed: ${batchError.message}`);
            
            // Update job status to error
            await supabase
              .from('import_jobs')
              .update({ 
                status: 'error', 
                error: batchError.message,
                rows_loaded: totalProcessed
              })
              .eq('id', job.id);
            
            throw batchError;
          }
        }
      }
      
      // Mark job as completed
      console.log(`🎉 Import completed successfully! Total processed: ${totalProcessed}`);
      
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          rows_loaded: totalProcessed,
          total_rows: fileData.length
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({ 
        jobId: job.id,
        totalProcessed,
        totalRows: fileData.length,
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