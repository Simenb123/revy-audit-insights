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

    console.log(`Starting streaming import: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB), year: ${year}, mode: ${mode}, global: ${isGlobal}`)

    // Stream processing setup
    const stream = file.stream()
    const reader = stream.getReader()
    let buffer = ''
    let header: string[] = []
    let headerParsed = false
    let detectedEncoding = 'utf-8'
    let firstChunk = true
    
    // Read first chunk to detect encoding and parse header
    const { value: firstValue } = await reader.read()
    if (firstValue) {
      const firstBuffer = new Uint8Array(firstValue)
      detectedEncoding = encoding === 'AUTO' ? detectEncoding(firstBuffer) : encoding.toLowerCase()
      buffer = decodeCSV(firstBuffer, detectedEncoding)
      
      // Parse header from first chunk
      const firstNewline = buffer.indexOf('\n')
      if (firstNewline !== -1) {
        const headerLine = buffer.substring(0, firstNewline).trim()
        header = headerLine.split(delimiter).map(h => h.trim().replace(/['"]/g, ''))
        buffer = buffer.substring(firstNewline + 1)
        headerParsed = true
        console.log('CSV Header:', header)
      }
    }
    
    if (!headerParsed || header.length === 0) {
      throw new Error('Could not parse CSV header')
    }

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
    let totalEstimatedRows = Math.floor(file.size / 150) // Estimate ~150 bytes per row
    let currentRowIndex = 0

    // Streaming batch processing
    const batchSize = 250 // Reduced for memory efficiency
    const companiesToUpsert: any[] = []
    const entitiesToUpsert: any[] = []
    const holdingsToProcess: any[] = []
    
    // Process remaining chunks and buffer
    let done = false
    let streamDone = false
    
    // Helper function to process batches
    async function processBatch() {
      if (companiesToUpsert.length === 0) return
      
      console.log(`Processing batch: ${companiesToUpsert.length} rows | Total processed: ${processedRows}, skipped: ${skippedRows}, errors: ${errorRows}`)
      
      // Bulk upsert companies
      if (companiesToUpsert.length > 0) {
        const { error: companiesError } = await supabase
          .from('share_companies')
          .upsert([...companiesToUpsert], { onConflict: 'orgnr,year,user_id', ignoreDuplicates: false })

        if (companiesError) {
          console.error('Bulk companies upsert error:', companiesError)
          errorRows += companiesToUpsert.length
        }
      }

      // Bulk upsert entities
      if (entitiesToUpsert.length > 0) {
        const { error: entitiesError } = await supabase
          .from('share_entities')
          .upsert([...entitiesToUpsert], { onConflict: 'entity_type,name,orgnr,user_id', ignoreDuplicates: false })

        if (entitiesError) {
          console.error('Bulk entities upsert error:', entitiesError)
          errorRows += entitiesToUpsert.length
        }
      }

      // Process holdings (needs entity IDs)
      for (const holding of holdingsToProcess) {
        try {
          // Get entity ID
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
      
      // Clear batch arrays
      companiesToUpsert.length = 0
      entitiesToUpsert.length = 0
      holdingsToProcess.length = 0
    }
    
    while (!streamDone) {
      const { value, done: readerDone } = await reader.read()
      streamDone = readerDone
      
      if (value) {
        // Decode and append to buffer
        const chunk = decodeCSV(new Uint8Array(value), detectedEncoding)
        buffer += chunk
      }
      
      // Process complete lines from buffer
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex).trim()
        buffer = buffer.substring(newlineIndex + 1)
        
        if (!line) continue
        
        currentRowIndex++
        
        try {
          const columns = line.split(delimiter).map(col => col.trim().replace(/['"]/g, ''))
          
          if (columns.length !== header.length) {
            console.warn(`Row ${currentRowIndex}: Column count mismatch`)
            errorRows++
            continue
          }

          // Create row object
          const row: Record<string, string> = {}
          header.forEach((col, idx) => {
            row[col] = columns[idx] || ''
          })

          // Extract company info
          const companyName = row['Navn'] || row['Selskapsnavn'] || row['Company Name'] || ''
          const companyOrgnr = row['Orgnr'] || row['Organisasjonsnummer'] || row['OrgNr'] || ''
          
          if (!companyName || !companyOrgnr) {
            skippedRows++
            continue
          }

          // Filter by clients if necessary
          if (mode === 'clients-only' && !clientOrgNumbers.has(companyOrgnr)) {
            skippedRows++
            continue
          }

          // Extract shareholder info
          const holderName = row['Aksjonær'] || row['Eier'] || row['Holder'] || ''
          const holderOrgnr = row['EierOrgnr'] || row['HolderOrgnr'] || ''
          const shareClass = normalizeClassName(row['Aksjeklasse'] || row['ShareClass'] || '')
          const shares = parseInt(row['Aksjer'] || row['Shares'] || '0') || 0
          const holderType = holderOrgnr ? 'company' : 'person'

          if (!holderName || shares <= 0) {
            skippedRows++
            continue
          }

          // Collect data for batch operations
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
          console.error(`Error processing row ${currentRowIndex}:`, err)
          errorRows++
        }
        
        // Process batch when full
        if (companiesToUpsert.length >= batchSize) {
          await processBatch()
        }
      }
    }
    
    // Process any remaining buffer data (last line without newline)
    if (buffer.trim()) {
      const line = buffer.trim()
      currentRowIndex++
      
      try {
        const columns = line.split(delimiter).map(col => col.trim().replace(/['"]/g, ''))
        
        if (columns.length === header.length) {
          const row: Record<string, string> = {}
          header.forEach((col, idx) => {
            row[col] = columns[idx] || ''
          })

          const companyName = row['Navn'] || row['Selskapsnavn'] || row['Company Name'] || ''
          const companyOrgnr = row['Orgnr'] || row['Organisasjonsnummer'] || row['OrgNr'] || ''
          
          if (companyName && companyOrgnr) {
            if (mode !== 'clients-only' || clientOrgNumbers.has(companyOrgnr)) {
              const holderName = row['Aksjonær'] || row['Eier'] || row['Holder'] || ''
              const holderOrgnr = row['EierOrgnr'] || row['HolderOrgnr'] || ''
              const shareClass = normalizeClassName(row['Aksjeklasse'] || row['ShareClass'] || '')
              const shares = parseInt(row['Aksjer'] || row['Shares'] || '0') || 0
              const holderType = holderOrgnr ? 'company' : 'person'

              if (holderName && shares > 0) {
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
              } else {
                skippedRows++
              }
            } else {
              skippedRows++
            }
          } else {
            skippedRows++
          }
        } else {
          errorRows++
        }
      } catch (err) {
        console.error(`Error processing final row ${currentRowIndex}:`, err)
        errorRows++
      }
    }
    
    // Process any remaining data in final batch
    await processBatch()

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
      totalRows: currentRowIndex
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