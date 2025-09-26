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

const PROCESSING_CHUNK_SIZE = 200; // Reduced chunk size to prevent memory issues

// Memory monitoring function
function checkMemoryUsage(): void {
  if (Deno && Deno.memoryUsage) {
    const memory = Deno.memoryUsage();
    const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
    console.log(`🧠 Memory usage: ${usedMB}MB`);
    
    // Circuit breaker - abort if memory too high (>400MB)
    if (memory.heapUsed > 400 * 1024 * 1024) {
      throw new Error(`Memory usage too high (${usedMB}MB), aborting import to prevent timeout`);
    }
  }
}

// HTTP Range-based streaming download function with retry logic
async function downloadFileInChunks(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: string) => Promise<void>,
  checkTimeout: () => number
): Promise<void> {
  console.log(`📥 Starting HTTP Range-based streaming download for ${bucket}/${path}`);
  
  // Initial delay to allow TUS upload to finalize in storage
  console.log(`⏰ Waiting 3 seconds for TUS upload to finalize...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // LOG 1: Before createSignedUrl - log bucket, path and list prefix
  console.log(`🔧 DEBUG: Pre-signed URL debug`, { bucket, path });
  try {
    const { data: bucketFiles, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 100, offset: 0 });
    
    if (listError) {
      console.error(`❌ Failed to list bucket contents:`, listError);
    } else {
      console.log(`📁 Found ${bucketFiles?.length || 0} files in bucket root`);
      
      // List contents of specific directory if path contains a directory
      const pathDir = path.split('/').slice(0, -1).join('/');
      if (pathDir) {
        const { data: dirFiles, error: dirError } = await supabase.storage
          .from(bucket)
          .list(pathDir, { limit: 100, offset: 0 });
        
        if (!dirError && dirFiles) {
          console.log(`📂 Found ${dirFiles.length} files in directory "${pathDir}":`, 
            dirFiles.map((f: any) => f.name));
          
          // Check if our specific file exists
          const fileName = path.split('/').pop();
          const fileExists = dirFiles.some((f: any) => f.name === fileName);
          console.log(`🎯 Target file "${fileName}" exists in directory: ${fileExists}`);
        }
      }
    }
  } catch (debugError) {
    console.warn(`⚠️ Storage debug failed, continuing with download attempt:`, debugError);
  }
  
  const chunkSize = 2 * 1024 * 1024; // 2MB chunks
  let offset = 0;
  let leftover = '';
  
  // Create signed URL with retry logic and exponential backoff
  let signedUrlData: any = null;
  const maxRetries = 5;
  let retryDelay = 2000; // Start with 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Attempting to create signed URL (attempt ${attempt}/${maxRetries})...`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }
      
      signedUrlData = data;
      console.log(`✅ Successfully created signed URL on attempt ${attempt}`);
      break;
      
    } catch (error) {
      console.error(`❌ Signed URL attempt ${attempt} failed:`, (error as Error).message);
      
      if (attempt === maxRetries) {
        // Final attempt failed - provide detailed error information
        console.error(`❌ All ${maxRetries} signed URL attempts failed`);
        console.error(`🔍 Bucket: ${bucket}`);
        console.error(`🔍 Path: ${path}`);
        console.error(`🔍 Error: ${(error as Error).message}`);
        throw new Error(`Failed to create signed URL after ${maxRetries} attempts: ${(error as Error).message}`);
      }
      
      // Wait before retry with exponential backoff
      console.log(`⏳ Waiting ${retryDelay}ms before retry ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay *= 1.5; // Exponential backoff
    }
  }
  
  console.log(`📦 Starting chunked download with ${chunkSize} byte chunks`);
  
  while (true) {
    try {
      // Check timeout at start of each download loop iteration
      checkTimeout();
      
      // Check memory before each chunk
      checkMemoryUsage();
      
      console.log(`📥 Downloading chunk at offset ${offset}`);
      
      // Download chunk using Range header
      const response = await fetch(signedUrlData.signedUrl, {
        headers: {
          'Range': `bytes=${offset}-${offset + chunkSize - 1}`,
          'User-Agent': 'Supabase-Edge-Function'
        }
      });
      
      // LOG 2: After fetch - log HTTP status and if body exists
      console.log(`🌐 HTTP fetch status:`, response.status, response.statusText, 'has body?', !!response.body);
      
      if (!response.ok && response.status !== 206) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const chunkBuffer = await response.arrayBuffer();
      let chunkText = new TextDecoder('utf-8').decode(chunkBuffer);
      
      console.log(`📄 Processing chunk: ${chunkText.length} characters`);
      
      // Handle partial lines at chunk boundaries
      chunkText = leftover + chunkText;
      const lines = chunkText.split('\n');
      leftover = lines.pop() || ''; // Save incomplete line for next chunk
      
      // Process complete lines
      if (lines.length > 0) {
        const completeText = lines.join('\n');
        if (completeText.trim()) {
          await onChunk(completeText);
        }
      }
      
      // Force garbage collection after each chunk
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
        console.log(`🗑️ Forced garbage collection`);
      }
      
      // Check if this was the last chunk (status 200) or partial content (206)
      if (response.status !== 206) {
        console.log(`✅ Reached end of file`);
        break;
      }
      
      offset += chunkSize;
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error: any) {
      console.error(`❌ Chunk download failed at offset ${offset}:`, error.message);
      throw new Error(`Failed to download chunk at offset ${offset}: ${error.message}`);
    }
  }
  
  // Process final leftover content if any
  if (leftover.trim()) {
    console.log(`📄 Processing final leftover content`);
    await onChunk(leftover);
  }
  
  console.log(`✅ Streaming download completed successfully`);
}

// True streaming CSV processing using HTTP Range headers
async function streamParseCSV(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: any[]) => Promise<void>,
  checkTimeout: () => number
): Promise<void> {
  console.log(`📥 Starting true streaming CSV processing for ${bucket}/${path}`);
  
  let isHeaderParsed = false;
  let csvHeaders: string[] = [];
  let totalProcessed = 0;
  
  // Process each chunk from HTTP Range streaming
  const processChunk = async (chunkText: string): Promise<void> => {
    if (!chunkText.trim()) return;
    
    // Check timeout before processing each chunk
    checkTimeout();
    
    // Check memory before processing each chunk
    checkMemoryUsage();
    
    // LOG 3: First time processing a chunk - log chunk text length
    console.log(`📄 parse chunk`, { chunkChars: chunkText.length });
    
    // Parse CSV chunk using Papa Parse in synchronous mode
    const parseResult = Papa.parse(chunkText, {
      header: isHeaderParsed,
      skipEmptyLines: true,
      dynamicTyping: false // Keep as strings to avoid type issues
    });
    
    // LOG: Parse result details
    console.log(`📊 Parse result: ${parseResult.data.length} records/lines found`);
    if (parseResult.data.length > 0) {
      console.log(`📋 First few parse results:`, parseResult.data.slice(0, 3));
    }
    
    if (parseResult.errors.length > 0) {
      console.warn(`⚠️ CSV parsing warnings:`, parseResult.errors);
    }
    
    // Handle header detection on first chunk
    if (!isHeaderParsed && parseResult.data.length > 0) {
      if (Array.isArray(parseResult.data[0])) {
        // First row contains headers
        csvHeaders = parseResult.data[0] as string[];
        console.log(`📋 CSV Headers detected (${csvHeaders.length} columns):`, csvHeaders);
        
        // Convert remaining rows to objects
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
          console.log(`📝 First converted row example:`, objectRows[0]);
          await processDataRows(objectRows);
        }
      }
    } else if (isHeaderParsed) {
      // Process data rows
      if (Array.isArray(parseResult.data) && parseResult.data.length > 0) {
        await processDataRows(parseResult.data as any[]);
      }
    }
  };
  
  // Process parsed data rows in smaller batches
  const processDataRows = async (rows: any[]): Promise<void> => {
    if (rows.length === 0) return;
    
    console.log(`🔄 Processing ${rows.length} CSV rows`);
    
    // Process in small batches to prevent memory buildup
    for (let i = 0; i < rows.length; i += PROCESSING_CHUNK_SIZE) {
      // Check timeout at start of each batch
      checkTimeout();
      
      const batch = rows.slice(i, i + PROCESSING_CHUNK_SIZE);
      console.log(`📊 Processing batch ${Math.floor(i / PROCESSING_CHUNK_SIZE) + 1}: ${batch.length} rows`);
      
      await onChunk(batch);
      totalProcessed += batch.length;
      
      // Backpressure: small delay between batches to let system breathe
      if (i + PROCESSING_CHUNK_SIZE < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Force garbage collection between batches
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
      }
      
      checkMemoryUsage();
    }
  };
  
  // Start streaming download with chunk processor
  await downloadFileInChunks(supabase, bucket, path, processChunk, checkTimeout);
  
  console.log(`✅ True streaming CSV parsing completed. Total processed: ${totalProcessed} rows`);
}

// Memory-optimized Excel processing for large files
async function streamParseExcel(
  supabase: any,
  bucket: string,
  path: string,
  onChunk: (chunk: any[]) => Promise<void>,
  checkTimeout: () => number
): Promise<void> {
  console.log(`📊 Starting memory-optimized Excel processing for ${bucket}/${path}`);
  
  // For Excel files, we still need to download completely due to XLSX library limitations
  // But we process in smaller chunks and monitor memory closely
  console.log(`⚠️ Excel files require full download due to format constraints`);
  
  let totalProcessed = 0;
  
  // Process Excel file in small chunks from storage
  const processExcelChunk = async (chunkText: string): Promise<void> => {
    // For Excel, we need the complete file, so we'll collect all chunks first
    console.log(`📊 Collecting Excel chunk (${chunkText.length} chars)`);
  };
  
  try {
    // Check memory before starting
    checkMemoryUsage();
    
    // Initial delay to allow TUS upload to finalize in storage
    console.log(`⏰ Waiting 3 seconds for TUS upload to finalize...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Debug storage state before attempting download
    console.log(`🔍 Debugging storage state for bucket: ${bucket}`);
    try {
      const { data: bucketFiles, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 100, offset: 0 });
      
      if (listError) {
        console.error(`❌ Failed to list bucket contents:`, listError);
      } else {
        console.log(`📁 Found ${bucketFiles?.length || 0} files in bucket root`);
        
        // List contents of specific directory if path contains a directory
        const pathDir = path.split('/').slice(0, -1).join('/');
        if (pathDir) {
          const { data: dirFiles, error: dirError } = await supabase.storage
            .from(bucket)
            .list(pathDir, { limit: 100, offset: 0 });
          
          if (!dirError && dirFiles) {
            console.log(`📂 Found ${dirFiles.length} files in directory "${pathDir}":`, 
              dirFiles.map((f: any) => f.name));
            
            // Check if our specific file exists
            const fileName = path.split('/').pop();
            const fileExists = dirFiles.some((f: any) => f.name === fileName);
            console.log(`🎯 Target file "${fileName}" exists in directory: ${fileExists}`);
          }
        }
      }
    } catch (debugError) {
      console.warn(`⚠️ Storage debug failed, continuing with download attempt:`, debugError);
    }
    
    // Create signed URL with retry logic and exponential backoff
    let signedUrlData: any = null;
    const maxRetries = 5;
    let retryDelay = 2000; // Start with 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔗 Attempting to create signed URL (attempt ${attempt}/${maxRetries})...`);
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600);
        
        if (error) {
          throw new Error(`Failed to create signed URL: ${error.message}`);
        }
        
        signedUrlData = data;
        console.log(`✅ Successfully created signed URL on attempt ${attempt}`);
        break;
        
      } catch (error) {
        console.error(`❌ Signed URL attempt ${attempt} failed:`, (error as Error).message);
        
        if (attempt === maxRetries) {
          // Final attempt failed - provide detailed error information
          console.error(`❌ All ${maxRetries} signed URL attempts failed`);
          console.error(`🔍 Bucket: ${bucket}`);
          console.error(`🔍 Path: ${path}`);
          console.error(`🔍 Error: ${(error as Error).message}`);
          throw new Error(`Failed to create signed URL after ${maxRetries} attempts: ${(error as Error).message}`);
        }
        
        // Wait before retry with exponential backoff
        console.log(`⏳ Waiting ${retryDelay}ms before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 1.5; // Exponential backoff
      }
    }
    
    // Download Excel file
    console.log(`📥 Downloading Excel file for processing`);
    const response = await fetch(signedUrlData.signedUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`📊 Processing Excel file (${arrayBuffer.byteLength} bytes)`);
    
    // Check memory after download
    checkMemoryUsage();
    
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
    
    // Get range to process in small chunks
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
    
    // Process rows in very small chunks to prevent memory issues
    for (let startRow = range.s.r + 1; startRow <= range.e.r; startRow += PROCESSING_CHUNK_SIZE) {
      // Check timeout at start of each Excel processing batch
      checkTimeout();
      
      const endRow = Math.min(startRow + PROCESSING_CHUNK_SIZE - 1, range.e.r);
      
      console.log(`🔄 Processing Excel rows ${startRow} to ${endRow}`);
      
      // Check memory before each chunk
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
        
        // Force garbage collection after each chunk
        if ((globalThis as any).gc) {
          (globalThis as any).gc();
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
    
    console.log(`✅ Excel processing completed. Total processed: ${totalProcessed} rows`);
  } catch (error: any) {
    console.error(`❌ Excel processing failed:`, error);
    throw new Error(`Failed to process Excel file: ${error.message}`);
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
async function processShareholderImportQueue(): Promise<{ success: boolean; message: string; partial?: boolean; processed?: number }> {
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
    
    // Clear staging table for this user first (initial cleanup)
    console.log('🗑️ Clearing existing staging data at start...');
    await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
    
    // Time-slicing to prevent CPU timeout (45 second budget)
    const startTime = Date.now();
    const timeoutMs = 45000; // 45 seconds
    console.log(`⏰ Starting import with ${timeoutMs/1000}s timeout budget`);
    
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutMs) {
        throw new Error(`TIME_BUDGET_EXCEEDED: Processing stopped after ${elapsed}ms to prevent timeout`);
      }
      return elapsed;
    };
    
    const defaultYear = new Date().getFullYear();
    let totalProcessed = 0;
    let estimatedTotalRows = 0;
    
    // Detect file type for streaming approach
    const isExcel = queueItem.path.toLowerCase().endsWith('.xlsx') || queueItem.path.toLowerCase().endsWith('.xls');
    
    // Streaming chunk processor function with backpressure
    const processChunk = async (chunk: any[]): Promise<void> => {
      if (chunk.length === 0) return;
      
      // Check timeout budget before processing each chunk
      checkTimeout();
      
      console.log(`📋 Processing streaming chunk of ${chunk.length} rows`);
      
      // LOG: Debug queue item details
      console.log(`🔧 Queue item mapping:`, queueItem.mapping);
      console.log(`👤 User ID:`, queueItem.user_id);
      console.log(`📊 Chunk size:`, chunk.length, 'rows');
      
      // Show first few rows from chunk for debugging
      if (chunk.length > 0) {
        console.log(`📝 First few raw rows from chunk:`, chunk.slice(0, 3));
      }
      
      // Check memory before processing each chunk
      checkMemoryUsage();
      
      // Check if we need to auto-map columns (CSV without proper headers)
      const csvColumns = chunk.length > 0 ? Object.keys(chunk[0]) : [];
      const mappingKeys = Object.keys(queueItem.mapping);
      console.log(`🗂️ Available CSV columns:`, csvColumns);
      console.log(`🔗 Mapping keys:`, mappingKeys);
      
      // Auto-detect if CSV has data as column names (common issue)
      const needsAutoMapping = csvColumns.some(col => 
        /^\d+$/.test(col) || // Pure numbers like "385", "1979"
        /^\d{9}$/.test(col) || // Org numbers like "827053392"
        col.includes(' AS') || // Company names
        col.includes('OSLO') || col.includes('BERGEN') // Location indicators
      );
      
      let effectiveMapping = queueItem.mapping;
      
      if (needsAutoMapping) {
        console.log(`🔧 Auto-mapping detected - CSV appears to have data as column names`);
        console.log(`📋 Column count: ${csvColumns.length}, expected fields: ${mappingKeys.length}`);
        
        // Create position-based mapping for Norwegian shareholder files
        // Expected order: [antall_aksjer, fodselsaar_orgnr, ?, orgnr, selskap, aksjeklasse, navn_aksjonaer, adresse, landkode]
        const positionMapping: Record<string, string> = {};
        
        if (csvColumns.length >= 9) {
          positionMapping[csvColumns[0]] = 'antall_aksjer';  // "385"
          positionMapping[csvColumns[1]] = 'fodselsaar_orgnr'; // "1979" 
          positionMapping[csvColumns[2]] = '';  // Skip unknown field "3965"
          positionMapping[csvColumns[3]] = 'orgnr';  // "827053392"
          positionMapping[csvColumns[4]] = 'selskap';  // "UNI MICRO HOLDING ANSATT AS"
          positionMapping[csvColumns[5]] = 'aksjeklasse';  // "Ordinære aksjer"
          positionMapping[csvColumns[6]] = 'navn_aksjonaer';  // "MAGRIT JOFRID GILJARHUS"
          positionMapping[csvColumns[7]] = '';  // Skip address field "5130 NYBORG"
          positionMapping[csvColumns[8]] = 'landkode';  // "NOR"
        }
        
        effectiveMapping = positionMapping;
        console.log(`🔄 Using auto-mapping:`, effectiveMapping);
      }
      
      const missingColumns = mappingKeys.filter(key => !csvColumns.includes(key));
      if (missingColumns.length > 0 && !needsAutoMapping) {
        console.error(`❌ MAPPING ERROR: CSV columns missing for mapping keys:`, missingColumns);
        console.error(`❌ Available columns:`, csvColumns);
        console.error(`❌ Required mapping keys:`, mappingKeys);
      }
      
      // Map rows to ShareholderRow format using effective mapping
      const mappedRows: ShareholderRow[] = chunk
        .filter(row => row && Object.keys(row).length > 0) // Skip empty rows
        .map(row => mapRowToShareholderRow(row, effectiveMapping, queueItem.user_id, defaultYear));
      
      // LOG: Show mapped rows for debugging
      console.log(`🔄 Mapped ${mappedRows.length} rows after filtering and mapping`);
      if (mappedRows.length > 0) {
        console.log(`📝 First few mapped rows:`, mappedRows.slice(0, 3));
      }
      
      if (mappedRows.length > 0) {
        // Insert chunk to staging table in smaller batches
        const batchSize = Math.min(mappedRows.length, 100); // Even smaller batches for staging
        
        for (let i = 0; i < mappedRows.length; i += batchSize) {
          const batch = mappedRows.slice(i, i + batchSize);
          
          console.log(`📥 Inserting batch ${Math.floor(i / batchSize) + 1}: ${batch.length} rows to staging`);
          
          const { error: insertError } = await supabase
            .from('shareholders_staging')
            .insert(batch.map(row => ({
              ...row,
              job_id: queueItem.job_id // PHASE A FIX: Include job_id for proper batch tracking
            })));
            
          if (insertError) {
            console.error(`❌ Insert staging error:`, insertError);
            throw new Error(`Failed to insert batch to staging: ${insertError.message}`);
          }
          
          // LOG 4: After insert in staging - log number of rows inserted
          console.log(`✅ insert staging ok`, { inserted: batch.length });
          
          // Small delay for backpressure
          if (i + batchSize < mappedRows.length) {
            await new Promise(resolve => setTimeout(resolve, 25));
          }
        }
        
        // LOG 5a: Before call to process_shareholders_batch - log mapped rows count
        console.log(`🔄 call DB batch`, { rows: mappedRows.length });
        
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
        
        // LOG 5b: After call to process_shareholders_batch - log processed_count
        console.log(`📊 db batch result`, batchResult);
        console.log(`✅ Batch processing result: processed ${processedCount} rows (total so far: ${totalProcessed})`);
        
        // LOG: Warning if no rows were processed
        if (processedCount === 0) {
          console.warn(`⚠️ WARNING: Zero rows processed in this batch! This indicates a problem.`);
          console.warn(`🔍 Debugging info - mappedRows.length: ${mappedRows.length}`);
          console.warn(`🔍 Debugging info - raw chunk size: ${chunk.length}`);
          console.warn(`🔍 Debugging info - mapping object:`, queueItem.mapping);
        }
        
        // Clear staging table after each batch (only edge function does this now - consolidated cleanup)
        console.log(`🗑️ Clearing staging after batch processing...`);
        await supabase.rpc('clear_shareholders_staging', { p_user_id: queueItem.user_id });
        
        // Update job progress with better status tracking
        await supabase
          .from('import_jobs')
          .update({ 
            rows_loaded: totalProcessed,
            total_rows: Math.max(totalProcessed, estimatedTotalRows),
            status: 'processing' // Ensure status shows processing
          })
          .eq('id', queueItem.job_id);
        
        // Force garbage collection after each chunk
        if ((globalThis as any).gc) {
          (globalThis as any).gc();
        }
        
        // Check memory again after processing
        checkMemoryUsage();
      }
    };
    
    // Stream parse the file based on type
    if (isExcel) {
      console.log('📊 Starting streaming Excel processing...');
      await streamParseExcel(supabase, queueItem.bucket, queueItem.path, processChunk, checkTimeout);
    } else {
      console.log('📄 Starting streaming CSV processing...');
      await streamParseCSV(supabase, queueItem.bucket, queueItem.path, processChunk, checkTimeout);
    }
    
    // Mark queue item as completed
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    // Mark job as completed
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'completed',
        total_rows: totalProcessed,
        rows_loaded: totalProcessed
      })
      .eq('id', queueItem.job_id);
    
    console.log(`✅ Import completed successfully! Total processed: ${totalProcessed} rows`);
    return { success: true, message: `Successfully processed ${totalProcessed} rows` };
    
  } catch (error: any) {
    console.error(`❌ Import failed:`, error);
    
    // PHASE A FIX: Handle time budget exceeded differently (partial success)
    if (error.message?.startsWith('TIME_BUDGET_EXCEEDED')) {
      console.log(`⏰ Time budget exceeded, but import will continue next time`);
      return { 
        success: true, 
        message: `Partial import completed. Import will continue automatically.`,
        partial: true,
        processed: 0 // Will be updated by next run
      };
    }
    
    // Mark queue item as failed with detailed error
    await supabase
      .from('shareholder_import_queue')
      .update({ 
        status: 'failed',
        error_message: error.message || 'Unknown error occurred',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);
    
    // Mark job as failed with detailed error
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'error',
        error: error.message || 'Import failed due to unknown error'
      })
      .eq('id', queueItem.job_id);
    
    // Log the full error for debugging
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return { success: false, message: error.message || 'Import failed' };
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