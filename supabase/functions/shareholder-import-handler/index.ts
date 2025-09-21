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

const PROCESSING_CHUNK_SIZE = 1000; // Reduced chunk size for better memory management
const DOWNLOAD_CHUNK_SIZE = 1024 * 1024; // 1MB chunks for streaming download

// Streaming CSV parser for large files
async function streamParseCSV(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: any[]) => Promise<void>
): Promise<void> {
  console.log(`📥 Starting streaming download of ${bucket}/${path}`);
  
  let offset = 0;
  let isFirstChunk = true;
  let csvHeaders: string[] = [];
  let partialRow = '';
  let totalProcessed = 0;
  
  while (true) {
    // Download chunk using range request
    console.log(`📦 Downloading chunk at offset ${offset}...`);
    const { data: chunkData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path, {
        transform: {
          width: undefined,
          height: undefined,
          resize: undefined,
          format: undefined,
          quality: undefined
        }
      });
    
    if (downloadError) {
      throw new Error(`Failed to download chunk: ${downloadError.message}`);
    }
    
    // For now, we'll download the full file but process it in streaming chunks
    // This is a limitation of Supabase Storage API which doesn't support range requests
    if (isFirstChunk) {
      const arrayBuffer = await chunkData.arrayBuffer();
      const csvText = new TextDecoder('utf-8').decode(arrayBuffer);
      
      console.log(`📄 Processing CSV file in streaming chunks (${csvText.length} chars total)`);
      
      // Process CSV in streaming fashion using Papa Parse streaming
      return new Promise((resolve, reject) => {
        const chunkBuffer: any[] = [];
        let headerSet = false;
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          step: async (row: any, parser: any) => {
            try {
              if (!headerSet) {
                console.log(`📋 CSV Headers found:`, Object.keys(row.data));
                headerSet = true;
              }
              
              chunkBuffer.push(row.data);
              totalProcessed++;
              
              // Process in chunks to prevent memory buildup
              if (chunkBuffer.length >= PROCESSING_CHUNK_SIZE) {
                console.log(`🔄 Processing chunk of ${chunkBuffer.length} rows (total processed: ${totalProcessed})`);
                
                // Pause parsing while processing chunk
                parser.pause();
                
                try {
                  await onChunk([...chunkBuffer]);
                  chunkBuffer.length = 0; // Clear buffer
                  
                  // Force garbage collection
                  if (globalThis.gc) {
                    globalThis.gc();
                  }
                  
                  // Resume parsing
                  parser.resume();
                } catch (error) {
                  parser.abort();
                  reject(error);
                  return;
                }
              }
            } catch (error) {
              parser.abort();
              reject(error);
            }
          },
          complete: async () => {
            try {
              // Process remaining rows in buffer
              if (chunkBuffer.length > 0) {
                console.log(`🔄 Processing final chunk of ${chunkBuffer.length} rows`);
                await onChunk([...chunkBuffer]);
              }
              
              console.log(`✅ Streaming CSV parsing completed. Total processed: ${totalProcessed} rows`);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: (error: any) => {
            reject(new Error(`CSV parsing failed: ${error.message}`));
          }
        });
      });
    }
    
    break; // For now, we only do single download due to Supabase Storage limitations
  }
}

// Optimized Excel processing for large files
async function streamParseExcel(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: any[]) => Promise<void>
): Promise<void> {
  console.log(`📊 Starting Excel file processing for ${bucket}/${path}`);
  
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(path);
    
  if (downloadError) {
    throw new Error(`Failed to download Excel file: ${downloadError.message}`);
  }
  
  const arrayBuffer = await fileData.arrayBuffer();
  console.log(`📊 Processing Excel file in memory-efficient chunks`);
  
  // Read workbook with minimal memory usage options
  const workbook = XLSX.read(arrayBuffer, { 
    type: 'array',
    cellText: false,
    cellDates: true,
    cellNF: false,
    sheetStubs: false,
    WTF: false
  });
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get range to process in chunks
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  console.log(`📋 Excel range: ${range.s.r} to ${range.e.r} rows`);
  
  // Extract headers from first row
  const headers: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const cell = worksheet[cellAddress];
    headers.push(cell ? String(cell.v) : `Column_${col}`);
  }
  
  console.log(`📋 Excel headers:`, headers);
  
  // Process rows in chunks
  let totalProcessed = 0;
  for (let startRow = range.s.r + 1; startRow <= range.e.r; startRow += PROCESSING_CHUNK_SIZE) {
    const endRow = Math.min(startRow + PROCESSING_CHUNK_SIZE - 1, range.e.r);
    
    console.log(`🔄 Processing Excel rows ${startRow} to ${endRow}`);
    
    const chunkRows: any[] = [];
    
    for (let row = startRow; row <= endRow; row++) {
      const rowObj: any = {};
      let hasData = false;
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        const value = cell ? cell.v : '';
        
        if (value !== '' && value !== null && value !== undefined) {
          hasData = true;
        }
        
        rowObj[headers[col - range.s.c]] = value;
      }
      
      if (hasData) {
        chunkRows.push(rowObj);
      }
    }
    
    if (chunkRows.length > 0) {
      await onChunk(chunkRows);
      totalProcessed += chunkRows.length;
      
      // Force garbage collection
      if (globalThis.gc) {
        globalThis.gc();
      }
    }
  }
  
  console.log(`✅ Excel processing completed. Total processed: ${totalProcessed} rows`);
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
    
    // Clear staging table for this user first
    console.log('🗑️ Clearing existing staging data...');
    await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
    
    const defaultYear = new Date().getFullYear();
    let totalProcessed = 0;
    let estimatedTotalRows = 0;
    
    // Detect file type for streaming approach
    const isExcel = queueItem.path.toLowerCase().endsWith('.xlsx') || queueItem.path.toLowerCase().endsWith('.xls');
    
    // Streaming chunk processor function
    const processChunk = async (chunk: any[]): Promise<void> => {
      if (chunk.length === 0) return;
      
      console.log(`📋 Processing streaming chunk of ${chunk.length} rows`);
      
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
        console.log(`✅ Processed ${processedCount} rows (total processed so far: ${totalProcessed})`);
        
        // Clear staging table after each batch to prevent accumulation
        await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
        
        // Update job progress (use processed count as total for now, will update at end)
        await supabase
          .from('import_jobs')
          .update({ 
            rows_loaded: totalProcessed,
            total_rows: Math.max(totalProcessed, estimatedTotalRows)
          })
          .eq('id', queueItem.job_id);
      }
    };
    
    // Stream parse the file based on type
    if (isExcel) {
      console.log('📊 Starting streaming Excel processing...');
      await streamParseExcel(supabase, queueItem.bucket, queueItem.path, processChunk);
    } else {
      console.log('📄 Starting streaming CSV processing...');
      await streamParseCSV(supabase, queueItem.bucket, queueItem.path, processChunk);
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