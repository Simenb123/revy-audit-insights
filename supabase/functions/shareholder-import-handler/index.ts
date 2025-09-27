import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

// Constants
const TIME_BUDGET_MS = 45000; // 45 seconds budget
const CHUNK_SIZE = 1024 * 64; // 64KB chunks for streaming
const MAX_MEMORY_MB = 100;
const PROCESSING_CHUNK_SIZE = 200;
const DB_CHUNK_SIZE = 1000; // Database processing chunk size

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
  job_id: number;
}

// Memory monitoring function
function checkMemoryUsage(): void {
  if (Deno && Deno.memoryUsage) {
    const memory = Deno.memoryUsage();
    const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
    console.log(`🧠 Memory usage: ${usedMB}MB`);
    
    if (memory.heapUsed > 400 * 1024 * 1024) {
      throw new Error(`Memory usage too high (${usedMB}MB), aborting import to prevent timeout`);
    }
  }
}

// HTTP Range-based streaming download function
async function downloadFileInChunks(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: string) => Promise<void>,
  checkTimeout: () => number
): Promise<void> {
  console.log(`📥 Starting download for ${bucket}/${path}`);
  
  // Wait for TUS upload to finalize
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`📂 Before createSignedUrl - bucket: ${bucket}, path: ${path}`);
  
  // Create signed URL
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);
  
  if (signedUrlError) {
    console.error(`❌ Failed to create signed URL:`, signedUrlError);
    throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
  }
  
  console.log(`✅ Created signed URL successfully`);
  
  const chunkSize = 2 * 1024 * 1024; // 2MB chunks
  let offset = 0;
  let leftover = '';
  
  while (true) {
    // Check timeout at start of each download iteration
    const elapsed = checkTimeout();
    if (elapsed > TIME_BUDGET_MS) {
      console.log(`⏰ Time budget exceeded during download: ${elapsed}ms > ${TIME_BUDGET_MS}ms`);
      throw new Error(`Time budget exceeded after ${elapsed}ms`);
    }
    
    checkMemoryUsage();
    
    console.log(`📥 Downloading chunk at offset ${offset}`);
    
    const response = await fetch(signedUrlData.signedUrl, {
      headers: {
        'Range': `bytes=${offset}-${offset + chunkSize - 1}`,
        'User-Agent': 'Supabase-Edge-Function'
      }
    });
    
    console.log(`🌐 HTTP fetch status: ${response.status} ${response.statusText}`);
    
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const chunkBuffer = await response.arrayBuffer();
    let chunkText = new TextDecoder('utf-8').decode(chunkBuffer);
    
    console.log(`📄 Downloaded chunk: ${chunkText.length} characters`);
    
    // Handle partial lines at chunk boundaries
    chunkText = leftover + chunkText;
    const lines = chunkText.split('\n');
    leftover = lines.pop() || '';
    
    // Process complete lines
    if (lines.length > 0) {
      const completeText = lines.join('\n');
      if (completeText.trim()) {
        await onChunk(completeText);
      }
    }
    
    if (response.status !== 206) {
      console.log(`✅ Reached end of file`);
      break;
    }
    
    offset += chunkSize;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Process final leftover content
  if (leftover.trim()) {
    await onChunk(leftover);
  }
  
  console.log(`✅ Download completed successfully`);
}

// CSV streaming parser
async function streamParseCSV(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: any[]) => Promise<void>,
  checkTimeout: () => number
): Promise<void> {
  console.log(`📄 Starting CSV processing for ${bucket}/${path}`);
  
  let isHeaderParsed = false;
  let csvHeaders: string[] = [];
  let totalProcessed = 0;
  
  const processChunk = async (chunkText: string): Promise<void> => {
    if (!chunkText.trim()) return;
    
    // Check timeout before processing each chunk
    const elapsed = checkTimeout();
    if (elapsed > TIME_BUDGET_MS) {
      console.log(`⏰ Time budget exceeded during CSV parse: ${elapsed}ms > ${TIME_BUDGET_MS}ms`);
      throw new Error(`Time budget exceeded after ${elapsed}ms`);
    }
    
    checkMemoryUsage();
    console.log(`📄 Processing CSV chunk: ${chunkText.length} characters`);
    
    const parseResult = Papa.parse(chunkText, {
      header: isHeaderParsed,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    console.log(`📊 Parsed ${parseResult.data.length} records from chunk`);
    
    if (!isHeaderParsed && parseResult.data.length > 0) {
      if (Array.isArray(parseResult.data[0])) {
        csvHeaders = parseResult.data[0] as string[];
        console.log(`📋 CSV Headers detected:`, csvHeaders);
        
        const dataRows = parseResult.data.slice(1) as string[][];
        const objectRows = dataRows.map((row: string[]) => {
          const obj: any = {};
          csvHeaders.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        isHeaderParsed = true;
        console.log(`🔄 Converted ${objectRows.length} data rows to objects`);
        
        if (objectRows.length > 0) {
          await processDataRows(objectRows);
        }
      }
    } else if (isHeaderParsed && parseResult.data.length > 0) {
      await processDataRows(parseResult.data as any[]);
    }
  };
  
  const processDataRows = async (rows: any[]): Promise<void> => {
    if (rows.length === 0) return;
    
    for (let i = 0; i < rows.length; i += PROCESSING_CHUNK_SIZE) {
      // Check timeout for each data batch
      const elapsed = checkTimeout();
      if (elapsed > TIME_BUDGET_MS) {
        console.log(`⏰ Time budget exceeded during data processing: ${elapsed}ms > ${TIME_BUDGET_MS}ms`);
        throw new Error(`Time budget exceeded after ${elapsed}ms`);
      }
      
      const batch = rows.slice(i, i + PROCESSING_CHUNK_SIZE);
      console.log(`📊 Processing data batch ${Math.floor(i / PROCESSING_CHUNK_SIZE) + 1}: ${batch.length} rows`);
      
      await onChunk(batch);
      totalProcessed += batch.length;
      
      if (i + PROCESSING_CHUNK_SIZE < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      checkMemoryUsage();
    }
  };
  
  await downloadFileInChunks(supabase, bucket, path, processChunk, checkTimeout);
  console.log(`✅ CSV processing completed. Total processed: ${totalProcessed} rows`);
}

// Excel streaming parser (memory-optimized)
async function streamParseExcel(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: any[]) => Promise<void>,
  checkTimeout: () => number
): Promise<void> {
  console.log(`📊 Starting Excel processing for ${bucket}/${path}`);
  
  let totalProcessed = 0;
  
  try {
    checkMemoryUsage();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`📂 Before createSignedUrl - bucket: ${bucket}, path: ${path}`);
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }
    
    console.log(`📥 Downloading Excel file...`);
    const response = await fetch(signedUrlData.signedUrl);
    
    console.log(`🌐 HTTP fetch status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`📊 Downloaded Excel file: ${arrayBuffer.byteLength} bytes`);
    
    checkMemoryUsage();
    
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
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    
    console.log(`📋 Excel range: ${range.s.r} to ${range.e.r} rows`);
    
    // Extract headers
    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? String(cell.v) : `Column_${col}`);
    }
    
    console.log(`📋 Excel headers:`, headers);
    
    // Process rows in chunks
    for (let startRow = range.s.r + 1; startRow <= range.e.r; startRow += PROCESSING_CHUNK_SIZE) {
      // Check timeout for each Excel batch
      const elapsed = checkTimeout();
      if (elapsed > TIME_BUDGET_MS) {
        console.log(`⏰ Time budget exceeded during Excel processing: ${elapsed}ms > ${TIME_BUDGET_MS}ms`);
        throw new Error(`Time budget exceeded after ${elapsed}ms`);
      }
      
      const endRow = Math.min(startRow + PROCESSING_CHUNK_SIZE - 1, range.e.r);
      console.log(`🔄 Processing Excel rows ${startRow} to ${endRow}`);
      
      checkMemoryUsage();
      
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
        
        if ((globalThis as any).gc) {
          (globalThis as any).gc();
        }
        
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
    
    console.log(`✅ Excel processing completed. Total processed: ${totalProcessed} rows`);
  } catch (error: any) {
    console.error(`❌ Excel processing failed:`, error);
    throw error;
  }
}

// Helper function to map raw data to ShareholderRow format
function mapRowToShareholderRow(rawRow: any, mapping: Mapping, userId: string, jobId: number, defaultYear: number): ShareholderRow {
  const mapped: ShareholderRow = { 
    user_id: userId,
    job_id: jobId 
  };
  
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
          const numValue = String(value).replace(/[^\d]/g, '');
          mapped.antall_aksjer = parseInt(numValue) || 0;
          break;
        case 'year':
          mapped.year = parseInt(String(value)) || defaultYear;
          break;
      }
    }
  });
  
  // Set defaults
  mapped.landkode = mapped.landkode || 'NOR';
  mapped.year = mapped.year || defaultYear;
  mapped.antall_aksjer = mapped.antall_aksjer || 0;
  
  return mapped;
}

// Main queue processor
async function processShareholderImportQueue(): Promise<{ success: boolean; message: string; partial?: boolean; processed?: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('🔍 Checking for pending shareholder import jobs...');
  
  // First check for pending jobs
  let { data: queueItems, error: queueError } = await supabase
    .from('shareholder_import_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);
  
  // If no pending jobs, check for processing jobs with staging data
  if (!queueItems || queueItems.length === 0) {
    console.log('🔍 No pending jobs found, checking for processing jobs with staging data...');
    
    const { data: processingJobs, error: processingError } = await supabase
      .from('shareholder_import_queue')
      .select(`
        *,
        staging_count:shareholders_staging(count)
      `)
      .eq('status', 'processing')
      .order('created_at', { ascending: true });
    
    if (processingError) {
      console.error('❌ Failed to fetch processing jobs:', processingError);
      return { success: false, message: 'Failed to fetch processing jobs' };
    }
    
    // Find a processing job that has staging rows to process
    const jobWithStaging = processingJobs?.find(job => {
      // We need to check staging count - this is a rough approximation
      return true; // We'll check staging count in the processing logic
    });
    
    if (jobWithStaging) {
      queueItems = [jobWithStaging];
    }
  }
  
  if (queueError) {
    console.error('❌ Failed to fetch queue items:', queueError);
    return { success: false, message: 'Failed to fetch queue items' };
  }
  
  if (!queueItems || queueItems.length === 0) {
    console.log('📭 No pending or processing jobs in queue');
    return { success: true, message: 'No pending or processing jobs in queue' };
  }
  
  const queueItem = queueItems[0];
  console.log(`🚀 Processing queue item ${queueItem.id} for job ${queueItem.job_id}`);
  
  // Check if this job already has staging data to process
  const { data: stagingCount, error: stagingError } = await supabase
    .from('shareholders_staging')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', queueItem.job_id);
  
  const hasStagingData = (stagingCount as any)?.count > 0;
  console.log(`📊 Job ${queueItem.job_id} has ${(stagingCount as any)?.count || 0} staging rows`);
  
  let totalProcessed = 0;
  let totalErrors = 0;
  let isPartialComplete = false;
  let skipFileProcessing = hasStagingData;
  
  try {
    // Mark as processing
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    await supabase
      .from('import_jobs')
      .update({ status: 'processing' })
      .eq('id', queueItem.job_id);
    
    console.log(`🎯 Processing import job ${queueItem.id} for user ${queueItem.user_id}`);
    
    if (!skipFileProcessing) {
      console.log(`📂 File location: ${queueItem.bucket}/${queueItem.path}`);
      console.log(`🗂️ File mapping:`, JSON.stringify(queueItem.mapping));
    } else {
      console.log(`⏭️ Skipping file processing - using existing staging data`);
    }
    
    // Only clear staging if we're doing fresh file processing
    if (!skipFileProcessing) {
      console.log(`🗑️ Clearing existing staging data for job ${queueItem.job_id}...`);
      const { error: clearError } = await supabase
        .from('shareholders_staging')
        .delete()
        .eq('job_id', queueItem.job_id);
      
      if (clearError) {
        console.error('❌ Error clearing staging:', clearError);
      } else {
        console.log(`✅ Staging cleared - rows deleted for job_id: ${queueItem.job_id}`);
      }
    }
    
    const fileExtension = queueItem.path.toLowerCase().split('.').pop();
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    
    // Timeout checker - just returns elapsed time, doesn't throw
    const startTime = Date.now();
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed % 10000 < 1000) { // Log every 10 seconds
        console.log(`⏱️ Time used: ${elapsed}ms / ${TIME_BUDGET_MS}ms (${Math.round((elapsed/TIME_BUDGET_MS)*100)}%)`);
      }
      return elapsed;
    };
    
    const defaultYear = new Date().getFullYear();
    
    // Process chunk function - just inserts to staging
    const processChunk = async (chunk: any[]): Promise<void> => {
      if (chunk.length === 0) return;
      
      // Check if time budget is exceeded
      const elapsed = checkTimeout();
      if (elapsed > TIME_BUDGET_MS) {
        console.log(`⏰ Time budget exceeded: ${elapsed}ms > ${TIME_BUDGET_MS}ms - stopping processing`);
        throw new Error(`Time budget exceeded after ${elapsed}ms`);
      }
      
      const chunkStartTime = Date.now();
      console.log(`📋 Processing streaming chunk of ${chunk.length} rows`);
      console.log(`🕒 Chunk started at: ${new Date(chunkStartTime).toISOString()}`);
      
      checkMemoryUsage();
      
      // Show raw data sample  
      console.log(`📝 First few raw rows from chunk:`, JSON.stringify(chunk.slice(0, 3), null, 2));
      
      if (chunk.length > 0) {
        const csvColumns = Object.keys(chunk[0]);
        console.log(`🗂️ Available CSV columns:`, JSON.stringify(csvColumns));
      }
      
      console.log(`🔗 Mapping keys:`, JSON.stringify(Object.keys(queueItem.mapping)));
      console.log(`🔧 Queue item mapping:`, JSON.stringify(queueItem.mapping));
      console.log(`👤 User ID: ${queueItem.user_id}`);
      
      // Map the chunk data
      const mappedRows = chunk
        .filter(row => row && Object.keys(row).length > 0)
        .map(row => mapRowToShareholderRow(row, queueItem.mapping, queueItem.user_id, queueItem.job_id, defaultYear));
      
      console.log(`🔄 Mapped ${mappedRows.length} rows after filtering and mapping`);
      console.log(`📝 First few mapped rows:`, JSON.stringify(mappedRows.slice(0, 3), null, 2));
      
      if (mappedRows.length > 0) {
        // Insert to staging in smaller batches
        const STAGING_BATCH_SIZE = 100;
        for (let i = 0; i < mappedRows.length; i += STAGING_BATCH_SIZE) {
          // Check timeout before each staging batch
          const elapsed = checkTimeout();
          if (elapsed > TIME_BUDGET_MS) {
            console.log(`⏰ Time budget exceeded during staging insert: ${elapsed}ms > ${TIME_BUDGET_MS}ms`);
            throw new Error(`Time budget exceeded after ${elapsed}ms`);
          }
          
          const batch = mappedRows.slice(i, i + STAGING_BATCH_SIZE);
          const batchNumber = Math.floor(i / STAGING_BATCH_SIZE) + 1;
          
          console.log(`📥 Inserting batch ${batchNumber}: ${batch.length} rows to staging`);
          
          const insertStartTime = Date.now();
          const { error: insertError } = await supabase
            .from('shareholders_staging')
            .insert(batch);
          
          const insertDuration = Date.now() - insertStartTime;
          console.log(`⏱️ Staging insert took: ${insertDuration}ms`);
            
          if (insertError) {
            console.error(`❌ Staging insert error for batch ${batchNumber}:`, insertError);
            throw new Error(`Failed to insert batch ${batchNumber} to staging: ${insertError.message}`);
          }
          
          console.log(`✅ Staging insert OK - ${batch.length} rows inserted in ${insertDuration}ms`);
          
          if (i + STAGING_BATCH_SIZE < mappedRows.length) {
            await new Promise(resolve => setTimeout(resolve, 25));
          }
        }
        
        console.log(`✅ Inserted ${mappedRows.length} rows to staging for job ${queueItem.job_id}`);
      }
    };
    
    // Stream parse based on file type with timeout handling (only if no existing staging data)
    if (!skipFileProcessing) {
      try {
        console.log(`📂 About to fetch file from bucket: ${queueItem.bucket}, path: ${queueItem.path}`);
        
        if (isExcel) {
          console.log('📊 Starting streaming Excel processing...');
          await streamParseExcel(supabase, queueItem.bucket, queueItem.path, processChunk, checkTimeout);
        } else {
          console.log('📄 Starting streaming CSV processing...');
          await streamParseCSV(supabase, queueItem.bucket, queueItem.path, processChunk, checkTimeout);
        }
      } catch (error: any) {
        if (error.message && error.message.includes('Time budget exceeded')) {
          console.log(`⏰ Processing paused due to time budget. Will continue with batch processing...`);
          isPartialComplete = true;
        } else {
          throw error;
        }
      }
    }
    
    // After all file processing is complete, process all staging data for this job
    console.log(`🚀 File processing complete. Now processing all staging data for job ${queueItem.job_id}...`);
    
    // Process from staging using database procedure in a loop until all rows are processed
    let processedCount = 0;
    do {
      // Check timeout before each batch
      const elapsed = checkTimeout();
      if (elapsed > TIME_BUDGET_MS) {
        console.log(`⏰ Time budget exceeded during DB processing: ${elapsed}ms > ${TIME_BUDGET_MS}ms`);
        isPartialComplete = true;
        break;
      }
      
      const dbProcessStartTime = Date.now();
      const { data: batchResult, error: processError } = await supabase.rpc('process_shareholders_batch', {
        p_job_id: queueItem.job_id,
        p_limit: DB_CHUNK_SIZE
      });
      
      const dbProcessDuration = Date.now() - dbProcessStartTime;
      console.log(`🔄 DB batch processing took: ${dbProcessDuration}ms`);
      
      if (processError) {
        console.error(`❌ DB batch processing error:`, processError);
        throw new Error(`Failed to process batch: ${processError.message}`);
      }
      
      processedCount = batchResult?.processed_count ?? 0;
      const errorsCount = batchResult?.errors_count ?? 0;
      
      console.log(`📊 DB batch result: processed ${processedCount}, errors ${errorsCount}`);
      
      if (processedCount > 0) {
        totalProcessed += processedCount;
        totalErrors += errorsCount;
        
        // Update job with current progress
        await supabase
          .from('import_jobs')
          .update({ rows_loaded: totalProcessed })
          .eq('id', queueItem.job_id);
        
        console.log(`✅ Batch processing result: processed ${processedCount} rows, errors: ${errorsCount} (total processed: ${totalProcessed})`);
      }
    } while (processedCount > 0);
    
    // Mark job as completed when no more staging rows to process (unless partial due to timeout)
    if (!isPartialComplete) {
      console.log(`🏁 All staging rows processed, marking job as completed`);
      
      const { error: finalCompleteError } = await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          rows_loaded: totalProcessed,
          needs_aggregation: true
        })
        .eq('id', queueItem.job_id);
      
      if (finalCompleteError) {
        console.error('❌ Error marking job as completed:', finalCompleteError);
      } else {
        console.log(`✅ Job ${queueItem.job_id} marked as completed with ${totalProcessed} rows processed`);
      }
      
      // Also mark queue item as completed
      await supabase
        .from('shareholder_import_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);
    }
    
    // Update final status
    const statusUpdate = isPartialComplete ? 'processing' : 'completed';
    
    const { error: statusUpdateError } = await supabase
      .from('import_jobs')
      .update({
        status: statusUpdate,
        rows_loaded: totalProcessed,
        total_rows: totalProcessed + totalErrors,
        completed_at: isPartialComplete ? null : new Date().toISOString(),
        progress_details: {
          partial: isPartialComplete,
          processed: totalProcessed,
          errors: totalErrors,
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', queueItem.job_id);
    
    if (statusUpdateError) {
      console.error('❌ Error updating job status:', statusUpdateError);
    } else {
      console.log(`✅ Job ${queueItem.job_id} marked as ${statusUpdate}. Processed: ${totalProcessed}, Errors: ${totalErrors}`);
    }
    
    const { error: queueCompleteError } = await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: isPartialComplete ? 'processing' : 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    if (queueCompleteError) {
      console.error('❌ Error updating queue status:', queueCompleteError);
    }
    
    const message = isPartialComplete 
      ? `Partial import completed (${totalProcessed} rows), will continue automatically`
      : `Successfully processed ${totalProcessed} rows`;
      
    console.log(`✅ Import result: ${message}`);
    return { 
      success: true, 
      message,
      partial: isPartialComplete,
      processed: totalProcessed
    };
    
  } catch (error: any) {
    console.error(`❌ Error processing queue item ${queueItem.id}:`, error);
    
    // Check if timeout error (don't treat as failure)
    const isTimeoutError = error.message && error.message.includes('Time budget exceeded');
    
    if (isTimeoutError) {
      console.log(`⏰ Job ${queueItem.job_id} paused due to time budget - will resume later`);
      
      const { error: pauseError } = await supabase
        .from('import_jobs')
        .update({
          status: 'processing', // Keep as processing so it resumes
          rows_loaded: totalProcessed,
          progress_details: {
            partial: true,
            processed: totalProcessed,
            errors: totalErrors,
            paused_at: new Date().toISOString(),
            reason: 'time_budget_exceeded'
          }
        })
        .eq('id', queueItem.job_id);
        
      if (pauseError) {
        console.error('❌ Error updating job to paused status:', pauseError);
      }
      
      return { 
        success: true, 
        partial: true, 
        processed: totalProcessed,
        message: `Partial import completed (${totalProcessed} rows), will continue automatically`
      };
    } else {
      // Real error - mark as failed
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({
          status: 'error',
          error: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', queueItem.job_id);
      
      if (updateError) {
        console.error('❌ Error updating job status to failed:', updateError);
      }
      
      throw error;
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Shareholder import queue handler triggered');
    
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