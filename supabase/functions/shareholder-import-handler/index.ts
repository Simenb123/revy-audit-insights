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

// Helper function to download and parse file in chunks
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

// Main queue handler function
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
    return;
  }
  
  if (!queueItems || queueItems.length === 0) {
    console.log('📭 No pending jobs in queue');
    return;
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
    
    // Clear staging table for this user
    console.log('🗑️ Clearing existing staging data...');
    await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
    
    let totalProcessed = 0;
    let offset = 0;
    let done = false;
    const defaultYear = new Date().getFullYear();
    
    // Process file in chunks
    while (!done) {
      console.log(`📊 Processing chunk at offset ${offset}`);
      
      // Download and parse chunk
      const fileChunk = await downloadAndParseFileChunk(
        supabase, 
        queueItem.bucket, 
        queueItem.path, 
        offset, 
        BATCH_SIZE
      );
      
      if (!fileChunk.data || fileChunk.data.length === 0) {
        console.log('📭 No more data to process');
        done = true;
        break;
      }
      
      // Update job with total rows if not set yet
      if (fileChunk.totalRows > 0) {
        await supabase
          .from('import_jobs')
          .update({ total_rows: fileChunk.totalRows })
          .eq('id', queueItem.job_id)
          .is('total_rows', null);
      }
      
      console.log(`📋 Processing ${fileChunk.data.length} rows from chunk`);
      
      // Map rows to ShareholderRow format
      const mappedRows: ShareholderRow[] = [];
      
      for (const rawRow of fileChunk.data) {
        // Skip empty rows
        if (!rawRow || Object.keys(rawRow).length === 0) {
          continue;
        }
        
        const mappedRow = mapRowToShareholderRow(rawRow, queueItem.mapping, queueItem.user_id, defaultYear);
        mappedRows.push(mappedRow);
      }
      
      if (mappedRows.length > 0) {
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
          p_job_id: queueItem.job_id,
          p_user_id: queueItem.user_id,
          p_offset: 0, // Always 0 for staging table offset
          p_limit: mappedRows.length
        });
        
        if (processError) {
          throw new Error(`Failed to process batch: ${processError.message}`);
        }
        
        const processedCount = batchResult?.processed_count || 0;
        totalProcessed += processedCount;
        console.log(`🚀 Processed ${processedCount} rows from staging to production (total: ${totalProcessed})`);
      }
      
      offset += fileChunk.data.length;
      done = fileChunk.done;
      
      // Update job progress
      await supabase
        .from('import_jobs')
        .update({ 
          rows_loaded: totalProcessed,
          status: done ? 'completed' : 'running'
        })
        .eq('id', queueItem.job_id);
      
      console.log(`📊 Progress: ${totalProcessed} rows processed${done ? ' - COMPLETED' : ''}`);
    }
    
    // Mark queue item as completed
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    // Final update to job
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'completed',
        rows_loaded: totalProcessed
      })
      .eq('id', queueItem.job_id);
    
    console.log(`✅ Successfully completed import job ${queueItem.job_id} with ${totalProcessed} rows processed`);
    
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
    await processShareholderImportQueue();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Queue processing completed'
    }), {
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