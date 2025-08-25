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
  storagePath: string
  year: number
  delimiter?: ';' | ','
  encoding?: 'AUTO' | 'UTF-8' | 'CP1252'
  mode?: 'full' | 'clients-only'
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

    const body: ImportRequest = await req.json()
    const { storagePath, year, delimiter = ';', encoding = 'AUTO', mode = 'full' } = body

    console.log(`Starting import: ${storagePath}, year: ${year}, mode: ${mode}`)

    // Last ned fil fra storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('shareholders')
      .download(storagePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Konverter til buffer
    const buffer = new Uint8Array(await fileData.arrayBuffer())
    
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

    // Behandle i batcher
    const batchSize = 2000
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize)
      
      for (const line of batch) {
        try {
          const columns = line.split(delimiter).map(col => col.trim().replace(/['"]/g, ''))
          
          if (columns.length !== header.length) {
            console.warn(`Row ${i}: Column count mismatch`)
            errorRows++
            continue
          }

          // Opprett rad-objekt
          const row: Record<string, string> = {}
          header.forEach((col, idx) => {
            row[col] = columns[idx] || ''
          })

          // Hent selskapsinfo (forutsetter kolonner som navn, orgnr, etc.)
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

          // Upsert selskap
          const { error: companyError } = await supabase
            .from('share_companies')
            .upsert({
              orgnr: companyOrgnr,
              name: companyName,
              year,
              user_id: user.id,
              total_shares: 0 // Oppdateres senere
            }, {
              onConflict: 'orgnr,year,user_id'
            })

          if (companyError) {
            console.error('Company upsert error:', companyError)
            errorRows++
            continue
          }

          // Upsert aksjonær/enhet
          const { data: entityData, error: entityError } = await supabase
            .from('share_entities')
            .upsert({
              entity_type: holderType,
              name: holderName,
              orgnr: holderOrgnr || null,
              user_id: user.id
            }, {
              onConflict: 'entity_key,user_id'
            })
            .select('id')
            .single()

          if (entityError) {
            console.error('Entity upsert error:', entityError)
            errorRows++
            continue
          }

          // Upsert aksjeinnehav
          const { error: holdingError } = await supabase
            .from('share_holdings')
            .upsert({
              company_orgnr: companyOrgnr,
              holder_id: entityData.id,
              share_class: shareClass,
              shares,
              year,
              user_id: user.id
            }, {
              onConflict: 'company_orgnr,holder_id,share_class,year,user_id'
            })

          if (holdingError) {
            console.error('Holding upsert error:', holdingError)
            errorRows++
            continue
          }

          processedRows++

        } catch (err) {
          console.error(`Error processing row ${i}:`, err)
          errorRows++
        }
      }

      // Vis fremgang
      console.log(`Processed batch ending at row ${Math.min(i + batchSize, lines.length)}`)
    }

    // Oppdater total_shares for alle selskaper
    const { error: updateError } = await supabase.rpc('update_total_shares_for_year', {
      target_year: year,
      target_user_id: user.id
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