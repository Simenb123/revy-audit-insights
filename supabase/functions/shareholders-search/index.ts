import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verifiser JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verifiser bruker
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Hent søkeparameter
    const url = new URL(req.url)
    const query = url.searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({
        companies: [],
        entities: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Searching for: "${query}"`)

    // Søk i selskaper
    const companiesQuery = supabase
      .from('share_companies')
      .select(`
        id,
        orgnr,
        name,
        total_shares,
        year,
        created_at
      `)
      .eq('user_id', user.id)
      .limit(50)

    // Hvis søket ser ut som et org.nummer (kun siffer)
    if (/^\d+$/.test(query)) {
      companiesQuery.or(`orgnr.eq.${query},name.ilike.%${query}%`)
    } else {
      // Tekst-søk med trigram for bedre matching
      companiesQuery.or(`name.ilike.%${query}%,orgnr.ilike.%${query}%`)
    }

    const { data: companies, error: companiesError } = await companiesQuery

    if (companiesError) {
      console.error('Companies search error:', companiesError)
      throw new Error('Failed to search companies')
    }

    // Søk i enheter (aksjonærer)
    const entitiesQuery = supabase
      .from('share_entities')
      .select(`
        id,
        entity_type,
        name,
        country_code,
        birth_year,
        orgnr,
        created_at
      `)
      .eq('user_id', user.id)
      .limit(50)

    if (/^\d+$/.test(query)) {
      entitiesQuery.or(`orgnr.eq.${query},name.ilike.%${query}%`)
    } else {
      entitiesQuery.or(`name.ilike.%${query}%,orgnr.ilike.%${query}%`)
    }

    const { data: entities, error: entitiesError } = await entitiesQuery

    if (entitiesError) {
      console.error('Entities search error:', entitiesError)
      throw new Error('Failed to search entities')
    }

    // For selskaper, hent også aksjeklasse-informasjon
    const companiesWithClasses = await Promise.all(
      companies.map(async (company) => {
        const { data: holdings } = await supabase
          .from('share_holdings')
          .select('share_class, shares')
          .eq('company_orgnr', company.orgnr)
          .eq('year', company.year)
          .eq('user_id', user.id)

        // Grupper per aksjeklasse
        const shareClasses: Record<string, number> = {}
        let totalShares = 0

        holdings?.forEach(holding => {
          shareClasses[holding.share_class] = (shareClasses[holding.share_class] || 0) + holding.shares
          totalShares += holding.shares
        })

        return {
          ...company,
          share_classes: shareClasses,
          calculated_total: totalShares
        }
      })
    )

    console.log(`Found ${companies.length} companies and ${entities.length} entities`)

    return new Response(JSON.stringify({
      companies: companiesWithClasses,
      entities
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Search error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})