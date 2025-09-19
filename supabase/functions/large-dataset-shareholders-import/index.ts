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

// Helper function to download and parse specific rows from CSV/Excel file
async function downloadAndParseFileChunk(
  supabase: any, 
  bucket: string, 
  path: string, 
  offset: number = 0, 
  limit: number = BATCH_SIZE
): Promise<{ data: any[], totalRows: number, done: boolean }> {
  console.log(`📥 Downloading file chunk from ${bucket}/${path} (offset: ${offset}, limit: ${limit})`);
  
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
    console.log('📊 Parsing Excel file chunk');
    const workbook = XLSX.read(uint8Array, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData.length) return { data: [], totalRows: 0, done: true };
    
    const headers = jsonData[0] as string[];
    const allRows = jsonData.slice(1) as any[][];
    const totalRows = allRows.length;
    
    // Skip rows based on offset and take only limit rows
    const chunkRows = allRows.slice(offset, offset + limit);
    const done = offset + chunkRows.length >= totalRows;
    
    const data = chunkRows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    return { data, totalRows, done };
  } else {
    console.log('📄 Parsing CSV file chunk');
    const csvText = new TextDecoder('utf-8').decode(uint8Array);
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const allRows = results.data as any[];
          const totalRows = allRows.length;
          
          // Skip rows based on offset and take only limit rows
          const chunkRows = allRows.slice(offset, offset + limit);
          const done = offset + chunkRows.length >= totalRows;
          
          resolve({ data: chunkRows, totalRows, done });
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

    const { action, bucket, path, mapping, jobId, offset = 0, limit = BATCH_SIZE } = await req.json() as {
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

    // Handle init action - create job only
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

      // Clear staging table for this user
      console.log('🗑️ Clearing existing staging data...');
      await supabase.rpc('clear_shareholders_staging', { p_user_id: userId });

      return new Response(JSON.stringify({ 
        jobId: job.id,
        nextOffset: 0,
        done: false,
        totalProcessed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle process action - process one chunk at a time
    if (action === "process") {
      if (!jobId || !bucket || !path || !mapping) {
        throw new Error("Missing required parameters: jobId, bucket, path, mapping");
      }

      console.log(`📊 Processing chunk: jobId=${jobId}, offset=${offset}, limit=${limit}`);
      
      try {
        // Download and parse only the chunk we need
        const fileChunk = await downloadAndParseFileChunk(supabase, bucket, path, offset, limit);
        
        if (!fileChunk.data || fileChunk.data.length === 0) {
          console.log('📭 No more data to process, marking as done');
          
          // Update job as completed
          await supabase
            .from('import_jobs')
            .update({ status: 'completed' })
            .eq('id', jobId);
            
          return new Response(JSON.stringify({ 
            done: true,
            nextOffset: offset,
            processedInChunk: 0,
            totalProcessed: offset,
            totalRows: fileChunk.totalRows,
            jobId 
          }), { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Update job with total rows if not set yet
        if (fileChunk.totalRows > 0) {
          await supabase
            .from('import_jobs')
            .update({ total_rows: fileChunk.totalRows })
            .eq('id', jobId)
            .is('total_rows', null);
        }
        
        console.log(`📋 Processing ${fileChunk.data.length} rows from chunk`);
        
        // Map rows to ShareholderRow format
        const defaultYear = new Date().getFullYear();
        const mappedRows: ShareholderRow[] = [];
        
        for (const rawRow of fileChunk.data) {
          // Skip empty rows
          if (!rawRow || Object.keys(rawRow).length === 0) {
            continue;
          }
          
          const mappedRow = mapRowToShareholderRow(rawRow, mapping, userId, defaultYear);
          mappedRows.push(mappedRow);
        }
        
        if (mappedRows.length === 0) {
          console.log('📭 No valid rows in chunk, moving to next');
          return new Response(JSON.stringify({ 
            done: fileChunk.done,
            nextOffset: offset + fileChunk.data.length,
            processedInChunk: 0,
            totalProcessed: offset + fileChunk.data.length,
            totalRows: fileChunk.totalRows,
            jobId 
          }), { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Insert to staging table
        console.log(`📥 Inserting ${mappedRows.length} rows to staging`);
        const { error: insertError } = await supabase
          .from('shareholders_staging')
          .insert(mappedRows, { returning: 'minimal' });
          
        if (insertError) {
          throw new Error(`Failed to insert batch to staging: ${insertError.message}`);
        }
        
        console.log(`✅ Inserted to staging, now processing batch...`);
        
        // Process the batch
        const { data: batchResult, error: processError } = await supabase.rpc('process_shareholders_batch', {
          p_job_id: jobId,
          p_user_id: userId,
          p_offset: 0, // Always 0 for staging table offset
          p_limit: mappedRows.length
        });
        
        if (processError) {
          throw new Error(`Failed to process batch: ${processError.message}`);
        }
        
        const processedCount = batchResult?.processed_count || 0;
        console.log(`🚀 Processed ${processedCount} rows from staging to production`);
        
        const nextOffset = offset + fileChunk.data.length;
        const totalProcessed = offset + processedCount;
        
        // Update job progress
        await supabase
          .from('import_jobs')
          .update({ 
            rows_loaded: totalProcessed,
            status: fileChunk.done ? 'completed' : 'running'
          })
          .eq('id', jobId);
        
        console.log(`📊 Progress: ${totalProcessed}/${fileChunk.totalRows} (${fileChunk.done ? 'DONE' : 'CONTINUING'})`);
        
        return new Response(JSON.stringify({ 
          done: fileChunk.done,
          nextOffset: nextOffset,
          processedInChunk: processedCount,
          totalProcessed: totalProcessed,
          totalRows: fileChunk.totalRows,
          jobId 
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (processError: any) {
        console.error(`❌ Chunk processing failed: ${processError.message}`);
        
        // Update job status to error
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'error', 
            error: processError.message
          })
          .eq('id', jobId);
        
        throw processError;
      }
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