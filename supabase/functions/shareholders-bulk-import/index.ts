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
  // Use the existing ingest batch function
  const { data, error } = await supabaseClient.functions.invoke('shareholders-ingest-batch', {
    body: {
      session_id: sessionId,
      year: year,
      batch_data: batchData,
      is_global: isGlobal
    }
  })

  if (error) {
    throw new Error(`Batch processing failed: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function finishSession(supabaseClient: any, sessionId: string, year: number, isGlobal: boolean) {
  // Use the existing finish batch function for aggregation
  let offset = 0
  const batchSize = 5000 // Increased batch size for aggregation
  let hasMore = true
  let summary = null

  while (hasMore) {
    const { data, error } = await supabaseClient.functions.invoke('shareholders-import-finish-batch', {
      body: {
        session_id: sessionId,
        year: year,
        isGlobal: isGlobal,
        batch_size: batchSize,
        offset: offset
      }
    })

    if (error) {
      throw new Error(`Aggregation failed: ${error.message}`)
    }

    hasMore = data.batch_result.has_more
    offset += batchSize

    if (data.completed && data.summary) {
      summary = data.summary
      break
    }
  }

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

  return new Response(
    JSON.stringify({ 
      success: true, 
      summary: summary,
      session_id: sessionId
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
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