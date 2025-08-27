import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Normalisering av aksjeklasser
function normalizeClassName(className?: string): string {
  if (!className) return 'ORDINÆR'
  
  const normalized = className.toUpperCase().trim()
  
  if (/^[A-Z]-?AKSJER?$/i.test(normalized)) {
    return normalized.charAt(0)
  }
  
  if (/ORDINÆR|ORDINARY|VANLIG/i.test(normalized)) {
    return 'ORDINÆR'
  }
  
  if (/PREFERANSE|PREFERENCE|PREF/i.test(normalized)) {
    return 'PREF'
  }
  
  if (/^[A-Z]{2}[0-9A-Z]{10}$/.test(normalized)) {
    return normalized
  }
  
  if (normalized === 'AKSJER') {
    return 'ORDINÆR'
  }
  
  return normalized
}

// Helper function to parse numbers
function parseNumber(value: any): number | null {
  if (value == null || value === '') return null
  const str = String(value).replace(/\s/g, '').replace(',', '.')
  const num = Number(str)
  return Number.isFinite(num) ? num : null
}

interface BatchRow {
  orgnr: string
  selskap: string
  aksjeklasse?: string | null
  navn_aksjonaer: string
  fodselsar_orgnr?: string | null
  landkode?: string | null
  antall_aksjer: string | number
  antall_aksjer_selskap?: string | number | null
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

    const startTime = performance.now()
    const { session_id, year, rows, isGlobal } = await req.json() as {
      session_id: string
      year: number 
      rows: BatchRow[]
      isGlobal?: boolean
    }

    console.log(`Processing batch: ${rows.length} rows for session ${session_id}`)
    
    // Debug first few rows to see data structure
    if (rows.length > 0) {
      console.log(`Sample row data:`, JSON.stringify(rows[0], null, 2))
    }

    // Build unique companies, entities and holdings maps
    const companiesMap = new Map<string, { orgnr: string; name: string; total_shares: number | null }>()
    const entitiesMap = new Map<string, { entity_type: 'person' | 'company'; name: string; orgnr: string | null; birth_year: number | null; country_code: string | null }>()
    const holdings: Array<{ company_orgnr: string; share_class: string | null; shares: number; holder_key: string }> = []

    for (const row of rows) {
      const orgnr = String(row.orgnr || '').replace(/\D/g, '')
      if (!orgnr || orgnr.length !== 9) {
        console.log(`Skipping row - invalid orgnr: "${row.orgnr}" -> "${orgnr}"`)
        continue
      }

      const totalShares = parseNumber(row.antall_aksjer_selskap)
      if (!companiesMap.has(orgnr)) {
        companiesMap.set(orgnr, {
          orgnr,
          name: row.selskap || orgnr,
          total_shares: totalShares
        })
      }

      // Process holder/entity
      const holderRaw = String(row.fodselsar_orgnr || '').replace(/\D/g, '')
      const holderName = String(row.navn_aksjonaer || '').trim()
      
      if (!holderName) {
        console.log(`Skipping row - missing holder name for orgnr: ${orgnr}`)
        continue
      }
      
      let holderKey = ''
      let entity: any = {
        entity_type: 'person',
        name: holderName,
        orgnr: null,
        birth_year: null,
        country_code: row.landkode || null
      }

      if (/^\d{9}$/.test(holderRaw)) {
        // Company (9 digits)
        entity.entity_type = 'company'
        entity.orgnr = holderRaw
        holderKey = `org:${holderRaw}`
      } else if (/^\d{4}$/.test(holderRaw)) {
        // Person with birth year (4 digits)
        entity.birth_year = Number(holderRaw)
        holderKey = `p:${holderName.toUpperCase()}:${entity.birth_year}`
      } else {
        // Person without birth year
        holderKey = `p:${holderName.toUpperCase()}:`
      }

      if (!entitiesMap.has(holderKey)) {
        entitiesMap.set(holderKey, entity)
      }

      // Add holding
      const shares = parseNumber(row.antall_aksjer) ?? 0
      const shareClass = normalizeClassName(row.aksjeklasse)
      
      console.log(`Processing holding: orgnr=${orgnr}, holder=${holderName}, shares=${shares}, class=${shareClass}`)
      
      if (shares > 0) {
        holdings.push({
          company_orgnr: orgnr,
          share_class: shareClass,
          shares,
          holder_key: holderKey
        })
      } else {
        console.log(`Skipping holding with 0 shares: orgnr=${orgnr}, holder=${holderName}`)
      }
    }

    // 1. Upsert companies - simplified with ignoreDuplicates
    const companies = Array.from(companiesMap.values()).map(c => ({
      ...c,
      year,
      user_id: isGlobal ? null : user.id
    }))

    if (companies.length > 0) {
      const { error: companyError } = await supabase
        .from('share_companies')
        .upsert(companies, { ignoreDuplicates: true })

      if (companyError) {
        throw new Error(`Company upsert failed: ${companyError.message}`)
      }
    }

    // 2. Upsert entities and get IDs
    const entities = Array.from(entitiesMap.entries()).map(([key, entity]) => ({
      ...entity,
      user_id: isGlobal ? null : user.id,
      _temp_key: key
    }))

    const entityIdMap = new Map<string, string>()

    if (entities.length > 0) {
      // Upsert entities - use ignoreDuplicates since we have separate constraints for person/company
      const { data: upsertedEntities, error: entityError } = await supabase
        .from('share_entities')
        .upsert(
          entities.map(({ _temp_key, ...entity }) => entity),
          { ignoreDuplicates: true }
        )
        .select('id, entity_type, name, orgnr, birth_year')

      if (entityError) {
        throw new Error(`Entity upsert failed: ${entityError.message}`)
      }

      // Map returned entities back to keys
      for (const entity of upsertedEntities || []) {
        let key = ''
        if (entity.orgnr) {
          key = `org:${entity.orgnr}`
        } else if (entity.birth_year) {
          key = `p:${entity.name.toUpperCase()}:${entity.birth_year}`
        } else {
          key = `p:${entity.name.toUpperCase()}:`
        }
        entityIdMap.set(key, entity.id)
      }
    }

    // 3. Build and upsert holdings
    const holdingsData = holdings
      .map(h => ({
        company_orgnr: h.company_orgnr,
        holder_id: entityIdMap.get(h.holder_key),
        share_class: h.share_class,
        shares: h.shares,
        year,
        user_id: isGlobal ? null : user.id
      }))
      .filter(h => h.holder_id) // Only include holdings where we found the entity

    if (holdingsData.length > 0) {
      // Process in smaller chunks to avoid memory issues
      const CHUNK_SIZE = 1000
      for (let i = 0; i < holdingsData.length; i += CHUNK_SIZE) {
        const chunk = holdingsData.slice(i, i + CHUNK_SIZE)
        const { error: holdingError } = await supabase
          .from('share_holdings')
          .upsert(chunk, { ignoreDuplicates: true })

        if (holdingError) {
          throw new Error(`Holdings upsert failed: ${holdingError.message}`)
        }
      }
    }

    const duration = Math.round(performance.now() - startTime)
    
    console.log(`Batch processed: ${companies.length} companies, ${entities.length} entities, ${holdingsData.length} holdings in ${duration}ms`)
    console.log(`Processed ${rows.length} input rows -> ${companiesMap.size} unique companies, ${entitiesMap.size} unique entities, ${holdings.length} total holdings`)

    return new Response(JSON.stringify({
      success: true,
      companies: companies.length,
      entities: entities.length,
      holdings: holdingsData.length,
      duration_ms: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Batch processing error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})