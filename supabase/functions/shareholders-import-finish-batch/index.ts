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

    const { session_id, year, isGlobal, batch_size = 1000, offset = 0 } = await req.json()

    console.log(`Processing batch for session: ${session_id}, offset: ${offset}, batch_size: ${batch_size}`)

    // Process batch of companies
    const { data: batchResult, error: batchError } = await supabase.rpc('update_total_shares_batch', {
      p_year: year,
      p_user_id: isGlobal ? null : user.id,
      p_batch_size: batch_size,
      p_offset: offset
    })

    if (batchError) {
      console.error('Batch processing error:', batchError)
      throw new Error(`Batch processing failed: ${batchError.message}`)
    }

    console.log(`Batch completed: processed ${batchResult.processed_count} companies, total: ${batchResult.total_companies}`)

    // If this is the final batch, get summary counts
    let summary = null
    if (!batchResult.has_more) {
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

      summary = {
        companies: companiesCount?.length || 0,
        holdings: holdingsCount?.length || 0,
        year
      }

      console.log(`Import session ${session_id} completed. Companies: ${summary.companies}, Holdings: ${summary.holdings}`)
    }

    return new Response(JSON.stringify({
      success: true,
      session_id,
      batch_result: batchResult,
      summary,
      completed: !batchResult.has_more
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Batch finish error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})