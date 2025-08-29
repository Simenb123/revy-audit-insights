import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Only POST allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const { session_id, year, isGlobal } = await req.json()

    console.log(`Checking recovery status for session: ${session_id}`)

    // Get session status
    const { data: status, error: statusError } = await supabase.rpc('get_import_session_status', {
      p_session_id: session_id,
      p_year: year,
      p_user_id: isGlobal ? null : user.id
    })

    if (statusError) {
      console.error('Status check error:', statusError)
      throw new Error(`Failed to check status: ${statusError.message}`)
    }

    console.log(`Session status:`, status)

    return new Response(JSON.stringify({
      success: true,
      status,
      can_recover: status.companies_count > 0 || status.holdings_count > 0,
      needs_aggregation: status.needs_aggregation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Recovery check error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})