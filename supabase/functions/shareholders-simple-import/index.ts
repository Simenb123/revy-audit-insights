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
  shares: number
  raw_row: any
}

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
    
    console.log(`Processing batch ${batchInfo.current}/${batchInfo.total} with ${data.length} rows for year ${year}`)

    let imported = 0
    let errors = 0

    // Process companies first
    const companies = new Map<string, { orgnr: string, name: string }>()
    data.forEach((row: ParsedRow) => {
      if (!companies.has(row.company_orgnr)) {
        companies.set(row.company_orgnr, {
          orgnr: row.company_orgnr,
          name: row.company_name
        })
      }
    })

    // Insert companies
    for (const company of companies.values()) {
      try {
        const { error } = await supabase
          .from('share_companies')
          .upsert({
            orgnr: company.orgnr,
            name: company.name,
            year: year,
            user_id: user.id,
            total_shares: 0 // Will be calculated later
          }, {
            onConflict: 'orgnr,year,user_id'
          })

        if (error) {
          console.error('Company insert error:', error)
          errors++
        }
      } catch (error) {
        console.error('Company processing error:', error)
        errors++
      }
    }

    // Process entities
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

    // Insert entities
    const entityIdMap = new Map<string, string>()
    for (const [key, entity] of entities.entries()) {
      try {
        const { data: insertedEntity, error } = await supabase
          .from('share_entities')
          .upsert(entity, {
            onConflict: entity.entity_type === 'company' ? 'orgnr,user_id' : 'name,birth_year,user_id'
          })
          .select('id')
          .single()

        if (error) {
          console.error('Entity insert error:', error)
          errors++
        } else if (insertedEntity) {
          entityIdMap.set(key, insertedEntity.id)
        }
      } catch (error) {
        console.error('Entity processing error:', error)
        errors++
      }
    }

    // Insert holdings
    for (const row of data) {
      try {
        const entityKey = row.holder_orgnr || `${row.holder_name}_${row.holder_birth_year || 'person'}`
        const holderId = entityIdMap.get(entityKey)
        
        if (!holderId) {
          console.warn('No entity ID found for:', entityKey)
          errors++
          continue
        }

        const { error } = await supabase
          .from('share_holdings')
          .upsert({
            company_orgnr: row.company_orgnr,
            holder_id: holderId,
            share_class: row.share_class,
            shares: Math.min(row.shares, 2147483647), // Cap to max integer to prevent overflow
            year: year,
            user_id: user.id
          }, {
            onConflict: 'company_orgnr,holder_id,share_class,year,user_id'
          })

        if (error) {
          console.error('Holding insert error:', error)
          errors++
        } else {
          imported++
        }
      } catch (error) {
        console.error('Holding processing error:', error)
        errors++
      }
    }

    // Update company total shares (simple aggregation per company in this batch)
    for (const company of companies.values()) {
      try {
        const { data: totalSharesData, error } = await supabase
          .from('share_holdings')
          .select('shares')
          .eq('company_orgnr', company.orgnr)
          .eq('year', year)
          .eq('user_id', user.id)

        if (!error && totalSharesData) {
          const totalShares = totalSharesData.reduce((sum, h) => sum + (h.shares || 0), 0)
          
          await supabase
            .from('share_companies')
            .update({ total_shares: Math.min(totalShares, 2147483647) }) // Cap to prevent overflow
            .eq('orgnr', company.orgnr)
            .eq('year', year)
            .eq('user_id', user.id)
        }
      } catch (error) {
        console.error('Total shares update error:', error)
      }
    }

    console.log(`Batch ${batchInfo.current} completed: ${imported} imported, ${errors} errors`)

    return new Response(JSON.stringify({
      imported,
      errors,
      batch: batchInfo
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