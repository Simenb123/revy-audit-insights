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

        // Extract and validate required fields
        const orgnr = String(row.orgnr || '').trim()
        const selskap = String(row.selskap || '').trim()
        const eierNavn = String(row.eier_navn || row.navn || '').trim()
        const sharesStr = String(row.andeler || row.shares || '0').replace(/[^\d]/g, '')
        const shares = parseInt(sharesStr) || 0

        if (!orgnr || !selskap || !eierNavn) {
          errors.push(`Mangler påkrevd data for rad: orgnr=${orgnr}, selskap=${selskap}, eier=${eierNavn}`)
          continue
        }

        // Upsert company
        const { error: companyError } = await supabaseClient
          .from('share_companies')
          .upsert({
            orgnr: orgnr,
            name: selskap,
            year: year,
            user_id: userId,
            total_shares: 0, // Will be calculated later
            calculated_total: 0
          }, {
            onConflict: 'orgnr,year,user_id'
          })

        if (companyError) {
          console.error('Company upsert error:', companyError)
          errors.push(`Feil ved lagring av selskap ${selskap}: ${companyError.message}`)
          continue
        }

        // Determine entity type based on organization number patterns
        const entityType = orgnr.length === 9 && /^\d+$/.test(orgnr) ? 'company' : 'person'
        
        // Upsert entity (holder)
        const entityData: any = {
          entity_type: entityType,
          name: eierNavn,
          user_id: userId
        }

        if (entityType === 'company') {
          entityData.orgnr = orgnr
        } else {
          // For persons, try to extract birth year from name patterns
          const birthYearMatch = eierNavn.match(/\b(19\d{2}|20\d{2})\b/)
          if (birthYearMatch) {
            entityData.birth_year = parseInt(birthYearMatch[1])
          }
          entityData.country_code = 'NO' // Default to Norway
        }

        const { data: entityResult, error: entityError } = await supabaseClient
          .from('share_entities')
          .upsert(entityData, {
            onConflict: entityType === 'company' ? 'orgnr,user_id' : 'name,user_id'
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

        // Insert holding record
        const { error: holdingError } = await supabaseClient
          .from('share_holdings')
          .upsert({
            company_orgnr: orgnr,
            holder_id: entityId,
            share_class: 'Ordinære', // Default share class
            shares: shares,
            year: year,
            user_id: userId
          }, {
            onConflict: 'company_orgnr,holder_id,share_class,year,user_id'
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

    // Get final counts for summary
    const { data: companiesCount } = await supabaseClient
      .from('share_companies')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)
      .eq('user_id', userId)

    const { data: holdingsCount } = await supabaseClient
      .from('share_holdings')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)
      .eq('user_id', userId)

    const summary = {
      companies: companiesCount?.length || 0,
      holdings: holdingsCount?.length || 0,
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