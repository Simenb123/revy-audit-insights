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

    // Handle process action - process a chunk of the CSV
    if (!jobId || !bucket || !path || !mapping) {
      throw new Error("Missing required parameters for process action");
    }

    // Signed URL for streaming
    const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signErr) throw signErr;

    const resp = await fetch(signed.signedUrl);
    if (!resp.ok || !resp.body) throw new Error(`Storage fetch failed: ${resp.status}`);

    console.log(`Fetched file from storage, processing chunk offset=${offset}, limit=${limit}...`);

    // Les headerlinje og skip til offset
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

    // Skip to offset position
    let lineNo = 0;
    while (lineNo < offset) {
      const { line, nextBuf } = readLine(buf);
      if (line === null) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        continue;
      }
      buf = nextBuf;
      lineNo++;
    }

    const pool = new Pool(dbUrl, 1, true);
    const conn = await pool.connect();
    let rowsProcessed = 0;
    let processedInChunk = 0;
    let isEOF = false;

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
      
      // Ensure antall_aksjer column is BIGINT 
      await conn.queryArray`
        ALTER TABLE shareholders_staging 
        ALTER COLUMN antall_aksjer TYPE BIGINT USING antall_aksjer::BIGINT
      `;
      
      await conn.queryArray`TRUNCATE shareholders_staging`;

      console.log('Processing rows with chunked batch insert...');

      // Process data in batches using UNNEST-optimized INSERT
      let batch: any[] = [];
      const batchSize = 500; // Increase batch size for chunked processing
      let batchCount = 0;

      // FORENKLET sanitizeRow for minimal CPU-bruk
      function sanitizeRow(row: Record<string, any>) {
        const result = { ...row };
        
        // antall_aksjer: fjern alle ikke-siffer, konverter til BigInt eller null
        if (result.antall_aksjer) {
          const digits = String(result.antall_aksjer).replace(/[^0-9]/g, '');
          result.antall_aksjer = digits ? digits : null;
        } else {
          result.antall_aksjer = null;
        }

        // year: fjern ikke-siffer, parse til heltall eller null
        if (result.year) {
          const yearDigits = String(result.year).replace(/[^0-9]/g, '');
          result.year = yearDigits ? parseInt(yearDigits, 10) : null;
        } else {
          result.year = new Date().getFullYear(); // Default til inneværende år
        }

        // Sett userId hvis vi har den
        if (userId) {
          result.user_id = userId;
        }

        return result;
      }

      const processBatch = async (rows: any[]) => {
        if (rows.length === 0) return;

        const safeRows = rows.map(sanitizeRow);

        // UNNEST-basert insert: samle kolonne-data i arrays
        const columnArrays: Record<string, any[]> = {};
        targetCols.forEach(col => columnArrays[col] = []);

        // Fyll kolonne-arrays fra sanitiserte rader
        for (const row of safeRows) {
          targetCols.forEach(col => {
            const value = row[col] ?? '';
            columnArrays[col].push(value === '' ? null : value);
          });
        }

        // Type-casting for hver kolonne
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

        // Bygg UNNEST-parametere med type-casting
        const unnestParams = targetCols.map((col, idx) => {
          const type = columnTypes[col] || 'text[]';
          return `$${idx + 1}::${type}`;
        }).join(', ');

        // SQL med UNNEST i stedet for VALUES
        const query = `
          INSERT INTO shareholders_staging (${targetCols.map(c => `"${c}"`).join(',')})
          SELECT * FROM unnest(${unnestParams})
        `;

        // Parametere er kolonne-arrays i riktig rekkefølge
        const params = targetCols.map(col => columnArrays[col]);

        await conn.queryArray(query, params);
        rowsProcessed += rows.length;
        processedInChunk += rows.length;

        // Progress logging hver 1000 rader
        if ((lineNo + processedInChunk) % 1000 === 0) {
          console.log(`Progress: ${lineNo + processedInChunk} rows processed`);
        }
      };

      // Process up to 'limit' rows in this chunk
      while (processedInChunk < limit) {
        const { line, nextBuf } = readLine(buf);
        if (line === null) {
          // Need more data
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
              batchCount++;
              
              // CPU yield every 2 batches
              if (batchCount % 2 === 0) {
                await new Promise(res => setTimeout(res, 0));
              }
            }
          }
        }
        processedInChunk++;
      }
      
      // Process remaining batch
      if (batch.length > 0) {
        await processBatch(batch);
      }

      console.log(`Processed ${rowsProcessed} rows in chunk`);

      // Update progress and determine if we're done
      const totalRowsProcessed = lineNo + processedInChunk;
      await supabase.from('import_jobs')
        .update({ rows_loaded: totalRowsProcessed })
        .eq('id', jobId);

      // Check if we've reached EOF
      const { value, done } = await reader.read();
      isEOF = done && (!value || value.length === 0) && buf.trim().length === 0;
      
      if (isEOF || processedInChunk === 0) {
        // This is the last chunk, process staging data into production tables
        console.log('Final chunk - processing staging data into production tables');
        
        // Start transaction for the three-step loading
        await conn.queryArray`BEGIN`;

        // 1) COMPANIES: upsert based on orgnr
        await conn.queryArray`
          INSERT INTO share_companies (orgnr, name, year, user_id)
          SELECT DISTINCT
            NULLIF(TRIM(orgnr), '') AS orgnr,
            NULLIF(TRIM(selskap), '') AS name,
            COALESCE(year, EXTRACT(YEAR FROM NOW())::INTEGER) AS year,
            user_id
          FROM shareholders_staging s
          WHERE NULLIF(TRIM(orgnr), '') IS NOT NULL
          ON CONFLICT (orgnr, year) DO UPDATE
            SET name = EXCLUDED.name,
                user_id = COALESCE(share_companies.user_id, EXCLUDED.user_id)
        `;

        // 2) ENTITIES: upsert on stable key (entity_key)
        await conn.queryArray`
          INSERT INTO share_entities (entity_key, name, orgnr, birth_year, country_code, entity_type, user_id)
          SELECT DISTINCT
            LOWER(TRIM(navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(fodselsaar_orgnr), ''), '?') AS entity_key,
            NULLIF(TRIM(navn_aksjonaer), '') AS name,
            CASE 
              WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 9 THEN NULLIF(TRIM(fodselsaar_orgnr), '')
              ELSE NULL
            END AS orgnr,
            CASE 
              WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 4 THEN NULLIF(TRIM(fodselsaar_orgnr), '')::INTEGER
              ELSE NULL
            END AS birth_year,
            COALESCE(NULLIF(TRIM(landkode), ''), 'NO') AS country_code,
            CASE 
              WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 9 THEN 'company'
              ELSE 'person'
            END AS entity_type,
            user_id
          FROM shareholders_staging s
          WHERE NULLIF(TRIM(navn_aksjonaer), '') IS NOT NULL
          ON CONFLICT (entity_key) DO UPDATE
            SET
              name = EXCLUDED.name,
              orgnr = COALESCE(share_entities.orgnr, EXCLUDED.orgnr),
              birth_year = COALESCE(share_entities.birth_year, EXCLUDED.birth_year),
              country_code = COALESCE(EXCLUDED.country_code, share_entities.country_code),
              entity_type = EXCLUDED.entity_type,
              user_id = COALESCE(share_entities.user_id, EXCLUDED.user_id)
        `;

        // 3) HOLDINGS: insert with correct holder_id (JOIN via entity_key)
        await conn.queryArray`
          INSERT INTO share_holdings (company_orgnr, holder_id, share_class, shares, year, user_id)
          SELECT
            NULLIF(TRIM(s.orgnr), ''),
            e.id,
            NULLIF(TRIM(s.aksjeklasse), ''),
            COALESCE(s.antall_aksjer, 0),
            COALESCE(s.year, EXTRACT(YEAR FROM NOW())::INTEGER),
            s.user_id
          FROM shareholders_staging s
          JOIN share_entities e
            ON e.entity_key = LOWER(TRIM(s.navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(s.fodselsaar_orgnr), ''), '?')
          WHERE NULLIF(TRIM(s.orgnr), '') IS NOT NULL
            AND NULLIF(TRIM(s.navn_aksjonaer), '') IS NOT NULL
          ON CONFLICT (company_orgnr, holder_id, share_class, year) DO UPDATE
            SET shares = EXCLUDED.shares,
                user_id = COALESCE(share_holdings.user_id, EXCLUDED.user_id)
        `;

        await conn.queryArray`COMMIT`;
        
        // Mark job as completed
        await supabase.from('import_jobs').update({ 
          status: 'done',
          total_rows: totalRowsProcessed,
          rows_loaded: totalRowsProcessed 
        }).eq('id', jobId);
        
        console.log(`Import completed. Total rows processed: ${totalRowsProcessed}`);
      }

    } finally {
      await conn.release();
      await pool.end();
    }

    const nextOffset = lineNo + processedInChunk;
    const isDone = isEOF || processedInChunk === 0;

    return new Response(JSON.stringify({ 
      done: isDone,
      nextOffset,
      processedInChunk,
      totalProcessed: nextOffset,
      jobId 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('Import error:', e);
    
    // Update job status on error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!, 
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from('import_jobs')
        .update({ status: 'error', error: String(e?.message ?? e) })
        .eq('status', 'running');
    } catch {}

    return new Response(String(e?.message ?? e), { 
      status: 500,
      headers: corsHeaders 
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