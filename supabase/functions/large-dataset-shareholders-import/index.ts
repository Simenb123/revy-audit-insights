import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessedRow {
  orgnr: string
  company_name: string
  holder_name: string
  holder_orgnr?: string
  holder_birth_year?: number
  holder_country?: string
  share_class: string
  shares: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, sessionId, chunkData, year, totalChunks, chunkIndex } = await req.json()

    switch (action) {
      case 'initSession':
        return await initializeSession(supabaseClient, user.id, sessionId, year, totalChunks)
      
      case 'processChunk':
        return await processChunk(supabaseClient, user.id, sessionId, chunkData, chunkIndex, year)
      
      case 'finalizeSession':
        return await finalizeSession(supabaseClient, user.id, sessionId, year)
      
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('💥 Large dataset import error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Import feilet'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function initializeSession(
  supabaseClient: any,
  userId: string,
  sessionId: string,
  year: number,
  totalChunks: number
) {
  console.log(`🚀 Initializing session: ${sessionId} with ${totalChunks} chunks`)

  const { error } = await supabaseClient
    .from('import_sessions')
    .upsert({
      id: sessionId,
      user_id: userId,
      year,
      total_rows: 0,
      processed_rows: 0,
      status: 'processing',
      file_name: 'Large dataset upload',
      metadata: { totalChunks, processedChunks: 0 }
    })

  if (error) {
    console.error('Session init error:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ success: true, sessionId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processChunk(
  supabaseClient: any,
  userId: string,
  sessionId: string,
  chunkData: any[],
  chunkIndex: number,
  year: number
) {
  console.log(`📦 Processing chunk ${chunkIndex} with ${chunkData.length} rows`)

  const processedRows: ProcessedRow[] = []
  const companies = new Map<string, string>()
  const entities = new Map<string, any>()
  const errors: string[] = []

  // Process each row in the chunk
  for (const row of chunkData) {
    try {
      const processed = processRow(row, year)
      if (processed) {
        processedRows.push(processed)
        companies.set(processed.orgnr, processed.company_name)
        
        // Add entity for holder
        const entityKey = processed.holder_orgnr || `person_${processed.holder_name}_${processed.holder_birth_year || 'unknown'}`
        entities.set(entityKey, {
          entity_type: processed.holder_orgnr ? 'company' : 'person',
          name: processed.holder_name,
          orgnr: processed.holder_orgnr,
          birth_year: processed.holder_birth_year,
          country_code: processed.holder_country || 'NO',
          user_id: userId
        })
      }
    } catch (rowError) {
      errors.push(`Row error: ${rowError.message}`)
    }
  }

  if (processedRows.length > 0) {
    try {
      // Insert data
      await insertCompanies(supabaseClient, Array.from(companies.entries()), year, userId)
      await insertEntities(supabaseClient, Array.from(entities.values()))
      await insertHoldings(supabaseClient, processedRows, userId)
    } catch (insertError) {
      console.error('Insert error in chunk:', insertError)
      errors.push(`Insert error: ${insertError.message}`)
    }
  }

  // Update session progress
  await supabaseClient
    .from('import_sessions')
    .update({
      processed_rows: processedRows.length,
      metadata: { processedChunks: chunkIndex + 1 },
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  return new Response(
    JSON.stringify({
      success: true,
      processedRows: processedRows.length,
      totalRows: chunkData.length,
      errors: errors.slice(0, 5) // Limit errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function finalizeSession(
  supabaseClient: any,
  userId: string,
  sessionId: string,
  year: number
) {
  console.log(`🏁 Finalizing session: ${sessionId}`)

  // Aggregate total shares
  await supabaseClient.rpc('update_total_shares_for_year', {
    p_year: year,
    p_user_id: userId
  })

  // Mark session as completed
  await supabaseClient
    .from('import_sessions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  // Get final counts
  const { data: companies } = await supabaseClient
    .from('share_companies')
    .select('id')
    .eq('year', year)
    .eq('user_id', userId)

  const { data: holdings } = await supabaseClient
    .from('share_holdings')
    .select('id')
    .eq('year', year)
    .eq('user_id', userId)

  return new Response(
    JSON.stringify({
      success: true,
      sessionId,
      companiesCount: companies?.length || 0,
      holdingsCount: holdings?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function processRow(row: any, year: number): ProcessedRow | null {
  // Flexible field mapping for Norwegian CSV files
  const getValue = (fields: string[]): string => {
    for (const field of fields) {
      const value = row[field]
      if (value !== undefined && value !== null && value !== '') {
        return String(value).trim()
      }
    }
    return ''
  }

  const orgnr = getValue([
    'orgnr', 'Orgnr', 'organisasjonsnummer', 'Organisasjonsnummer', 'org_nr', 'A'
  ]).replace(/\D/g, '') // Remove non-digits

  const companyName = getValue([
    'selskap', 'Selskap', 'navn', 'selskapsnavn', 'company_name', 'B'
  ])

  const holderName = getValue([
    'navn aksjonær', 'Navn aksjonær', 'aksjonær', 'eier', 'holder', 'navn_aksjonaer', 'D'
  ])

  const shareClass = getValue([
    'aksjeklasse', 'Aksjeklasse', 'share_class', 'C'
  ]) || 'A'

  const sharesStr = getValue([
    'antall aksjer', 'Antall aksjer', 'aksjer', 'shares', 'antall_aksjer', 'H'
  ]).replace(/[^\d]/g, '') // Remove non-digits

  const shares = parseInt(sharesStr) || 0

  // Validate required fields
  if (!orgnr || orgnr.length < 8 || !companyName || !holderName || shares <= 0) {
    return null
  }

  // Normalize org number (pad with leading zero if 8 digits)
  const normalizedOrgnr = orgnr.length === 8 ? '0' + orgnr : orgnr

  // Extract holder details
  const birthYearOrOrgnr = getValue([
    'fødselsår/orgnr', 'Fødselsår/orgnr', 'birth_year', 'eier_orgnr', 'E'
  ]).replace(/\s/g, '')

  let holderOrgnr: string | undefined
  let holderBirthYear: number | undefined
  const holderCountry = getValue(['landkode', 'Landkode', 'country_code', 'G']) || 'NO'

  // Parse birth year/org number field
  if (birthYearOrOrgnr) {
    if (/^\d{9}$/.test(birthYearOrOrgnr)) {
      holderOrgnr = birthYearOrOrgnr
    } else {
      const parsed = parseInt(birthYearOrOrgnr)
      if (parsed > 1900 && parsed < 2100) {
        holderBirthYear = parsed
      }
    }
  }

  return {
    orgnr: normalizedOrgnr,
    company_name: companyName,
    holder_name: holderName,
    holder_orgnr: holderOrgnr,
    holder_birth_year: holderBirthYear,
    holder_country: holderCountry,
    share_class: shareClass,
    shares
  }
}

async function insertCompanies(supabaseClient: any, companies: [string, string][], year: number, userId: string) {
  const companyData = companies.map(([orgnr, name]) => ({
    orgnr,
    name,
    year,
    total_shares: 0,
    user_id: userId
  }))

  const { error } = await supabaseClient
    .from('share_companies')
    .upsert(companyData, { onConflict: 'orgnr,year,user_id' })

  if (error) {
    console.error('Company insert error:', error)
    throw error
  }
}

async function insertEntities(supabaseClient: any, entities: any[]) {
  const { error } = await supabaseClient
    .from('share_entities')
    .upsert(entities, { onConflict: 'entity_type,name,orgnr,user_id' })

  if (error) {
    console.error('Entity insert error:', error)
    throw error
  }
}

async function insertHoldings(supabaseClient: any, holdings: ProcessedRow[], userId: string) {
  // Get entity IDs for holders
  const entityNames = holdings.map(h => h.holder_name)
  const { data: entities } = await supabaseClient
    .from('share_entities')
    .select('id, name, orgnr')
    .in('name', entityNames)
    .eq('user_id', userId)

  const entityMap = new Map()
  entities?.forEach((e: any) => {
    const key = e.orgnr || e.name
    entityMap.set(key, e.id)
  })

  const holdingData = holdings.map(h => {
    const holderKey = h.holder_orgnr || h.holder_name
    const holderId = entityMap.get(holderKey)
    
    if (!holderId) {
      console.warn(`No entity found for holder: ${h.holder_name}`)
      return null
    }

    return {
      company_orgnr: h.orgnr,
      holder_id: holderId,
      share_class: h.share_class,
      shares: h.shares,
      year: new Date().getFullYear(), // Use current year for now
      user_id: userId
    }
  }).filter(Boolean)

  if (holdingData.length > 0) {
    const { error } = await supabaseClient
      .from('share_holdings')
      .upsert(holdingData, { onConflict: 'company_orgnr,holder_id,share_class,year,user_id' })

    if (error) {
      console.error('Holdings insert error:', error)
      throw error
    }
  }
}