import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { log, error as logError } from '../_shared/log.ts';
import { getRateLimitId, enforceRateLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareholderRow {
  orgnr?: string;
  selskap?: string;
  aksjeklasse?: string;
  navn_aksjonaer?: string;
  fodselsaar_orgnr?: string;
  landkode?: string;
  antall_aksjer?: string;
  A?: string; // Alternative column mapping
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  F?: string;
  G?: string;
  H?: string;
  I?: string;
}

interface ProcessingSession {
  sessionId: string;
  year: number;
  totalChunks: number;
  processedChunks: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  startTime: number;
  status: 'initializing' | 'processing' | 'completed' | 'error';
}

const sessions = new Map<string, ProcessingSession>();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Rate limiting
    const rateLimitId = getRateLimitId(req);
    const rateLimitResponse = await enforceRateLimit(rateLimitId, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const { action, sessionId, year, totalChunks, chunkData, chunkIndex } = await req.json();
    
    log(`📊 Large dataset import action: ${action}, session: ${sessionId}`);

    switch (action) {
      case 'initSession':
        return await initializeSession(sessionId, year, totalChunks);
      
      case 'processChunk':
        return await processChunk(supabase, sessionId, chunkData, chunkIndex, year);
      
      case 'finalizeSession':
        return await finalizeSession(supabase, sessionId, year);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (err) {
    logError('Large dataset import error:', err);
    return new Response(
      JSON.stringify({ 
        error: err.message || 'Internal server error',
        details: err.stack 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function initializeSession(sessionId: string, year: number, totalChunks: number) {
  const session: ProcessingSession = {
    sessionId,
    year,
    totalChunks,
    processedChunks: 0,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    startTime: Date.now(),
    status: 'initializing'
  };
  
  sessions.set(sessionId, session);
  
  log(`🚀 Initialized session ${sessionId} for year ${year} with ${totalChunks} chunks`);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      sessionId,
      message: `Session initialized for ${totalChunks} chunks`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function processChunk(
  supabase: any, 
  sessionId: string, 
  chunkData: ShareholderRow[], 
  chunkIndex: number, 
  year: number
) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  session.status = 'processing';
  
  log(`📦 Processing chunk ${chunkIndex + 1}/${session.totalChunks} with ${chunkData.length} rows`);
  
  let validRows = 0;
  let invalidRows = 0;
  const errors: string[] = [];
  
  try {
    // Process companies, entities, and holdings in separate arrays for bulk operations
    const companies: any[] = [];
    const entities: any[] = [];
    const holdings: any[] = [];
    
    const processedCompanies = new Set<string>();
    const processedEntities = new Set<string>();
    
    for (let i = 0; i < chunkData.length; i++) {
      const row = chunkData[i];
      
      try {
        // Extract and normalize data - support both Norwegian headers and column letters
        const companyOrgnr = row.orgnr || row.A || '';
        const companyName = row.selskap || row.B || '';
        const shareClass = row.aksjeklasse || row.C || '';
        const holderName = row.navn_aksjonaer || row.D || '';
        const holderIdOrBirthYear = row.fodselsaar_orgnr || row.E || '';
        const countryCode = row.landkode || row.G || 'NO';
        const sharesStr = row.antall_aksjer || row.H || '0';
        
        if (!companyOrgnr || !holderName) {
          invalidRows++;
          errors.push(`Row ${i + 1}: Missing required fields (orgnr or holder name)`);
          continue;
        }
        
        // Parse shares
        const shares = parseInt(sharesStr.replace(/[^\d]/g, '')) || 0;
        if (shares <= 0) {
          invalidRows++;
          errors.push(`Row ${i + 1}: Invalid share count: ${sharesStr}`);
          continue;
        }
        
        // Determine if holder is a person or organization
        const isOrganization = holderIdOrBirthYear.length >= 9;
        const holderType = isOrganization ? 'organization' : 'person';
        
        // Generate entity key
        const entityKey = isOrganization 
          ? holderIdOrBirthYear 
          : `${holderName.replace(/\s+/g, '_').toLowerCase()}_${holderIdOrBirthYear}`;
        
        // Add company (avoid duplicates in this chunk)
        if (!processedCompanies.has(companyOrgnr)) {
          companies.push({
            orgnr: companyOrgnr,
            name: companyName || companyOrgnr,
            year: year,
            total_shares: 0, // Will be updated later via aggregation
            user_id: null
          });
          processedCompanies.add(companyOrgnr);
        }
        
        // Add entity (avoid duplicates in this chunk)  
        if (!processedEntities.has(entityKey)) {
          entities.push({
            entity_key: entityKey,
            name: holderName,
            entity_type: holderType,
            org_number: isOrganization ? holderIdOrBirthYear : null,
            birth_year: !isOrganization ? parseInt(holderIdOrBirthYear) || null : null,
            country_code: countryCode,
            user_id: null
          });
          processedEntities.add(entityKey);
        }
        
        // Add holding
        holdings.push({
          company_orgnr: companyOrgnr,
          entity_key: entityKey,
          share_class: shareClass || 'ordinære',
          shares: shares,
          year: year,
          user_id: null
        });
        
        validRows++;
        
      } catch (rowError) {
        invalidRows++;
        errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }
    
    // Bulk insert companies (with conflict resolution)
    if (companies.length > 0) {
      const { error: companiesError } = await supabase
        .from('share_companies')
        .upsert(companies, {
          onConflict: 'orgnr,year',
          ignoreDuplicates: false
        });
      
      if (companiesError) {
        logError('Companies insert error:', companiesError);
        errors.push(`Companies insert error: ${companiesError.message}`);
      }
    }
    
    // Bulk insert entities (with conflict resolution)
    if (entities.length > 0) {
      const { error: entitiesError } = await supabase
        .from('share_entities')
        .upsert(entities, {
          onConflict: 'entity_key',
          ignoreDuplicates: false
        });
      
      if (entitiesError) {
        logError('Entities insert error:', entitiesError);
        errors.push(`Entities insert error: ${entitiesError.message}`);
      }
    }
    
    // Bulk insert holdings (with conflict resolution)
    if (holdings.length > 0) {
      const { error: holdingsError } = await supabase
        .from('share_holdings')
        .upsert(holdings, {
          onConflict: 'company_orgnr,entity_key,year',
          ignoreDuplicates: false
        });
      
      if (holdingsError) {
        logError('Holdings insert error:', holdingsError);
        errors.push(`Holdings insert error: ${holdingsError.message}`);
      }
    }
    
    // Update session progress
    session.processedChunks++;
    session.totalRows += chunkData.length;
    session.validRows += validRows;
    session.invalidRows += invalidRows;
    session.errors.push(...errors);
    
    const progress = (session.processedChunks / session.totalChunks) * 100;
    
    log(`✅ Chunk ${chunkIndex + 1} completed: ${validRows} valid, ${invalidRows} invalid rows (${progress.toFixed(1)}% total progress)`);
    
    return new Response(
      JSON.stringify({
        success: true,
        chunkIndex,
        processedRows: validRows,
        totalRows: chunkData.length,
        errors: errors.slice(0, 10), // Limit error details to prevent large responses
        progress,
        sessionStatus: {
          processedChunks: session.processedChunks,
          totalChunks: session.totalChunks,
          totalValidRows: session.validRows,
          totalInvalidRows: session.invalidRows
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    logError(`Chunk ${chunkIndex} processing error:`, error);
    session.errors.push(`Chunk ${chunkIndex}: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        chunkIndex
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function finalizeSession(supabase: any, sessionId: string, year: number) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  try {
    session.status = 'completed';
    const processingTime = Date.now() - session.startTime;
    
    log(`🎉 Session ${sessionId} completed: ${session.validRows} valid rows, ${session.invalidRows} invalid rows in ${processingTime}ms`);
    
    // Update total_shares for all companies in this year via stored procedure
    const { error: aggregationError } = await supabase.rpc('update_total_shares_for_year', {
      p_year: year,
      p_orgnr: null, // Update all companies
      p_user_id: null
    });
    
    if (aggregationError) {
      logError('Aggregation error:', aggregationError);
      session.errors.push(`Share aggregation error: ${aggregationError.message}`);
    }
    
    const response = {
      success: true,
      sessionId,
      summary: {
        totalChunks: session.totalChunks,
        processedChunks: session.processedChunks,
        totalRows: session.totalRows,
        validRows: session.validRows,
        invalidRows: session.invalidRows,
        processingTimeMs: processingTime,
        errorCount: session.errors.length,
        year
      },
      errors: session.errors.slice(0, 50) // Limit to 50 most recent errors
    };
    
    // Clean up session
    sessions.delete(sessionId);
    
    return new Response(
      JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    logError('Session finalization error:', error);
    session.status = 'error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sessionId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}