import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

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
      const { 
        sessionId, 
        year, 
        fileName, 
        fileContent, 
        batchSize = 8000, 
        maxRetries = 3,
        delayBetweenBatches = 200,
        fileSize
      } = body

      console.log(`🚀 Starting bulk import: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`)
      console.log(`📊 Batch size: ${batchSize}, Max retries: ${maxRetries}`)

      try {
        // Decode base64 content
        const binaryString = atob(fileContent)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Parse Excel file
        const workbook = XLSX.read(bytes, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        console.log(`📋 Parsed ${jsonData.length} rows from Excel file`)

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
              const { data: batchResult, error: batchError } = await supabaseClient.functions.invoke('shareholders-bulk-import', {
                body: {
                  action: 'PROCESS_BATCH',
                  session_id: sessionId,
                  year: year,
                  batch_data: batchData,
                  is_global: false
                }
              })

              if (batchError) {
                throw new Error(`Batch processing error: ${batchError.message}`)
              }

              if (!batchResult?.success) {
                throw new Error(`Batch failed: ${JSON.stringify(batchResult)}`)
              }

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
                const retryDelay = delayBetweenBatches * Math.pow(2, retryCount - 1) // Exponential backoff
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

        // Start aggregation process
        console.log(`🔄 Starting aggregation for session ${sessionId}...`)
        
        const { data: aggregationResult, error: aggregationError } = await supabaseClient.functions.invoke('shareholders-batch-processor', {
          body: {
            action: 'FINISH_SESSION',
            session_id: sessionId,
            year: year,
            is_global: false
          }
        })

        if (aggregationError) {
          console.error('❌ Aggregation failed:', aggregationError)
          throw new Error(`Import finish failed: ${aggregationError.message}`)
        }

        if (!aggregationResult?.success) {
          console.error('❌ Aggregation returned non-success:', aggregationResult)
          throw new Error(`Import finish failed: ${JSON.stringify(aggregationResult)}`)
        }

        console.log(`🎉 Import completed successfully! Session: ${sessionId}`)

        return new Response(
          JSON.stringify({
            success: true,
            processedRows: totalProcessedRows,
            totalRows: jsonData.length,
            errors: totalErrors.slice(0, 50), // Limit error list to prevent response overflow
            summary: aggregationResult.summary,
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