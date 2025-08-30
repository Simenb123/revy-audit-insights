import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const XLSX = await import('https://esm.sh/xlsx@0.18.5')

// For CSV parsing with automatic delimiter detection
function parseCSV(csvContent: string): any[][] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Detect delimiter by checking the first line
  const firstLine = lines[0]
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const delimiter = semicolonCount > commaCount ? ';' : ','
  
  console.log(`🔍 Detected CSV delimiter: "${delimiter}" (semicolons: ${semicolonCount}, commas: ${commaCount})`)
  
  const result: any[][] = []
  
  for (const line of lines) {
    const row: any[] = []
    let currentField = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"' && !inQuotes) {
        inQuotes = true
      } else if (char === '"' && inQuotes) {
        inQuotes = false
      } else if (char === delimiter && !inQuotes) {
        row.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    
    // Add the last field
    row.push(currentField.trim())
    result.push(row)
  }
  
  return result
}

interface ImportSession {
  id: string
  year: number
  total_rows: number
  processed_rows: number
  error_rows: number
  status: 'active' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

interface ProcessedRow {
  orgnr: string
  company_name: string
  holder_name: string
  holder_orgnr?: string
  holder_birth_year?: number
  holder_country?: string
  share_class: string
  shares: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { sessionId, year, fileName, fileContent, fileSize, fileType } = await req.json()
    
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)
    console.log(`🚀 Starting optimized import: ${fileName} (${fileSizeMB}MB)`)
    console.log(`📊 Session: ${sessionId}, Year: ${year}, Type: ${fileType}`)

    // Get user ID from auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Create or update import session
    const { data: session, error: sessionError } = await supabase
      .from('import_sessions')
      .upsert({
        id: sessionId,
        year,
        status: 'active',
        total_rows: 0,
        processed_rows: 0,
        error_rows: 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`)
    }

    // Parse file content based on type
    let jsonData: any[][]
    
    if (fileType === 'csv') {
      console.log('📖 Parsing CSV file...')
      const base64Content = fileContent.split(',')[1]
      const csvContent = atob(base64Content)
      jsonData = parseCSV(csvContent)
    } else {
      console.log('📖 Parsing Excel file...')
      const buffer = Uint8Array.from(atob(fileContent.split(',')[1]), c => c.charCodeAt(0))
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
    }

    if (jsonData.length <= 1) {
      throw new Error('File appears to be empty or has no data rows')
    }

    const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim())
    const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))

    console.log(`📊 Found ${dataRows.length} data rows with headers: ${headers.join(', ')}`)

    // Update session with total rows
    await supabase
      .from('import_sessions')
      .update({
        total_rows: dataRows.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    // Process data in optimized batches
    const BATCH_SIZE = 8000 // Optimized for large files
    const DELAY_BETWEEN_BATCHES = 100 // Minimal delay
    let totalProcessed = 0
    let totalErrors = 0

    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, Math.min(i + BATCH_SIZE, dataRows.length))
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(dataRows.length / BATCH_SIZE)
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} rows)`)

      try {
        // Process batch with retry logic
        const { processed, errors } = await processBatchWithRetry(supabase, batch, headers, year, user.id, 3)
        
        totalProcessed += processed
        totalErrors += errors

        // Update session progress
        await supabase
          .from('import_sessions')
          .update({
            processed_rows: totalProcessed,
            error_rows: totalErrors,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)

        console.log(`✅ Batch ${batchNumber} completed: ${processed} processed, ${errors} errors`)

        // Small delay between batches
        if (i + BATCH_SIZE < dataRows.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }

      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} failed:`, batchError)
        totalErrors += batch.length
        
        await supabase
          .from('import_sessions')
          .update({
            error_rows: totalErrors,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
      }
    }

    // Finalize session
    console.log('🔧 Aggregating total shares...')
    await aggregateTotalShares(supabase, year, user.id)

    await supabase
      .from('import_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    const result = {
      success: true,
      sessionId,
      totalRows: dataRows.length,
      processedRows: totalProcessed,
      errorRows: totalErrors,
      skippedRows: 0
    }

    console.log(`🎉 Import completed: ${JSON.stringify(result)}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Optimized import failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processBatchWithRetry(
  supabase: any,
  batch: any[][],
  headers: string[],
  year: number,
  userId: string,
  maxRetries: number = 3
): Promise<{ processed: number; errors: number }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Processing batch (attempt ${attempt}/${maxRetries})`)
      
      const processedRows: ProcessedRow[] = []
      const companies = new Map<string, string>()
      const entities = new Map<string, any>()

      // Process each row in the batch
      for (const row of batch) {
        try {
          const processed = processRow(row, headers, year)
          if (processed) {
            processedRows.push(processed)
            companies.set(processed.orgnr, processed.company_name)
            
            // Add entity for holder
            const entityKey = processed.holder_orgnr || `person_${processed.holder_name}_${processed.holder_birth_year}`
            entities.set(entityKey, {
              entity_type: processed.holder_orgnr ? 'company' : 'person',
              name: processed.holder_name,
              orgnr: processed.holder_orgnr,
              birth_year: processed.holder_birth_year,
              country_code: processed.holder_country || 'NO',
              user_id: userId
            })
          }
        } catch (rowError) {
          console.warn(`Row processing error:`, rowError)
        }
      }

      if (processedRows.length === 0) {
        return { processed: 0, errors: batch.length }
      }

      // Insert data in transaction-like batches
      await insertCompanies(supabase, Array.from(companies.entries()), year, userId)
      await insertEntities(supabase, Array.from(entities.values()))
      await insertHoldings(supabase, processedRows, userId)

      return { processed: processedRows.length, errors: batch.length - processedRows.length }

    } catch (error) {
      console.error(`Batch attempt ${attempt} failed:`, error)
      if (attempt === maxRetries) {
        throw error
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  return { processed: 0, errors: batch.length }
}

function processRow(row: any[], headers: string[], year: number): ProcessedRow | null {
  const getValue = (colNames: string[]): string => {
    for (const name of colNames) {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase()))
      if (idx >= 0 && row[idx]) return String(row[idx]).trim()
    }
    return ''
  }

  // Updated to handle Norwegian column names from your CSV file
  const orgnr = getValue(['orgnr', 'organisasjonsnummer', 'org.nr'])
  const companyName = getValue(['selskap', 'selskapsnavn', 'navn', 'company'])
  const holderName = getValue(['navn aksjonær', 'aksjonær', 'eier', 'aksjeeier', 'deltaker', 'holder'])
  const shareClass = getValue(['aksjeklasse', 'klasse', 'class']) || 'A'
  const shares = parseInt(getValue(['antall aksjer', 'antall', 'aksjer', 'andeler', 'shares'])) || 0

  if (!orgnr || !companyName || !holderName || shares <= 0) {
    return null
  }

  // Extract holder details - handle the combined "Fødselsår/orgnr" column
  const birthYearOrOrgnr = getValue(['fødselsår/orgnr', 'fodselsaar/orgnr', 'birth_year', 'eier_orgnr'])
  let holderOrgnr: string | undefined
  let holderBirthYear: number | undefined
  let holderCountry = getValue(['landkode', 'land', 'country']) || 'NO'

  // Parse the birth year/orgnr field
  if (birthYearOrOrgnr) {
    const cleaned = birthYearOrOrgnr.replace(/\s/g, '')
    // If it's 9 digits, it's an organization number
    if (/^\d{9}$/.test(cleaned)) {
      holderOrgnr = cleaned
    } else {
      // Try to parse as birth year
      const parsed = parseInt(cleaned)
      if (parsed > 1900 && parsed < 2100) {
        holderBirthYear = parsed
      }
    }
  }

  return {
    orgnr: orgnr.replace(/\s/g, ''),
    company_name: companyName,
    holder_name: holderName,
    holder_orgnr: holderOrgnr,
    holder_birth_year: holderBirthYear,
    holder_country: holderCountry,
    share_class: shareClass,
    shares,
    year
  }
}

async function insertCompanies(supabase: any, companies: [string, string][], year: number, userId: string) {
  const companyData = companies.map(([orgnr, name]) => ({
    orgnr,
    name,
    year,
    total_shares: 0, // Will be calculated later
    user_id: userId
  }))

  const { error } = await supabase
    .from('share_companies')
    .upsert(companyData, { onConflict: 'orgnr,year,user_id' })

  if (error) {
    console.error('Company insert error:', error)
    throw error
  }
}

async function insertEntities(supabase: any, entities: any[]) {
  const { error } = await supabase
    .from('share_entities')
    .upsert(entities, { onConflict: 'entity_type,name,orgnr,user_id' })

  if (error) {
    console.error('Entity insert error:', error)
    throw error
  }
}

async function insertHoldings(supabase: any, holdings: ProcessedRow[], userId: string) {
  // Get entity IDs for holders
  const entityNames = holdings.map(h => h.holder_name)
  const { data: entities } = await supabase
    .from('share_entities')
    .select('id, name, orgnr')
    .in('name', entityNames)
    .eq('user_id', userId)

  const entityMap = new Map()
  entities?.forEach((e: any) => {
    const key = e.orgnr || e.name
    entityMap.set(key, e.id)
  })

  const holdingData = holdings.map(h => {
    const holderKey = h.holder_orgnr || h.holder_name
    const holderId = entityMap.get(holderKey)
    
    if (!holderId) {
      console.warn(`No entity found for holder: ${h.holder_name}`)
      return null
    }

    return {
      company_orgnr: h.orgnr,
      holder_id: holderId,
      share_class: h.share_class,
      shares: h.shares,
      year: h.year,
      user_id: userId
    }
  }).filter(Boolean)

  if (holdingData.length > 0) {
    const { error } = await supabase
      .from('share_holdings')
      .upsert(holdingData, { onConflict: 'company_orgnr,holder_id,share_class,year,user_id' })

    if (error) {
      console.error('Holdings insert error:', error)
      throw error
    }
  }
}

async function aggregateTotalShares(supabase: any, year: number, userId: string) {
  console.log('🔧 Starting total shares aggregation...')
  
  const { error } = await supabase.rpc('update_total_shares_for_year', {
    p_year: year,
    p_user_id: userId
  })

  if (error) {
    console.error('Aggregation error:', error)
    throw error
  }
  
  console.log('✅ Total shares aggregation completed')
}