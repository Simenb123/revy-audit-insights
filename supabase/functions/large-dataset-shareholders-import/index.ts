// Deno Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
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
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Finn bruker fra Authorization-header
    const authHeader = req.headers.get('Authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let userId: string | null = null;
    try {
      if (bearer) {
        const { data: { user } } = await supabase.auth.getUser(bearer);
        userId = user?.id ?? null;
      }
    } catch (_) {
      // stilletiende fall-back; userId = null
    }

    // Handle init action - create job and return immediately
    if (action === "init") {
      console.log(`Starting import from ${bucket}/${path}`);
      
      const jobRes = await supabase.from('import_jobs')
        .insert({
          job_type: 'shareholders',
          status: 'running',
          total_rows: 0,
          rows_loaded: 0,
          source_path: `${bucket}/${path}`,
          user_id: userId,
        })
        .select('id').single();
      
      console.log(`Created job ${jobRes.data?.id}`);
      
      return new Response(JSON.stringify({ jobId: jobRes.data?.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action !== "process") {
      throw new Error("Unsupported action. Use 'init' or 'process'.");
    }

    // Handle process action using PostgreSQL stored procedure
    if (!jobId || !bucket || !path || !mapping) {
      throw new Error("Missing required parameters for process action");
    }

    console.log(`Processing chunk via PostgreSQL function: jobId=${jobId}, offset=${offset}, limit=${limit}`);

    // If this is the first call (offset = 0), populate staging table from CSV
    if (offset === 0) {
      // Fix path to avoid bucket duplication
      let cleanPath = path;
      if (path.startsWith(`${bucket}/`)) {
        cleanPath = path.substring(bucket.length + 1);
        console.log(`🔧 Cleaned path from "${path}" to "${cleanPath}"`);
      }

      console.log(`📁 Populating staging table from: ${bucket}/${cleanPath}`);

      // Check if object exists
      let objectExists = false;
      let existsRetryCount = 0;
      const maxExistsRetries = 5;

      while (existsRetryCount < maxExistsRetries && !objectExists) {
        try {
          console.log(`🔍 Checking if object exists: ${bucket}/${cleanPath} (attempt ${existsRetryCount + 1})`);
          
          const listResult = await supabase.storage.from(bucket).list(
            cleanPath.substring(0, cleanPath.lastIndexOf('/')),
            { search: cleanPath.substring(cleanPath.lastIndexOf('/') + 1) }
          );
          
          if (listResult.error) {
            throw listResult.error;
          }
          
          objectExists = listResult.data && listResult.data.length > 0;
          
          if (objectExists) {
            console.log(`✅ Object confirmed to exist in storage`);
            break;
          } else if (existsRetryCount < maxExistsRetries - 1) {
            const waitTime = Math.min((existsRetryCount + 1) * 2000, 10000);
            console.log(`⏳ Object not found, waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } catch (checkError) {
          console.log(`❌ Error checking object existence: ${checkError.message}`);
          if (existsRetryCount < maxExistsRetries - 1) {
            const waitTime = Math.min((existsRetryCount + 1) * 2000, 10000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
        existsRetryCount++;
      }

      if (!objectExists) {
        throw new Error(`Object not found in storage after ${maxExistsRetries} attempts: ${bucket}/${cleanPath}`);
      }

      // Get signed URL for file access
      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(cleanPath, 60 * 60);

      if (signErr || !signed?.signedUrl) {
        throw new Error(`Failed to get signed URL: ${signErr?.message || 'Unknown error'}`);
      }

      console.log(`🌐 Fetching file content from signed URL...`);
      const resp = await fetch(signed.signedUrl);
      if (!resp.ok) {
        throw new Error(`Storage fetch failed: ${resp.status} ${resp.statusText}`);
      }
      if (!resp.body) {
        throw new Error('No response body from storage fetch');
      }

      console.log(`✅ Successfully fetched file, parsing CSV and populating staging...`);

      // Parse CSV and populate staging table
      const decoder = new TextDecoder();
      const reader = resp.body.getReader();
      let headerLine = "", buf = "";
      
      // Read header line
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const nl = chunk.indexOf("\n");
        if (nl !== -1) { 
          headerLine = (buf + chunk.slice(0, nl)).trimEnd(); 
          buf = chunk.slice(nl + 1); 
          break; 
        }
        buf += chunk;
      }

      const srcHeaders = headerLine.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ""));
      console.log(`Found headers: ${srcHeaders.join(', ')}`);

      const targetCols: string[] = [];
      const srcByTarget: Record<string,string> = {};
      for (const [src, tgt] of Object.entries(mapping)) {
        if (srcHeaders.includes(src) && tgt && tgt.trim() !== '') { 
          targetCols.push(tgt); 
          srcByTarget[tgt] = src; 
        }
      }
      if (!targetCols.length) throw new Error("No mapped columns match CSV header");

      console.log(`Mapped columns: ${targetCols.join(', ')}`);

      // Connect to database and create staging table
      const pool = new Pool(dbUrl, 1, true);
      const conn = await pool.connect();

      try {
        // Create staging table if it doesn't exist
        await conn.queryArray`DROP TABLE IF EXISTS shareholders_staging`;
        await conn.queryArray`
          CREATE UNLOGGED TABLE shareholders_staging (
            id SERIAL PRIMARY KEY,
            orgnr TEXT,
            selskap TEXT,
            aksjeklasse TEXT,
            navn_aksjonaer TEXT,
            fodselsaar_orgnr TEXT,
            landkode TEXT DEFAULT 'NO',
            antall_aksjer BIGINT DEFAULT 0,
            year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
            user_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;
        
        await conn.queryArray`TRUNCATE shareholders_staging`;

        console.log('Processing CSV data in batches...');

        // Process data in batches
        let batch: any[] = [];
        const batchSize = 1000;
        let totalRowsProcessed = 0;

        // Simplified sanitizeRow function
        function sanitizeRow(row: Record<string, any>) {
          const result = { ...row };
          
          // Clean antall_aksjer: remove non-digits
          if (result.antall_aksjer) {
            const digits = String(result.antall_aksjer).replace(/[^0-9]/g, '');
            result.antall_aksjer = digits ? digits : null;
          } else {
            result.antall_aksjer = null;
          }

          // Clean year: remove non-digits, parse to integer
          if (result.year) {
            const yearDigits = String(result.year).replace(/[^0-9]/g, '');
            result.year = yearDigits ? parseInt(yearDigits, 10) : null;
          } else {
            result.year = new Date().getFullYear();
          }

          // Set user_id
          if (userId) {
            result.user_id = userId;
          }

          return result;
        }

        const processBatch = async (rows: any[]) => {
          if (rows.length === 0) return;

          const safeRows = rows.map(sanitizeRow);

          // Prepare column arrays for UNNEST
          const columnArrays: Record<string, any[]> = {};
          targetCols.forEach(col => columnArrays[col] = []);

          // Fill column arrays
          for (const row of safeRows) {
            targetCols.forEach(col => {
              const value = row[col] ?? '';
              columnArrays[col].push(value === '' ? null : value);
            });
          }

          // Type casting for columns
          const columnTypes: Record<string, string> = {
            'orgnr': 'text[]',
            'selskap': 'text[]', 
            'aksjeklasse': 'text[]',
            'navn_aksjonaer': 'text[]',
            'fodselsaar_orgnr': 'text[]',
            'landkode': 'text[]',
            'antall_aksjer': 'bigint[]',
            'year': 'integer[]',
            'user_id': 'uuid[]'
          };

          // Build UNNEST parameters with type casting
          const unnestParams = targetCols.map((col, idx) => {
            const type = columnTypes[col] || 'text[]';
            return `$${idx + 1}::${type}`;
          }).join(', ');

          // SQL with UNNEST instead of VALUES
          const query = `
            INSERT INTO shareholders_staging (${targetCols.map(c => `"${c}"`).join(',')})
            SELECT * FROM unnest(${unnestParams})
          `;

          // Parameters are column arrays in correct order
          const params = targetCols.map(col => columnArrays[col]);

          await conn.queryArray(query, params);
          totalRowsProcessed += rows.length;

          if (totalRowsProcessed % 5000 === 0) {
            console.log(`Staging progress: ${totalRowsProcessed} rows processed`);
          }
        };

        // Process all CSV data into staging
        while (true) {
          const { line, nextBuf } = readLine(buf);
          if (line === null) {
            const { value, done } = await reader.read();
            if (done) break; // EOF
            buf += decoder.decode(value, { stream: true });
            continue;
          }
          buf = nextBuf;
          
          if (line.trim()) {
            const row = parseRow(line, srcHeaders, srcByTarget, targetCols);
            if (row) {
              batch.push(row);
              
              if (batch.length >= batchSize) {
                await processBatch(batch);
                batch = [];
              }
            }
          }
        }
        
        // Process remaining batch
        if (batch.length > 0) {
          await processBatch(batch);
        }

        console.log(`✅ Successfully populated staging table with ${totalRowsProcessed} rows`);

      } finally {
        await conn.release();
        await pool.end();
      }
    }

    // Call PostgreSQL stored procedure to process batch
    console.log(`🔄 Calling PostgreSQL function to process batch: offset=${offset}, limit=${limit}`);
    
    const { data: processResult, error: processError } = await supabase.rpc('process_shareholders_batch', {
      p_job_id: jobId,
      p_user_id: userId,
      p_offset: offset,
      p_limit: limit
    });

    if (processError) {
      throw new Error(`PostgreSQL batch processing failed: ${processError.message}`);
    }

    if (!processResult) {
      throw new Error('No result returned from PostgreSQL batch processing');
    }

    console.log(`✅ Batch processed: ${JSON.stringify(processResult)}`);

    const {
      next_offset: nextOffset,
      done: isDone,
      processed_count: processedCount,
      total_staging_rows: totalStagingRows
    } = processResult;

    return new Response(JSON.stringify({ 
      done: isDone,
      nextOffset,
      processedInChunk: processedCount,
      totalProcessed: nextOffset,
      jobId 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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

// Helper function to read a line from buffer
function readLine(buffer: string): { line: string | null; nextBuf: string } {
  const idx = buffer.indexOf('\n');
  if (idx === -1) return { line: null, nextBuf: buffer };
  const line = buffer.slice(0, idx).trim();
  return { line, nextBuf: buffer.slice(idx + 1) };
}

// Helper function to parse CSV row
function parseRow(
  csvLine: string,
  srcHeaders: string[],
  srcByTarget: Record<string, string>,
  targetCols: string[]
): Record<string, string> | null {
  if (!csvLine.trim()) return null;
  
  const cells = csvLine.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/);
  const obj: Record<string, string> = {};
  
  for (let i = 0; i < srcHeaders.length && i < cells.length; i++) {
    obj[srcHeaders[i]] = (cells[i] ?? "").trim().replace(/^"|"$/g, '');
  }

  const result: Record<string, string> = {};
  for (const tgt of targetCols) {
    const src = srcByTarget[tgt];
    result[tgt] = obj[src] ?? "";
  }

  return result;
}