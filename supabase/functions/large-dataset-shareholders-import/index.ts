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
    const { bucket, path, mapping } = await req.json() as { bucket: string; path: string; mapping: Mapping; };

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

  console.log(`Starting import from ${bucket}/${path}`);

  // Opprett jobbrad med user_id
  const jobRes = await supabase.from('import_jobs')
    .insert({
      job_type: 'shareholders',
      status: 'running',
      total_rows: 0,
      rows_loaded: 0,
      source_path: `${bucket}/${path}`,
      user_id: userId, // <- viktig for RLS
    })
    .select('id').single();
  const jobId = jobRes.data?.id;

    console.log(`Created job ${jobId}`);

    // Signed URL for streaming
    const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
    if (signErr) throw signErr;

    const resp = await fetch(signed.signedUrl);
    if (!resp.ok || !resp.body) throw new Error(`Storage fetch failed: ${resp.status}`);

    console.log(`Fetched file from storage, processing...`);

    // Les headerlinje
    const decoder = new TextDecoder();
    const reader = resp.body.getReader();
    let headerLine = "", buf = "";
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

    const pool = new Pool(dbUrl, 1, true);
    const conn = await pool.connect();
    let rowsProcessed = 0;

    try {
      // Create staging table if it doesn't exist
      await conn.queryArray`
        CREATE UNLOGGED TABLE IF NOT EXISTS shareholders_staging (
          id SERIAL PRIMARY KEY,
          orgnr TEXT,
          selskap TEXT,
          aksjeklasse TEXT,
          navn_aksjonaer TEXT,
          fodselsaar_orgnr TEXT,
          landkode TEXT DEFAULT 'NO',
          antall_aksjer INTEGER DEFAULT 0,
          year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
          user_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await conn.queryArray`TRUNCATE shareholders_staging`;

      console.log('Processing rows with simple batch insert...');

      // Process data in batches using simple INSERT
      let remainder = buf;
      let batch: any[] = [];
      const batchSize = 1000;

      const processBatch = async (rows: any[]) => {
        if (rows.length === 0) return;

        const values = rows.map((row, idx) => {
          const params = targetCols.map(col => row[col] || '');
          const placeholders = params.map((_, i) => `$${idx * targetCols.length + i + 1}`).join(',');
          return `(${placeholders})`;
        }).join(',');

        const allParams = rows.flatMap(row => targetCols.map(col => row[col] || ''));
        const query = `INSERT INTO shareholders_staging (${targetCols.map(c => `"${c}"`).join(',')}) VALUES ${values}`;

        await conn.queryArray(query, allParams);
        rowsProcessed += rows.length;

        // Update job progress
        if (jobId && rowsProcessed % 5000 === 0) {
          await supabase.from('import_jobs')
            .update({ rows_loaded: rowsProcessed })
            .eq('id', jobId);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (remainder.length) {
            const row = parseRow(remainder, srcHeaders, srcByTarget, targetCols);
            if (row) batch.push(row);
          }
          if (batch.length > 0) {
            await processBatch(batch);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        remainder += chunk;
        let idx;

        while ((idx = remainder.indexOf("\n")) !== -1) {
          const line = remainder.slice(0, idx).trim();
          remainder = remainder.slice(idx + 1);
          
          if (line) {
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
      }

      console.log(`Processed ${rowsProcessed} rows`);

      // --- Etter vellykket COPY til shareholders_staging ---
      // Oppdater import_jobs (valgfritt hvis du sporer rader)
      await supabase.from('import_jobs')
        .update({ status: 'running' })
        .eq('id', jobId ?? 0);

      // Start en transaksjon for den tre-stegs innlastingen
      await conn.queryArray`BEGIN`;

      // 1) COMPANIES: upsert basert på orgnr
      await conn.queryArray`
        INSERT INTO share_companies (orgnr, name)
        SELECT DISTINCT
          NULLIF(TRIM(orgnr), '')               AS orgnr,
          NULLIF(TRIM(selskap), '')             AS name
        FROM shareholders_staging s
        WHERE NULLIF(TRIM(orgnr), '') IS NOT NULL
        ON CONFLICT (orgnr) DO UPDATE
          SET name = EXCLUDED.name
      `;

      // 2) ENTITIES: upsert på en stabil nøkkel (entity_key)
      // Bygg nøkkelen som: lower(trim(navn)) || '|' || coalesce(trim(fodselsaar_orgnr),'?')
      await conn.queryArray`
        INSERT INTO share_entities (entity_key, name, orgnr, birth_year, country_code, entity_type)
        SELECT DISTINCT
          LOWER(TRIM(navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(fodselsaar_orgnr), ''), '?') AS entity_key,
          NULLIF(TRIM(navn_aksjonaer), '')                                                       AS name,
          CASE 
            WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 9 THEN NULLIF(TRIM(fodselsaar_orgnr), '')
            ELSE NULL
          END AS orgnr,
          CASE 
            WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 4 THEN NULLIF(TRIM(fodselsaar_orgnr), '')::INTEGER
            ELSE NULL
          END AS birth_year,
          COALESCE(NULLIF(TRIM(landkode), ''), 'NO')                                            AS country_code,
          CASE 
            WHEN LENGTH(NULLIF(TRIM(fodselsaar_orgnr), '')) = 9 THEN 'company'
            ELSE 'person'
          END AS entity_type
        FROM shareholders_staging s
        WHERE NULLIF(TRIM(navn_aksjonaer), '') IS NOT NULL
        ON CONFLICT (entity_key) DO UPDATE
          SET
            name         = EXCLUDED.name,
            orgnr        = COALESCE(share_entities.orgnr, EXCLUDED.orgnr),
            birth_year   = COALESCE(share_entities.birth_year, EXCLUDED.birth_year),
            country_code = COALESCE(EXCLUDED.country_code, share_entities.country_code),
            entity_type  = EXCLUDED.entity_type
      `;

      // 3) HOLDINGS: sett inn med korrekt holder_id (JOIN via entity_key) + valgfri UPSERT
      // Anta at share_holdings har (company_orgnr, holder_id, share_class) som unik kombo – justér ved behov
      await conn.queryArray`
        INSERT INTO share_holdings (company_orgnr, holder_id, share_class, shares, year, user_id)
        SELECT
          NULLIF(TRIM(s.orgnr), ''),
          e.id,
          NULLIF(TRIM(s.aksjeklasse), ''),
          CASE 
            WHEN NULLIF(TRIM(s.antall_aksjer), '') ~ '^[0-9]+$' 
            THEN NULLIF(TRIM(s.antall_aksjer), '')::BIGINT
            ELSE 0
          END,
          EXTRACT(YEAR FROM NOW())::INTEGER,
          s.user_id
        FROM shareholders_staging s
        JOIN share_entities e
          ON e.entity_key = LOWER(TRIM(s.navn_aksjonaer)) || '|' || COALESCE(NULLIF(TRIM(s.fodselsaar_orgnr), ''), '?')
        WHERE NULLIF(TRIM(s.orgnr), '') IS NOT NULL
          AND NULLIF(TRIM(s.navn_aksjonaer), '') IS NOT NULL
        ON CONFLICT (company_orgnr, holder_id, share_class, year) DO UPDATE
          SET shares   = EXCLUDED.shares,
              user_id  = COALESCE(share_holdings.user_id, EXCLUDED.user_id)
      `;

      await conn.queryArray`COMMIT`;

      console.log(`Inserted ${rowsProcessed} rows into production table`);

      await supabase.from('import_jobs').update({ 
        status: 'done',
        total_rows: rowsProcessed,
        rows_loaded: rowsProcessed 
      }).eq('id', jobId ?? 0);

    } finally {
      await conn.release();
      await pool.end();
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      rowsProcessed,
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