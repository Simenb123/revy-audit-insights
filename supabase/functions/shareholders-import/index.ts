import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Hjelpefunksjon for normalisering av aksjeklasser
function normalizeClassName(className: string): string {
  if (!className) return 'ORDINÆR'
  
  const normalized = className.toUpperCase().trim()
  
  // A-aksjer, B-aksjer etc.
  if (/^[A-Z]-?AKSJER?$/i.test(normalized)) {
    return normalized.charAt(0)
  }
  
  // Ordinære aksjer
  if (/ORDINÆR|ORDINARY|VANLIG/i.test(normalized)) {
    return 'ORDINÆR'
  }
  
  // Preferanseaksjer
  if (/PREFERANSE|PREFERENCE|PREF/i.test(normalized)) {
    return 'PREF'
  }
  
  // ISIN-koder beholdes som de er
  if (/^[A-Z]{2}[0-9A-Z]{10}$/.test(normalized)) {
    return normalized
  }
  
  // Fallback
  if (normalized === 'AKSJER') {
    return 'ORDINÆR'
  }
  
  return normalized
}

// Hjelpefunksjon for encoding-deteksjon
function detectEncoding(buffer: Uint8Array): string {
  const sample = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 1000))
  
  // Sjekk for vanlige norske tegn som ikke ville vært gyldig UTF-8
  if (sample.includes('Ã¥') || sample.includes('Ã¦') || sample.includes('Ã¸')) {
    return 'cp1252'
  }
  
  return 'utf-8'
}

// Hjelpefunksjon for å lese CSV med riktig encoding
function decodeCSV(buffer: Uint8Array, encoding: string): string {
  if (encoding === 'cp1252') {
    // Enkel CP1252 til UTF-8 konvertering for norske tegn
    let text = new TextDecoder('latin1').decode(buffer)
    text = text.replace(/\u00E5/g, 'å').replace(/\u00E6/g, 'æ').replace(/\u00F8/g, 'ø')
    text = text.replace(/\u00C5/g, 'Å').replace(/\u00C6/g, 'Æ').replace(/\u00D8/g, 'Ø')
    return text
  }
  return new TextDecoder('utf-8').decode(buffer)
}

interface ImportRequest {
  year: number
  delimiter?: ';' | ','
  encoding?: 'AUTO' | 'UTF-8' | 'CP1252'
  mode?: 'full' | 'clients-only'
  isGlobal?: boolean
}

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

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    const year = parseInt(formData.get('year') as string)
    const delimiter = (formData.get('delimiter') as ';' | ',') || ';'
    const encoding = (formData.get('encoding') as 'AUTO' | 'UTF-8' | 'CP1252') || 'AUTO'
    const mode = (formData.get('mode') as 'full' | 'clients-only') || 'full'
    const isGlobal = formData.get('isGlobal') === 'true'

    if (!file || !year) {
      throw new Error('Missing required fields: file and year')
    }

    // Verify superadmin for global imports
    if (isGlobal) {
      const { data: isSuperAdmin, error: superAdminError } = await supabase.rpc('is_super_admin', {
        user_uuid: user.id
      })
      
      if (superAdminError || !isSuperAdmin) {
        throw new Error('Only superadmins can perform global imports')
      }
    }

    console.log(`Starting import: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB), year: ${year}, mode: ${mode}, global: ${isGlobal}`)

    // Les fil direkte
    const buffer = new Uint8Array(await file.arrayBuffer())
    
    // Detektér encoding
    const detectedEncoding = encoding === 'AUTO' ? detectEncoding(buffer) : encoding.toLowerCase()
    
    // Dekod CSV
    const csvText = decodeCSV(buffer, detectedEncoding)
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least header and one data row')
    }

    // Parse header
    const header = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''))
    console.log('CSV Header:', header)

    // Hent klienters org-numre hvis mode er 'clients-only'
    let clientOrgNumbers: Set<string> = new Set()
    if (mode === 'clients-only') {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('organisasjonsnummer')
        .eq('user_id', user.id)
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      } else {
        clientOrgNumbers = new Set(clients.map(c => c.organisasjonsnummer).filter(Boolean))
        console.log(`Filtering for ${clientOrgNumbers.size} client org numbers`)
      }
    }

    let processedRows = 0
    let skippedRows = 0
    let errorRows = 0

    // Behandle i batcher med bulk operasjoner for bedre ytelse
    const batchSize = 500 // Optimalisert batch størrelse
    const totalDataRows = lines.length - 1
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batchEndIndex = Math.min(i + batchSize, lines.length)
      const batch = lines.slice(i, batchEndIndex)
      
      // Samle opp data for bulk insert
      const companiesToUpsert: any[] = []
      const entitiesToUpsert: any[] = []
      const holdingsToProcess: any[] = []
      
      for (let j = 0; j < batch.length; j++) {
        const line = batch[j]
        const currentRow = i + j
        
        try {
          const columns = line.split(delimiter).map(col => col.trim().replace(/['"]/g, ''))
          
          if (columns.length !== header.length) {
            console.warn(`Row ${currentRow}: Column count mismatch`)
            errorRows++
            continue
          }

          // Opprett rad-objekt
          const row: Record<string, string> = {}
          header.forEach((col, idx) => {
            row[col] = columns[idx] || ''
          })

          // Hent selskapsinfo
          const companyName = row['Navn'] || row['Selskapsnavn'] || row['Company Name'] || ''
          const companyOrgnr = row['Orgnr'] || row['Organisasjonsnummer'] || row['OrgNr'] || ''
          
          if (!companyName || !companyOrgnr) {
            skippedRows++
            continue
          }

          // Filtrer på klienter hvis nødvendig
          if (mode === 'clients-only' && !clientOrgNumbers.has(companyOrgnr)) {
            skippedRows++
            continue
          }

          // Hent aksjonærinfo
          const holderName = row['Aksjonær'] || row['Eier'] || row['Holder'] || ''
          const holderOrgnr = row['EierOrgnr'] || row['HolderOrgnr'] || ''
          const shareClass = normalizeClassName(row['Aksjeklasse'] || row['ShareClass'] || '')
          const shares = parseInt(row['Aksjer'] || row['Shares'] || '0') || 0
          const holderType = holderOrgnr ? 'company' : 'person'

          if (!holderName || shares <= 0) {
            skippedRows++
            continue
          }

          // Samle data for bulk operasjoner
          companiesToUpsert.push({
            orgnr: companyOrgnr,
            name: companyName,
            year,
            user_id: isGlobal ? null : user.id,
            total_shares: 0
          })

          entitiesToUpsert.push({
            entity_type: holderType,
            name: holderName,
            orgnr: holderOrgnr || null,
            user_id: isGlobal ? null : user.id
          })

          holdingsToProcess.push({
            company_orgnr: companyOrgnr,
            holder_name: holderName,
            holder_orgnr: holderOrgnr,
            share_class: shareClass,
            shares,
            year,
            user_id: isGlobal ? null : user.id
          })

        } catch (err) {
          console.error(`Error processing row ${currentRow}:`, err)
          errorRows++
        }
      }

      // Bulk upsert selskaper
      if (companiesToUpsert.length > 0) {
        const { error: companiesError } = await supabase
          .from('share_companies')
          .upsert(companiesToUpsert, { onConflict: 'orgnr,year,user_id', ignoreDuplicates: false })

        if (companiesError) {
          console.error('Bulk companies upsert error:', companiesError)
          errorRows += companiesToUpsert.length
        }
      }

      // Bulk upsert entiteter
      if (entitiesToUpsert.length > 0) {
        const { error: entitiesError } = await supabase
          .from('share_entities')
          .upsert(entitiesToUpsert, { onConflict: 'entity_type,name,orgnr,user_id', ignoreDuplicates: false })

        if (entitiesError) {
          console.error('Bulk entities upsert error:', entitiesError)
          errorRows += entitiesToUpsert.length
        }
      }

      // Prosesser holdings (trenger entity IDs)
      for (const holding of holdingsToProcess) {
        try {
          // Hent entity ID
          const { data: entityData, error: entityError } = await supabase
            .from('share_entities')
            .select('id')
            .eq('entity_type', holding.holder_orgnr ? 'company' : 'person')
            .eq('name', holding.holder_name)
            .eq('orgnr', holding.holder_orgnr)
            .eq('user_id', holding.user_id)
            .single()

          if (entityError || !entityData) {
            console.error('Entity lookup error:', entityError)
            errorRows++
            continue
          }

          // Upsert holding
          const { error: holdingError } = await supabase
            .from('share_holdings')
            .upsert({
              company_orgnr: holding.company_orgnr,
              holder_id: entityData.id,
              share_class: holding.share_class,
              shares: holding.shares,
              year: holding.year,
              user_id: holding.user_id
            })

          if (holdingError) {
            console.error('Holding upsert error:', holdingError)
            errorRows++
            continue
          }

          processedRows++

        } catch (err) {
          console.error('Error processing holding:', err)
          errorRows++
        }
      }

      // Detaljert progress logging
      const progress = Math.round(((batchEndIndex - 1) / totalDataRows) * 100)
      console.log(`Batch ${Math.ceil(i / batchSize)} completed: Rows ${i}-${batchEndIndex - 1} | Progress: ${progress}% | Processed: ${processedRows}, Skipped: ${skippedRows}, Errors: ${errorRows}`)
    }

    // Oppdater total_shares for alle selskaper
    const { error: updateError } = await supabase.rpc('update_total_shares_for_year', {
      p_year: year,
      p_user_id: isGlobal ? null : user.id
    })

    if (updateError) {
      console.warn('Warning: Could not update total_shares:', updateError)
    }

    console.log(`Import completed: ${processedRows} processed, ${skippedRows} skipped, ${errorRows} errors`)

    return new Response(JSON.stringify({
      success: true,
      processedRows,
      skippedRows,
      errorRows,
      totalRows: lines.length - 1
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