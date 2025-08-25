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

    console.log(`Finishing import session: ${session_id}`)

    // Update total_shares for all companies for this year
    const { error: updateError } = await supabase.rpc('update_total_shares_for_year', {
      p_year: year,
      p_user_id: isGlobal ? null : user.id
    })

    if (updateError) {
      console.warn('Warning: Could not update total_shares:', updateError)
    }

    // Get final counts for summary
    const { data: companiesCount } = await supabase
      .from('share_companies')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)
      .eq('user_id', isGlobal ? null : user.id)

    const { data: holdingsCount } = await supabase
      .from('share_holdings')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)
      .eq('user_id', isGlobal ? null : user.id)

    console.log(`Import session ${session_id} completed. Companies: ${companiesCount?.length || 0}, Holdings: ${holdingsCount?.length || 0}`)

    return new Response(JSON.stringify({
      success: true,
      session_id,
      summary: {
        companies: companiesCount?.length || 0,
        holdings: holdingsCount?.length || 0,
        year
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Finish session error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})