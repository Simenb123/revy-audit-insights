import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { fileName, fileContent, fileSize, year } = await req.json()

    console.log(`🚀 Starting unified import: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB) for year ${year}`)

    // Parse file content
    let jsonData: any[] = []
    
    if (fileName.toLowerCase().endsWith('.csv')) {
      console.log('📋 Processing CSV file...')
      const base64Content = fileContent.split(',')[1]
      const csvContent = atob(base64Content)
      jsonData = parseCSV(csvContent)
    } else {
      console.log('📋 Processing Excel file...')
      const buffer = Uint8Array.from(atob(fileContent.split(',')[1]), c => c.charCodeAt(0))
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      jsonData = XLSX.utils.sheet_to_json(firstSheet)
    }

    if (jsonData.length === 0) {
      throw new Error('Ingen data funnet i filen')
    }

    console.log(`📊 Found ${jsonData.length} rows to process`)

    // For large files (>50MB), use background processing
    if (fileSize > 50 * 1024 * 1024) {
      return await processLargeFile(supabaseClient, jsonData, year, user.id, fileName)
    } else {
      return await processSmallFile(supabaseClient, jsonData, year, user.id, fileName)
    }

  } catch (error) {
    console.error('💥 Import failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error).message || 'Import feilet'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Detect delimiter
  const firstLine = lines[0]
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const delimiter = semicolonCount > commaCount ? ';' : ','
  
  const result: any[] = []
  const headers = parseCSVLine(lines[0], delimiter)
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    result.push(row)
  }
  
  return result
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let currentField = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      inQuotes = false
    } else if (char === delimiter && !inQuotes) {
      result.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }
  }
  
  result.push(currentField.trim())
  return result
}

async function processSmallFile(
  supabaseClient: any,
  jsonData: any[],
  year: number,
  userId: string,
  fileName: string
) {
  console.log('📦 Processing small file directly...')
  
  let processedRows = 0
  let errors: string[] = []

  // Process in optimized batches
  const BATCH_SIZE = 1000
  
  for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
    const batch = jsonData.slice(i, Math.min(i + BATCH_SIZE, jsonData.length))
    
    const { processed, batchErrors } = await processBatch(supabaseClient, batch, year, userId)
    processedRows += processed
    errors.push(...batchErrors)
  }

  // Aggregate total shares
  await aggregateTotalShares(supabaseClient, year, userId)

  console.log(`✅ Small file processed: ${processedRows} rows, ${errors.length} errors`)

  return new Response(
    JSON.stringify({
      success: true,
      processedRows,
      totalRows: jsonData.length,
      errors: errors.slice(0, 10) // Limit errors in response
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processLargeFile(
  supabaseClient: any,
  jsonData: any[],
  year: number,
  userId: string,
  fileName: string
) {
  const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`📦 Processing large file with session: ${sessionId}`)

  // Create import session
  await supabaseClient
    .from('import_sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      year,
      total_rows: jsonData.length,
      processed_rows: 0,
      status: 'processing',
      file_name: fileName
    })

  // Process in background using EdgeRuntime.waitUntil
  const backgroundTask = async () => {
    try {
      let processedRows = 0
      const BATCH_SIZE = 2000

      for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
        const batch = jsonData.slice(i, Math.min(i + BATCH_SIZE, jsonData.length))
        
        const { processed } = await processBatch(supabaseClient, batch, year, userId)
        processedRows += processed

        // Update session progress
        await supabaseClient
          .from('import_sessions')
          .update({
            processed_rows: processedRows,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Aggregate total shares
      await aggregateTotalShares(supabaseClient, year, userId)

      // Mark session as completed
      await supabaseClient
        .from('import_sessions')
        .update({
          status: 'completed',
          processed_rows: processedRows,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      console.log(`✅ Background processing completed: ${processedRows} rows`)

    } catch (error) {
      console.error('💥 Background processing failed:', error)
      
      await supabaseClient
        .from('import_sessions')
        .update({
          status: 'error',
          error_message: (error as Error).message,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }
  }

  // Start background processing
  backgroundTask()

  return new Response(
    JSON.stringify({
      success: true,
      sessionId,
      totalRows: jsonData.length,
      message: 'Import startet i bakgrunnen'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processBatch(
  supabaseClient: any,
  batch: any[],
  year: number,
  userId: string
): Promise<{ processed: number; batchErrors: string[] }> {
  
  const processedRows: ProcessedRow[] = []
  const companies = new Map<string, string>()
  const entities = new Map<string, any>()
  const batchErrors: string[] = []

  // Process each row in the batch
  for (const row of batch) {
    try {
      const processed = processRow(row, year)
      if (processed) {
        processedRows.push(processed)
        companies.set(processed.orgnr, processed.company_name)
        
        // Add entity for holder
        const entityKey = processed.holder_orgnr || `person_${processed.holder_name}_${processed.holder_birth_year || 'unknown'}`
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
      batchErrors.push(`Row error: ${(rowError as Error).message}`)
    }
  }

  if (processedRows.length === 0) {
    return { processed: 0, batchErrors }
  }

  try {
    // Insert data in optimized batches
    await insertCompanies(supabaseClient, Array.from(companies.entries()), year, userId)
    await insertEntities(supabaseClient, Array.from(entities.values()))
    await insertHoldings(supabaseClient, processedRows, year, userId)

    return { processed: processedRows.length, batchErrors }

  } catch (error) {
    console.error('Batch insert error:', error)
    batchErrors.push(`Batch insert failed: ${(error as Error).message}`)
    return { processed: processedRows.length, batchErrors }
  }
}

function processRow(row: any, year: number): ProcessedRow | null {
  // Flexible field mapping for Norwegian CSV files
  const getValue = (fields: string[]): string => {
    for (const field of fields) {
      const value = row[field]
      if (value !== undefined && value !== null && value !== '') {
        return String(value).trim()
      }
    }
    return ''
  }

  const orgnr = getValue([
    'orgnr', 'Orgnr', 'organisasjonsnummer', 'Organisasjonsnummer', 'org_nr', 'A'
  ]).replace(/\D/g, '') // Remove non-digits

  const companyName = getValue([
    'selskap', 'Selskap', 'navn', 'selskapsnavn', 'company_name', 'B'
  ])

  const holderName = getValue([
    'navn aksjonær', 'Navn aksjonær', 'aksjonær', 'eier', 'holder', 'navn_aksjonaer', 'D'
  ])

  const shareClass = getValue([
    'aksjeklasse', 'Aksjeklasse', 'share_class', 'C'
  ]) || 'A'

  const sharesStr = getValue([
    'antall aksjer', 'Antall aksjer', 'aksjer', 'shares', 'antall_aksjer', 'H'
  ]).replace(/[^\d]/g, '') // Remove non-digits

  const shares = parseInt(sharesStr) || 0

  // Validate required fields
  if (!orgnr || orgnr.length < 8 || !companyName || !holderName || shares <= 0) {
    return null
  }

  // Normalize org number (pad with leading zero if 8 digits)
  const normalizedOrgnr = orgnr.length === 8 ? '0' + orgnr : orgnr

  // Extract holder details
  const birthYearOrOrgnr = getValue([
    'fødselsår/orgnr', 'Fødselsår/orgnr', 'birth_year', 'eier_orgnr', 'E'
  ]).replace(/\s/g, '')

  let holderOrgnr: string | undefined
  let holderBirthYear: number | undefined
  const holderCountry = getValue(['landkode', 'Landkode', 'country_code', 'G']) || 'NO'

  // Parse birth year/org number field
  if (birthYearOrOrgnr) {
    if (/^\d{9}$/.test(birthYearOrOrgnr)) {
      holderOrgnr = birthYearOrOrgnr
    } else {
      const parsed = parseInt(birthYearOrOrgnr)
      if (parsed > 1900 && parsed < 2100) {
        holderBirthYear = parsed
      }
    }
  }

  return {
    orgnr: normalizedOrgnr,
    company_name: companyName,
    holder_name: holderName,
    holder_orgnr: holderOrgnr,
    holder_birth_year: holderBirthYear,
    holder_country: holderCountry,
    share_class: shareClass,
    shares
  }
}

async function insertCompanies(supabaseClient: any, companies: [string, string][], year: number, userId: string) {
  const companyData = companies.map(([orgnr, name]) => ({
    orgnr,
    name,
    year,
    total_shares: 0,
    user_id: userId
  }))

  const { error } = await supabaseClient
    .from('share_companies')
    .upsert(companyData, { onConflict: 'orgnr,year,user_id' })

  if (error) {
    console.error('Company insert error:', error)
    throw error
  }
}

async function insertEntities(supabaseClient: any, entities: any[]) {
  const { error } = await supabaseClient
    .from('share_entities')
    .upsert(entities, { onConflict: 'entity_type,name,orgnr,user_id' })

  if (error) {
    console.error('Entity insert error:', error)
    throw error
  }
}

async function insertHoldings(supabaseClient: any, holdings: ProcessedRow[], year: number, userId: string) {
  // Get entity IDs for holders
  const entityNames = holdings.map(h => h.holder_name)
  const { data: entities } = await supabaseClient
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
      year: year,
      user_id: userId
    }
  }).filter(Boolean)

  if (holdingData.length > 0) {
    const { error } = await supabaseClient
      .from('share_holdings')
      .upsert(holdingData, { onConflict: 'company_orgnr,holder_id,share_class,year,user_id' })

    if (error) {
      console.error('Holdings insert error:', error)
      throw error
    }
  }
}

async function aggregateTotalShares(supabaseClient: any, year: number, userId: string) {
  console.log('🔧 Aggregating total shares...')
  
  const { error } = await supabaseClient.rpc('update_total_shares_for_year', {
    p_year: year,
    p_user_id: userId
  })

  if (error) {
    console.error('Aggregation error:', error)
    throw error
  }
  
  console.log('✅ Total shares aggregation completed')
}