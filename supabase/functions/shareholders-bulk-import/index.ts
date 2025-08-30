import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportSession {
  session_id: string
  user_id: string
  year: number
  status: 'active' | 'completed' | 'failed'
  progress: number
  total_rows: number
  processed_rows: number
  file_name: string
  created_at: string
  updated_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { action, session_id, year, file_data, batch_data, is_global = false } = body

      switch (action) {
        case 'START_SESSION':
          return await startImportSession(supabaseClient, user.id, year, file_data?.name || 'unknown')
        
        case 'UPDATE_PROGRESS':
          return await updateSessionProgress(supabaseClient, session_id, body.progress, body.processed_rows)
        
        case 'PROCESS_BATCH':
          return await processBatch(supabaseClient, session_id, year, batch_data, is_global)
        
        case 'FINISH_SESSION':
          return await finishSession(supabaseClient, session_id, year, is_global)
        
        case 'CHECK_SESSION':
          return await checkSession(supabaseClient, session_id)
        
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in shareholders-bulk-import:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function startImportSession(supabaseClient: any, userId: string, year: number, fileName: string) {
  const sessionId = crypto.randomUUID()
  
  // Create import session record
  const { error: sessionError } = await supabaseClient
    .from('import_sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      year: year,
      status: 'active',
      progress: 0,
      total_rows: 0,
      processed_rows: 0,
      file_name: fileName,
      session_type: 'shareholders_bulk'
    })

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`)
  }

  return new Response(
    JSON.stringify({ session_id: sessionId, user_id: userId, year }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateSessionProgress(supabaseClient: any, sessionId: string, progress: number, processedRows: number) {
  const { error } = await supabaseClient
    .from('import_sessions')
    .update({ 
      progress: progress,
      processed_rows: processedRows,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to update progress: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processBatch(supabaseClient: any, sessionId: string, year: number, batchData: any[], isGlobal: boolean) {
  console.log(`Processing batch for session ${sessionId}, year ${year}, rows: ${batchData.length}`)
  
  try {
    // Get user from session if not global
    let userId = null
    if (!isGlobal) {
      const { data: { user } } = await supabaseClient.auth.getUser()
      userId = user?.id || null
    }

    let processedRows = 0
    let errors: string[] = []

    // Process each row in the batch
    for (const row of batchData) {
      try {
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) {
          continue
        }

        // Extract and validate required fields with enhanced field mapping
        const orgnr = String(
          row.orgnr || row.Orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || 
          row.org_nr || row['org-nr'] || ''
        ).trim().replace(/\D/g, '') // Remove non-digits
        
        const selskap = String(
          row.selskap || row.navn || row.selskapsnavn || row.company_name || row.Selskap || ''
        ).trim()
        
        const eierNavn = String(
          row.navn_aksjonaer || row.aksjonaer || row.eier || row.holder || 
          row.eier_navn || row['Navn aksjonær'] || row['Navn aksjonÃ¦r'] || ''
        ).trim()
        
        const sharesStr = String(
          row.antall_aksjer || row.aksjer || row.shares || row.andeler || '0'
        ).replace(/[^\d]/g, '')
        const shares = parseInt(sharesStr) || 0

        // Very lenient validation - support both 8 and 9 digit org numbers
        let normalizedOrgnr = orgnr
        if (normalizedOrgnr.length === 8) {
          normalizedOrgnr = '0' + normalizedOrgnr // Pad with leading zero
        }
        
        if (!normalizedOrgnr || (normalizedOrgnr.length !== 9 && normalizedOrgnr.length !== 8)) {
          errors.push(`Ugyldig organisasjonsnummer: ${orgnr} (må være 8-9 siffer)`)
          continue
        }
        
        if (!selskap && !eierNavn) {
          errors.push(`Mangler både selskapsnavn og eiernavn for orgnr: ${normalizedOrgnr}`)
          continue
        }
        
        // Use normalized org number and provide fallback names
        const companyName = selskap || `Ukjent selskap (${normalizedOrgnr})`
        const holderName = eierNavn || `Ukjent eier`

        // Upsert company with normalized org number
        const { error: companyError } = await supabaseClient
          .from('share_companies')
          .upsert({
            orgnr: normalizedOrgnr,
            name: companyName,
            year: year,
            user_id: userId,
            total_shares: 0 // Will be calculated later
          }, {
            onConflict: 'orgnr,year' + (userId ? ',user_id' : ''),
            ignoreDuplicates: false
          })

        if (companyError) {
          console.error('Company upsert error:', companyError)
          errors.push(`Feil ved lagring av selskap ${selskap}: ${companyError.message}`)
          continue
        }

        // Enhanced entity type detection
        const holderOrgNr = String(
          row.fodselsar_orgnr || row.eier_orgnr || row.holder_orgnr || 
          row['Fødselsår/orgnr'] || row['FÃ¸dselsÃ¥r/orgnr'] || ''
        ).trim().replace(/\D/g, '')
        
        const entityType = (holderOrgNr.length === 9 && /^\d+$/.test(holderOrgNr)) ? 'company' : 'person'
        
        // Upsert entity (holder) with better conflict resolution
        const entityData: any = {
          entity_type: entityType,
          name: holderName,
          user_id: userId
        }

        if (entityType === 'company' && holderOrgNr) {
          entityData.orgnr = holderOrgNr
        } else {
          // For persons, try to extract birth year from various sources
          const birthYearSources = [
            row.fodselsar_orgnr, row.eier_orgnr, row.birth_year, 
            holderName.match(/\b(19\d{2}|20\d{2})\b/)?.[1]
          ]
          
          for (const source of birthYearSources) {
            if (source) {
              const year = parseInt(String(source).replace(/\D/g, ''))
              if (year >= 1900 && year <= new Date().getFullYear()) {
                entityData.birth_year = year
                break
              }
            }
          }
          
          entityData.country_code = String(
            row.landkode || row.Landkode || row.country_code || 'NO'
          ).trim().toUpperCase() || 'NO'
        }

        const conflictColumns = entityType === 'company' && holderOrgNr 
          ? (userId ? 'orgnr,user_id' : 'orgnr') 
          : (userId ? 'name,user_id' : 'name')
          
        const { data: entityResult, error: entityError } = await supabaseClient
          .from('share_entities')
          .upsert(entityData, {
            onConflict: conflictColumns,
            ignoreDuplicates: false
          })
          .select('id')
          .single()

        if (entityError) {
          console.error('Entity upsert error:', entityError)
          errors.push(`Feil ved lagring av eier ${eierNavn}: ${entityError.message}`)
          continue
        }

        const entityId = entityResult?.id
        if (!entityId) {
          errors.push(`Kunne ikke få entity ID for ${eierNavn}`)
          continue
        }

        // Insert holding record with better share class handling
        const shareClass = String(
          row.aksjeklasse || row.Aksjeklasse || row.share_class || 'Ordinære'
        ).trim() || 'Ordinære'
        
        const holdingData = {
          company_orgnr: normalizedOrgnr, // Use normalized org number
          holder_id: entityId,
          share_class: shareClass,
          shares: shares,
          year: year,
          user_id: userId
        }
        
        const conflictHoldingColumns = userId 
          ? 'company_orgnr,holder_id,share_class,year,user_id'
          : 'company_orgnr,holder_id,share_class,year'
        
        const { error: holdingError } = await supabaseClient
          .from('share_holdings')
          .upsert(holdingData, {
            onConflict: conflictHoldingColumns,
            ignoreDuplicates: false
          })

        if (holdingError) {
          console.error('Holding upsert error:', holdingError)
          errors.push(`Feil ved lagring av eierskap for ${eierNavn}: ${holdingError.message}`)
          continue
        }

        processedRows++

      } catch (rowError) {
        console.error('Error processing row:', rowError)
        errors.push(`Feil ved prosessering av rad: ${rowError.message}`)
      }
    }

    console.log(`Batch processed: ${processedRows} successful, ${errors.length} errors`)

    // Update session with total processed rows if we have a session
    if (sessionId && sessionId !== 'unknown') {
      const { error: updateError } = await supabaseClient
        .from('import_sessions')
        .update({
          processed_rows: processedRows,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('Failed to update session processed rows:', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_rows: processedRows,
        total_rows: batchData.length,
        errors: errors,
        session_id: sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in processBatch:', error)
    throw new Error(`Batch processing failed: ${error.message}`)
  }
}

async function finishSession(supabaseClient: any, sessionId: string, year: number, isGlobal: boolean) {
  console.log(`Starting aggregation for session ${sessionId}, year ${year}, isGlobal: ${isGlobal}`)
  
  try {
    // Get user from session if not global
    let userId = null
    if (!isGlobal) {
      const { data: { user } } = await supabaseClient.auth.getUser()
      userId = user?.id || null
    }

    // Use the database function to aggregate all data for the year
    console.log('Calling update_total_shares_for_year...')
    const { error: aggregationError } = await supabaseClient.rpc('update_total_shares_for_year', {
      p_year: year,
      p_orgnr: null, // null means update all companies for the year
      p_user_id: userId
    })

    if (aggregationError) {
      console.error('Aggregation error:', aggregationError)
      throw new Error(`Aggregation failed: ${aggregationError.message}`)
    }

    console.log('Aggregation completed, getting summary...')

    // Get final counts for summary with proper query
    const companiesQuery = supabaseClient
      .from('share_companies')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)

    const holdingsQuery = supabaseClient
      .from('share_holdings')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)

    const entitiesQuery = supabaseClient
      .from('share_entities')
      .select('*', { count: 'exact', head: true })

    // Filter by user_id only if not global
    if (userId) {
      companiesQuery.eq('user_id', userId)
      holdingsQuery.eq('user_id', userId)
      entitiesQuery.eq('user_id', userId)
    }

    const [companiesResult, holdingsResult, entitiesResult] = await Promise.all([
      companiesQuery,
      holdingsQuery,
      entitiesQuery
    ])

    const summary = {
      companies: companiesResult.count || 0,
      holdings: holdingsResult.count || 0,
      entities: entitiesResult.count || 0,
      year: year
    }

    console.log(`Summary: ${summary.companies} companies, ${summary.holdings} holdings`)

    // Update session status
    const { error: updateError } = await supabaseClient
      .from('import_sessions')
      .update({ 
        status: 'completed',
        progress: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to update session status:', updateError)
    }

    console.log(`Session ${sessionId} completed successfully`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: summary,
        session_id: sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in finishSession:', error)
    
    // Update session as failed
    await supabaseClient
      .from('import_sessions')
      .update({ 
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    throw error
  }
}

async function checkSession(supabaseClient: any, sessionId: string) {
  const { data, error } = await supabaseClient
    .from('import_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}