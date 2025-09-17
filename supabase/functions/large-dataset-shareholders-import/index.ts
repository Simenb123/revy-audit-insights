import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Mapping = Record<string, string>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const { action, bucket, path, mapping, jobId, offset = 0, limit = 1000 } = await req.json() as {
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
        // Silent fallback
      }
    }

    // Handle init action
    if (action === "init") {
      console.log(`Starting import from ${bucket}/${path}`);
      
      const { data: job, error } = await supabase.from('import_jobs')
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
      
      if (error) throw error;
      console.log(`Created job ${job.id}`);
      
      return new Response(JSON.stringify({ jobId: job.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle process action
    if (action !== "process" || !jobId || !bucket || !path || !mapping) {
      throw new Error("Invalid parameters for process action");
    }

    console.log(`Processing chunk: jobId=${jobId}, offset=${offset}, limit=${limit}`);

    // Clean path
    let cleanPath = path;
    if (path.startsWith(`${bucket}/`)) {
      cleanPath = path.substring(bucket.length + 1);
    }

    // Get signed URL with retry
    let signedUrl: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleanPath, 3600);
      if (!error && data?.signedUrl) {
        signedUrl = data.signedUrl;
        break;
      }
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!signedUrl) {
      throw new Error('Failed to get signed URL');
    }

    // Fetch and process CSV
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Empty file');
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(h => h.trim().replace(/^"|"$/g, ''));

    console.log(`Found headers: ${headers.join(', ')}`);

    // Map columns
    const mappedCols: Array<{src: string, target: string}> = [];
    for (const [src, target] of Object.entries(mapping)) {
      if (headers.includes(src) && target?.trim()) {
        mappedCols.push({ src, target });
      }
    }

    if (mappedCols.length === 0) {
      throw new Error('No mapped columns found');
    }

    console.log(`Mapped columns: ${mappedCols.map(c => c.target).join(', ')}`);

    // Process data rows in chunk
    const dataLines = lines.slice(1); // Skip header
    const chunkLines = dataLines.slice(offset, offset + limit);
    const rows: any[] = [];

    for (const line of chunkLines) {
      if (!line.trim()) continue;
      
      const values = line.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map(v => v.trim().replace(/^"|"$/g, ''));
      
      const row: any = { user_id: userId };
      
      for (const { src, target } of mappedCols) {
        const srcIndex = headers.indexOf(src);
        if (srcIndex >= 0 && srcIndex < values.length) {
          let value = values[srcIndex]?.trim() || null;
          
          // Clean up specific fields
          if (target === 'antall_aksjer' && value) {
            value = value.replace(/[^0-9]/g, '') || null;
          }
          
          row[target] = value;
        }
      }
      
      rows.push(row);
    }

    console.log(`Processing ${rows.length} rows`);

    // Insert using Supabase client in smaller batches
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      // Insert companies first
      const companies = batch
        .filter(row => row.orgnr && row.selskap)
        .map(row => ({
          orgnr: row.orgnr,
          name: row.selskap,
          year: new Date().getFullYear(),
          user_id: userId
        }));

      if (companies.length > 0) {
        await supabase.from('share_companies').upsert(companies, {
          onConflict: 'orgnr,year,user_id'
        });
      }

      // Insert entities
      const entities = batch
        .filter(row => row.navn_aksjonaer)
        .map(row => {
          const isCompany = row.fodselsaar_orgnr?.length === 9;
          return {
            entity_key: `${row.navn_aksjonaer?.toLowerCase() || ''}|${row.fodselsaar_orgnr || '?'}`,
            name: row.navn_aksjonaer,
            orgnr: isCompany ? row.fodselsaar_orgnr : null,
            birth_year: !isCompany && row.fodselsaar_orgnr?.length === 4 ? 
              parseInt(row.fodselsaar_orgnr) : null,
            country_code: row.landkode || 'NO',
            entity_type: isCompany ? 'company' : 'person',
            user_id: userId
          };
        });

      if (entities.length > 0) {
        await supabase.from('share_entities').upsert(entities, {
          onConflict: 'entity_key,user_id'
        });
      }

      totalInserted += batch.length;
    }

    // Update job progress
    const totalProcessed = offset + totalInserted;
    const isComplete = offset + limit >= dataLines.length;
    
    await supabase.from('import_jobs').update({
      rows_loaded: totalProcessed,
      total_rows: dataLines.length,
      status: isComplete ? 'completed' : 'running'
    }).eq('id', jobId);

    console.log(`Chunk complete: ${totalInserted} rows inserted, total: ${totalProcessed}`);

    return new Response(JSON.stringify({
      processed: totalInserted,
      total: totalProcessed,
      done: isComplete
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});