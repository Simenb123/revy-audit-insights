import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

// CSV parsing with automatic delimiter detection and Norwegian column support
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Detect delimiter by checking the first line (remove outer quotes first if present)
  let firstLine = lines[0]
  if (firstLine.startsWith('"') && firstLine.endsWith('"')) {
    firstLine = firstLine.slice(1, -1)
  }
  
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const delimiter = semicolonCount > commaCount ? ';' : ','
  
  console.log(`🔍 Detected CSV delimiter: "${delimiter}" (semicolons: ${semicolonCount}, commas: ${commaCount})`)
  
  const result: any[] = []
  const headers = parseCSVLine(lines[0], delimiter)
  
  console.log(`📋 Parsed headers:`, headers)
  console.log(`📋 Total columns found: ${headers.length}`)
  
  // Create objects with column headers
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    result.push(row)
    
    // Log first data row for debugging
    if (i === 1) {
      console.log(`📋 First data row:`, values)
      console.log(`📋 Mapped first row:`, row)
    }
  }
  
  return result
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let currentField = ''
  let inQuotes = false
  
  // Remove outer quotes if the entire line is wrapped in quotes
  let processedLine = line.trim()
  if (processedLine.startsWith('"') && processedLine.endsWith('"')) {
    processedLine = processedLine.slice(1, -1)
  }
  
  for (let i = 0; i < processedLine.length; i++) {
    const char = processedLine[i]
    
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const body = await req.json()

      // Handle both old and new formats
      let sessionId, year, fileName, fileContent, batchSize, maxRetries, delayBetweenBatches, fileSize

      if (body.action === 'START_SESSION') {
        // Old format from OptimizedImportForm
        console.log('📥 Received old format request:', body)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This function expects file content to be uploaded. Please use the standard import form instead.',
            requiresFileContent: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // New format with actual file content
        sessionId = body.sessionId
        year = body.year
        fileName = body.fileName
        fileContent = body.fileContent
        batchSize = body.batchSize || 8000 // Increased to reduce API calls and rate limiting
        maxRetries = body.maxRetries || 3
        delayBetweenBatches = body.delayBetweenBatches || 2000 // Increased delay for rate limiting
        fileSize = body.fileSize
      }

        console.log(`🚀 Starting bulk import: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`)
        console.log(`📊 Batch size: ${batchSize}, Max retries: ${maxRetries}`)

        // Initialize session tracking in database
        const { error: sessionError } = await supabaseClient
          .from('import_sessions')
          .upsert({
            session_id: sessionId,
            user_id: user.id,
            year: year,
            total_file_rows: 0, // Will be updated after parsing
            processed_rows: 0,
            current_batch: 0,
            total_batches: 0,
            status: 'active',
            errors_count: 0,
            duplicates_count: 0,
            start_time: new Date().toISOString()
          }, {
            onConflict: 'session_id,user_id'
          })

        if (sessionError) {
          console.warn('⚠️ Could not initialize session tracking:', sessionError)
        }

      try {
        let jsonData: any[] = []
        
        // Validate that we have file content
        if (!fileContent) {
          throw new Error('No file content provided')
        }
        
        if (fileName.toLowerCase().endsWith('.csv')) {
          // CSV files are sent as plain text, use directly
          console.log('📋 Processing CSV file as plain text')
          jsonData = parseCSV(fileContent)
          console.log(`📋 Parsed ${jsonData.length} rows from CSV file`)
        } else {
          // Excel files are sent as base64 data URLs, need to decode
          console.log('📋 Processing Excel file, decoding base64...')
          
          let actualFileContent = fileContent
          if (fileContent.startsWith('data:')) {
            // Extract base64 content from data URL
            actualFileContent = fileContent.split(',')[1]
          }
          
          // Decode base64 content for Excel files
          const binaryString = atob(actualFileContent)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          const workbook = XLSX.read(bytes, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          jsonData = XLSX.utils.sheet_to_json(worksheet)
          console.log(`📋 Parsed ${jsonData.length} rows from Excel file`)
        }

        if (jsonData.length === 0) {
          throw new Error('No data found in Excel file')
        }

        let totalProcessedRows = 0
        let totalErrors: string[] = []

        // Process data in optimized batches for large files
        const totalBatches = Math.ceil(jsonData.length / batchSize)
        console.log(`📦 Processing ${totalBatches} batches of ${batchSize} rows each`)

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIndex = batchIndex * batchSize
          const endIndex = Math.min(startIndex + batchSize, jsonData.length)
          const batchData = jsonData.slice(startIndex, endIndex)
          
          console.log(`🔄 Processing batch ${batchIndex + 1}/${totalBatches} (rows ${startIndex + 1}-${endIndex})`)

          let retryCount = 0
          let batchSuccess = false
          
          while (retryCount < maxRetries && !batchSuccess) {
            try {
              // Process batch directly instead of calling external function
              const batchResult = await processBatchDirect(supabaseClient, batchData, year, user.id)
              
              totalProcessedRows += batchResult.processed_rows || 0
              if (batchResult.errors && batchResult.errors.length > 0) {
                totalErrors.push(...batchResult.errors)
              }
              
              console.log(`✅ Batch ${batchIndex + 1} completed: ${batchResult.processed_rows} rows processed`)
              batchSuccess = true

            } catch (batchError) {
              retryCount++
              console.error(`❌ Batch ${batchIndex + 1} attempt ${retryCount} failed:`, batchError)
              
              if (retryCount < maxRetries) {
                const retryDelay = delayBetweenBatches * Math.pow(2, retryCount - 1)
                console.log(`⏳ Retrying batch ${batchIndex + 1} in ${retryDelay}ms...`)
                await new Promise(resolve => setTimeout(resolve, retryDelay))
              } else {
                console.error(`💥 Batch ${batchIndex + 1} failed after ${maxRetries} attempts`)
                totalErrors.push(`Batch ${batchIndex + 1} failed: ${batchError.message}`)
              }
            }
          }

          // Small delay between successful batches to prevent overload
          if (batchSuccess && batchIndex < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
          }
        }

        console.log(`📊 File processing complete: ${totalProcessedRows} rows processed, ${totalErrors.length} errors`)

        // Start aggregation process directly
        console.log(`🔄 Starting aggregation for session ${sessionId}...`)
        
        const aggregationResult = await performAggregationDirect(supabaseClient, year, user.id)

        console.log(`🎉 Import completed successfully! Session: ${sessionId}`)

        return new Response(
          JSON.stringify({
            success: true,
            processedRows: totalProcessedRows,
            totalRows: jsonData.length,
            errors: totalErrors.slice(0, 50), // Limit error list to prevent response overflow
            summary: aggregationResult,
            sessionId: sessionId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error('💥 Excel processing failed:', error)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Excel processing failed: ${error.message}`,
            sessionId: sessionId
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in shareholders-bulk-import:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Direct batch processing function (consolidated from shareholders-batch-processor)
async function processBatchDirect(supabaseClient: any, batchData: any[], year: number, userId: string) {
  let processedRows = 0
  let errors: string[] = []

  // Process each row in the batch with optimized upserts
  for (const row of batchData) {
    try {
      // Skip empty rows
      if (!row || Object.keys(row).length === 0) {
        continue
      }

      // Extract and validate required fields - optimized for Norwegian CSV format
      const orgnr = String(
        row.Orgnr || row.orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || 
        row.org_nr || row['org-nr'] || ''
      ).trim().replace(/\D/g, '') // Remove non-digits
      
      const selskap = String(
        row.Selskap || row.selskap || row.selskapsnavn || row.navn || row.company_name || ''
      ).trim()
      
      const eierNavn = String(
        row['Navn aksjonær'] || row['navn aksjonær'] || row.navn_aksjonaer || 
        row.aksjonaer || row.eier || row.holder || row.eier_navn || ''
      ).trim()
      
      const sharesStr = String(
        row['Antall aksjer'] || row['antall aksjer'] || row.antall_aksjer || 
        row.aksjer || row.shares || row.andeler || '0'
      ).replace(/[^\d]/g, '')
      const shares = parseInt(sharesStr) || 0

      // Very lenient validation - support both 8 and 9 digit org numbers
      let normalizedOrgnr = orgnr
      if (normalizedOrgnr.length === 8) {
        normalizedOrgnr = '0' + normalizedOrgnr // Pad with leading zero
      }
      
      if (!normalizedOrgnr || (normalizedOrgnr.length !== 9 && normalizedOrgnr.length !== 8)) {
        errors.push(`Ugyldig organisasjonsnummer: ${orgnr} (må være 8-9 siffer)`)
        continue
      }
      
      if (!selskap && !eierNavn) {
        errors.push(`Mangler både selskapsnavn og eiernavn for orgnr: ${normalizedOrgnr}`)
        continue
      }
      
      // Use normalized org number and provide fallback names
      const companyName = selskap || `Ukjent selskap (${normalizedOrgnr})`
      const holderName = eierNavn || `Ukjent eier`

      // Upsert company with normalized org number
      const { error: companyError } = await supabaseClient
        .from('share_companies')
        .upsert({
          orgnr: normalizedOrgnr,
          name: companyName,
          year: year,
          user_id: userId,
          total_shares: 0 // Will be calculated later
        }, {
          onConflict: 'orgnr,year,user_id',
          ignoreDuplicates: false
        })

      if (companyError) {
        console.error('Company upsert error:', companyError)
        errors.push(`Feil ved lagring av selskap ${selskap}: ${companyError.message}`)
        continue
      }

      // Enhanced entity type detection - handle Norwegian CSV format  
      const holderOrgNr = String(
        row['Fødselsår/orgnr'] || row['fødselsår/orgnr'] || row.fodselsar_orgnr || 
        row.eier_orgnr || row.holder_orgnr || ''
      ).trim().replace(/\D/g, '')
      
      const entityType = (holderOrgNr.length === 9 && /^\d+$/.test(holderOrgNr)) ? 'company' : 'person'
      
      // Upsert entity (holder) with better conflict resolution
      const entityData: any = {
        entity_type: entityType,
        name: holderName,
        user_id: userId
      }

      if (entityType === 'company' && holderOrgNr) {
        entityData.orgnr = holderOrgNr
      } else {
        // For persons, try to extract birth year from various sources
        const birthYearSources = [
          row.fodselsar_orgnr, row.eier_orgnr, row.birth_year, 
          holderName.match(/\b(19\d{2}|20\d{2})\b/)?.[1]
        ]
        
        for (const source of birthYearSources) {
          if (source) {
            const year = parseInt(String(source).replace(/\D/g, ''))
            if (year >= 1900 && year <= new Date().getFullYear()) {
              entityData.birth_year = year
              break
            }
          }
        }
        
        entityData.country_code = String(
          row.Landkode || row.landkode || row.country_code || 'NO'
        ).trim().toUpperCase() || 'NO'
      }

      // First try to find existing entity
      let entityResult
      if (entityType === 'company' && holderOrgNr) {
        const { data: existing } = await supabaseClient
          .from('share_entities')
          .select('id')
          .eq('orgnr', holderOrgNr)
          .eq('user_id', userId)
          .maybeSingle()
        
        if (existing) {
          entityResult = existing
        } else {
          const { data: inserted, error: entityError } = await supabaseClient
            .from('share_entities')
            .insert(entityData)
            .select('id')
            .single()
          
          if (entityError) {
            console.error('Entity insert error:', entityError)
            errors.push(`Failed to insert entity ${holderName}: ${entityError.message}`)
            continue
          }
          entityResult = inserted
        }
      } else {
        // For persons, try to find by name, birth year, country
        const birthYear = entityData.birth_year
        const countryCode = entityData.country_code
        
        const { data: existing } = await supabaseClient
          .from('share_entities')
          .select('id')
          .eq('name', holderName)
          .eq('birth_year', birthYear)
          .eq('country_code', countryCode)
          .eq('user_id', userId)
          .eq('entity_type', 'person')
          .maybeSingle()
        
        if (existing) {
          entityResult = existing
        } else {
          const { data: inserted, error: entityError } = await supabaseClient
            .from('share_entities')
            .insert(entityData)
            .select('id')
            .single()
          
          if (entityError) {
            console.error('Entity insert error:', entityError)
            errors.push(`Failed to insert entity ${holderName}: ${entityError.message}`)
            continue
          }
          entityResult = inserted
        }
      }

      if (!entityResult?.id) {
        errors.push(`Kunne ikke få entity ID for ${holderName}`)
        continue
      }

      // Insert holding record with better share class handling
      const shareClass = String(
        row.aksjeklasse || row.Aksjeklasse || row.share_class || 'Ordinære'
      ).trim() || 'Ordinære'
      
      const holdingData = {
        company_orgnr: normalizedOrgnr, // Use normalized org number
        holder_id: entityResult.id,
        share_class: shareClass,
        shares: shares,
        year: year,
        user_id: userId
      }
      
      // For holdings, check if it exists first too
      const { data: existingHolding } = await supabaseClient
        .from('share_holdings')
        .select('id')
        .eq('company_orgnr', normalizedOrgnr)
        .eq('holder_id', entityResult.id)
        .eq('share_class', shareClass)
        .eq('year', year)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (existingHolding) {
        // Update existing holding
        const { error: holdingError } = await supabaseClient
          .from('share_holdings')
          .update({ shares: shares })
          .eq('id', existingHolding.id)
          
        if (holdingError) {
          console.error('Holding update error:', holdingError)
          errors.push(`Feil ved oppdatering av eierskap for ${holderName}: ${holdingError.message}`)
          continue
        }
      } else {
        // Insert new holding
        const { error: holdingError } = await supabaseClient
          .from('share_holdings')
          .insert(holdingData)
        
        if (holdingError) {
          console.error('Holding insert error:', holdingError)
          errors.push(`Feil ved lagring av eierskap for ${holderName}: ${holdingError.message}`)
          continue
        }
      }

      processedRows++

    } catch (rowError) {
      console.error('Error processing row:', rowError)
      errors.push(`Feil ved prosessering av rad: ${rowError.message}`)
    }
  }

  console.log(`Batch processed: ${processedRows} successful, ${errors.length} errors`)

  return {
    success: true,
    processed_rows: processedRows,
    total_rows: batchData.length,
    errors: errors
  }
}

// Direct aggregation function (consolidated from shareholders-batch-processor)
async function performAggregationDirect(supabaseClient: any, year: number, userId: string) {
  console.log(`Starting direct aggregation for year ${year}, userId: ${userId}`)
  
  try {
    // Use optimized batch processing for large datasets to avoid timeouts
    console.log('Starting optimized batch aggregation...')
    let offset = 0
    let hasMore = true
    let totalProcessed = 0
    const batchSize = 1000 // Smaller batches to avoid timeout
    
    while (hasMore) {
      console.log(`Processing aggregation batch at offset ${offset}...`)
      
      const { data: batchResult, error: batchError } = await supabaseClient.rpc('update_total_shares_batch_optimized', {
        p_year: year,
        p_user_id: userId,
        p_batch_size: batchSize,
        p_offset: offset,
        p_max_execution_time_seconds: 60 // Conservative timeout
      })

      if (batchError) {
        console.error('Batch aggregation error:', batchError)
        throw new Error(`Batch aggregation failed: ${batchError.message}`)
      }

      totalProcessed += batchResult.processed_count
      offset = batchResult.next_offset
      hasMore = batchResult.has_more

      console.log(`Batch completed: ${batchResult.processed_count} processed, ${totalProcessed} total, hasMore: ${hasMore}`)
      
      // Small delay between batches to prevent overload
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    console.log(`Aggregation completed successfully: ${totalProcessed} companies processed`)

    // Get final counts for summary
    const [companiesResult, holdingsResult, entitiesResult] = await Promise.all([
      supabaseClient
        .from('share_companies')
        .select('*', { count: 'exact', head: true })
        .eq('year', year)
        .eq('user_id', userId),
      supabaseClient
        .from('share_holdings')
        .select('*', { count: 'exact', head: true })
        .eq('year', year)
        .eq('user_id', userId),
      supabaseClient
        .from('share_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ])

    const summary = {
      companies: companiesResult.count || 0,
      holdings: holdingsResult.count || 0,
      entities: entitiesResult.count || 0,
      year: year
    }

    console.log(`Summary: ${summary.companies} companies, ${summary.holdings} holdings`)
    return summary

  } catch (error) {
    console.error('Error in direct aggregation:', error)
    throw error
  }
}