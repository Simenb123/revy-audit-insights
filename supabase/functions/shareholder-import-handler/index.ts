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

const CHUNK_SIZE = 5000; // Process in smaller chunks to prevent memory issues

// Helper function to download and parse CSV/Excel file
async function downloadAndParseFile(
  supabase: any, 
  bucket: string, 
  path: string
): Promise<any[]> {
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
    const allRows = jsonData.slice(1) as any[][];
    
    return allRows.map(row => {
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
          resolve(results.data as any[]);
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
          // Ensure BIGINT compatibility by sanitizing the number
          const numValue = String(value).replace(/[^\d]/g, ''); // Remove non-digits
          mapped.antall_aksjer = parseInt(numValue) || 0;
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

// Main queue processor function
async function processShareholderImportQueue() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('🔍 Checking for pending shareholder import jobs...');
  
  // Get oldest pending job from queue
  const { data: queueItems, error: queueError } = await supabase
    .from('shareholder_import_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);
  
  if (queueError) {
    console.error('❌ Failed to fetch queue items:', queueError);
    return { success: false, message: 'Failed to fetch queue items' };
  }
  
  if (!queueItems || queueItems.length === 0) {
    console.log('📭 No pending jobs in queue');
    return { success: true, message: 'No pending jobs in queue' };
  }
  
  const queueItem = queueItems[0];
  console.log(`🚀 Processing queue item ${queueItem.id} for job ${queueItem.job_id}`);
  
  try {
    // Mark queue item as processing
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ status: 'processing' })
      .eq('id', queueItem.job_id);
    
    // Download and parse the full file
    const allRows = await downloadAndParseFile(supabase, queueItem.bucket, queueItem.path);
    console.log(`📊 Parsed ${allRows.length} rows from file`);
    
    if (allRows.length === 0) {
      throw new Error('No data found in file');
    }
    
    // Update job with total rows
    await supabase
      .from('import_jobs')
      .update({ total_rows: allRows.length })
      .eq('id', queueItem.job_id);
    
    // Clear staging table for this user first
    console.log('🗑️ Clearing existing staging data...');
    await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
    
    const defaultYear = new Date().getFullYear();
    let totalProcessed = 0;
    
    // Process in chunks to prevent memory issues
    for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
      const chunk = allRows.slice(i, i + CHUNK_SIZE);
      console.log(`📋 Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}: rows ${i + 1}-${Math.min(i + CHUNK_SIZE, allRows.length)}`);
      
      // Map rows to ShareholderRow format
      const mappedRows: ShareholderRow[] = chunk
        .filter(row => row && Object.keys(row).length > 0) // Skip empty rows
        .map(row => mapRowToShareholderRow(row, queueItem.mapping, queueItem.user_id, defaultYear));
      
      if (mappedRows.length > 0) {
        // Insert chunk to staging table
        console.log(`📥 Inserting ${mappedRows.length} rows to staging`);
        const { error: insertError } = await supabase
          .from('shareholders_staging')
          .insert(mappedRows, { returning: 'minimal' });
          
        if (insertError) {
          throw new Error(`Failed to insert chunk to staging: ${insertError.message}`);
        }
        
        // Process the batch from staging to production tables
        console.log(`🚀 Processing batch from staging...`);
        const { data: batchResult, error: processError } = await supabase.rpc('process_shareholders_batch', {
          p_job_id: queueItem.job_id,
          p_user_id: queueItem.user_id,
          p_offset: 0, // Always 0 for staging table processing
          p_limit: mappedRows.length
        });
        
        if (processError) {
          throw new Error(`Failed to process batch: ${processError.message}`);
        }
        
        const processedCount = batchResult?.processed_count || 0;
        totalProcessed += processedCount;
        console.log(`✅ Processed ${processedCount} rows (total: ${totalProcessed}/${allRows.length})`);
        
        // Clear staging table after each batch to prevent accumulation
        await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
        
        // Update job progress
        await supabase
          .from('import_jobs')
          .update({ rows_loaded: totalProcessed })
          .eq('id', queueItem.job_id);
      }
    }
    
    // Mark queue item as completed
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    // Final job update
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'completed',
        rows_loaded: totalProcessed
      })
      .eq('id', queueItem.job_id);
    
    console.log(`✅ Successfully completed import job ${queueItem.job_id} with ${totalProcessed} rows processed`);
    return { success: true, message: `Processed ${totalProcessed} rows successfully` };
    
  } catch (error: any) {
    console.error(`❌ Error processing queue item ${queueItem.id}:`, error);
    
    // Mark queue item as failed
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'failed',
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    // Mark job as failed  
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'error',
        error: error.message
      })
      .eq('id', queueItem.job_id);
    
    return { success: false, message: error.message };
  }
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
    console.log('🎯 Shareholder import queue handler triggered');
    
    // Process the queue
    const result = await processShareholderImportQueue();
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Queue handler error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});