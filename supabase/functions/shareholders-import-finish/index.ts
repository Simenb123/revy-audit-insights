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

    // Try batch processing instead of all at once
    let offset = 0
    const batchSize = 1000
    let totalProcessed = 0
    let hasMore = true

    console.log('Starting batch aggregation process...')

    while (hasMore) {
      const { data: batchResult, error: batchError } = await supabase.rpc('update_total_shares_batch', {
        p_year: year,
        p_user_id: isGlobal ? null : user.id,
        p_batch_size: batchSize,
        p_offset: offset
      })

      if (batchError) {
        console.warn(`Batch ${offset}-${offset + batchSize} failed:`, batchError)
        // Continue with next batch instead of failing completely
        offset += batchSize
        continue
      }

      totalProcessed += batchResult.processed_count
      hasMore = batchResult.has_more
      offset += batchSize

      console.log(`Processed batch: ${batchResult.processed_count} companies (${totalProcessed}/${batchResult.total_companies})`)

      // Prevent infinite loops
      if (offset > 500000) {
        console.warn('Batch processing limit reached, stopping')
        break
      }
    }

    console.log(`Aggregation completed. Processed ${totalProcessed} companies.`)

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