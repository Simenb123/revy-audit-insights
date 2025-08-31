import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ParsedRow {
  company_orgnr: string
  company_name: string
  holder_name: string
  holder_orgnr?: string
  holder_birth_year?: number
  holder_country?: string
  share_class: string
  shares: bigint // Changed to bigint to handle large numbers
  raw_row: any
}

// Rate limiting constants
const LARGE_BATCH_SIZE = 8000 // Increased from 500 to reduce API calls
const DELAY_BETWEEN_BATCHES = 2000 // 2 second delay to respect rate limits
const MAX_RETRIES = 3

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

    const { data, year, batchInfo } = await req.json()
    
    console.log(`Processing optimized batch ${batchInfo.current}/${batchInfo.total} with ${data.length} rows for year ${year}`)

    let imported = 0
    let errors = 0

    // Process companies first with bulk operations
    const companies = new Map<string, { orgnr: string, name: string }>()
    data.forEach((row: ParsedRow) => {
      if (!companies.has(row.company_orgnr)) {
        companies.set(row.company_orgnr, {
          orgnr: row.company_orgnr,
          name: row.company_name
        })
      }
    })

    // Bulk insert companies
    try {
      const companyData = Array.from(companies.values()).map(company => ({
        orgnr: company.orgnr,
        name: company.name,
        year: year,
        user_id: user.id,
        total_shares: 0 // Will be calculated later
      }))

      const { error: companiesError } = await supabase
        .from('share_companies')
        .upsert(companyData, {
          onConflict: 'orgnr,year,user_id'
        })

      if (companiesError) {
        console.error('Bulk company insert error:', companiesError)
        errors += companyData.length
      } else {
        console.log(`✅ Bulk inserted ${companyData.length} companies`)
      }
    } catch (error) {
      console.error('Company bulk processing error:', error)
      errors += companies.size
    }

    // Process entities in bulk
    const entities = new Map<string, any>()
    data.forEach((row: ParsedRow) => {
      const entityKey = row.holder_orgnr || `${row.holder_name}_${row.holder_birth_year || 'person'}`
      if (!entities.has(entityKey)) {
        entities.set(entityKey, {
          entity_type: row.holder_orgnr ? 'company' : 'person',
          name: row.holder_name,
          orgnr: row.holder_orgnr,
          birth_year: row.holder_birth_year,
          country_code: row.holder_country || 'NO',
          user_id: user.id
        })
      }
    })

    // Bulk insert entities and get their IDs
    const entityIdMap = new Map<string, string>()
    try {
      const entityData = Array.from(entities.values())
      
      for (const entity of entityData) {
        const { data: insertedEntity, error } = await supabase
          .from('share_entities')
          .upsert(entity, {
            onConflict: entity.entity_type === 'company' ? 'orgnr,user_id' : 'name,birth_year,country_code,user_id,entity_type'
          })
          .select('id')
          .single()

        if (error) {
          console.error('Entity insert error:', error)
          errors++
        } else if (insertedEntity) {
          const entityKey = entity.orgnr || `${entity.name}_${entity.birth_year || 'person'}`
          entityIdMap.set(entityKey, insertedEntity.id)
        }
      }
      
      console.log(`✅ Processed ${entityData.length} entities`)
    } catch (error) {
      console.error('Entity bulk processing error:', error)
      errors += entities.size
    }

    // Bulk insert holdings
    try {
      const holdingsData = []
      
      for (const row of data) {
        const entityKey = row.holder_orgnr || `${row.holder_name}_${row.holder_birth_year || 'person'}`
        const holderId = entityIdMap.get(entityKey)
        
        if (!holderId) {
          console.warn('No entity ID found for:', entityKey)
          errors++
          continue
        }

        holdingsData.push({
          company_orgnr: row.company_orgnr,
          holder_id: holderId,
          share_class: row.share_class,
          shares: Number(row.shares), // Convert bigint to number for DB
          year: year,
          user_id: user.id
        })
      }

      if (holdingsData.length > 0) {
        const { error: holdingsError } = await supabase
          .from('share_holdings')
          .upsert(holdingsData, {
            onConflict: 'company_orgnr,holder_id,share_class,year,user_id'
          })

        if (holdingsError) {
          console.error('Bulk holdings insert error:', holdingsError)
          errors += holdingsData.length
        } else {
          imported = holdingsData.length
          console.log(`✅ Bulk inserted ${holdingsData.length} holdings`)
        }
      }
    } catch (error) {
      console.error('Holdings bulk processing error:', error)
      errors += data.length
    }

    // Update company total shares using optimized batch function
    try {
      for (const company of companies.values()) {
        await supabase.rpc('update_company_total_shares', {
          p_orgnr: company.orgnr,
          p_year: year,
          p_user_id: user.id
        })
      }
      console.log(`✅ Updated total shares for ${companies.size} companies`)
    } catch (error) {
      console.error('Total shares update error:', error)
    }

    // Add delay for rate limiting if not the last batch
    if (batchInfo.current < batchInfo.total) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }

    console.log(`Optimized batch ${batchInfo.current} completed: ${imported} imported, ${errors} errors`)

    return new Response(JSON.stringify({
      imported,
      errors,
      batch: batchInfo,
      batchSize: LARGE_BATCH_SIZE
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})