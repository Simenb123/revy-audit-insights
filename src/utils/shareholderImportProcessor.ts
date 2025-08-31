import { supabase } from '@/integrations/supabase/client'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// Optimized constants for rate limiting
const OPTIMIZED_BATCH_SIZE = 8000 // Much larger batches to reduce API calls
const RATE_LIMIT_DELAY = 2500 // 2.5 second delay between batches
const MAX_RETRIES = 3

interface ShareholderRow {
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

interface ProgressCallback {
  onProgress?: (current: number, total: number, message: string) => void
  onBatchComplete?: (batchNumber: number, totalBatches: number, batchResults: any) => void
  onComplete?: (results: any) => void
  onError?: (error: string) => void
}

export async function processShareholderFile(
  file: File, 
  year: number,
  callbacks: ProgressCallback = {}
) {
  const { onProgress, onBatchComplete, onComplete, onError } = callbacks

  try {
    onProgress?.(0, 100, 'Starter prosessering av fil...')
    
    // Parse file based on type
    let data: ShareholderRow[] = []
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      data = await parseCSVFile(file)
    } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
      data = await parseExcelFile(file)
    } else {
      throw new Error('Filtype ikke støttet. Bruk CSV eller Excel.')
    }

    if (data.length === 0) {
      throw new Error('Ingen data funnet i filen')
    }

    onProgress?.(10, 100, `Fant ${data.length} rader. Starter import...`)

    // Check for rate limiting risk
    const totalBatches = Math.ceil(data.length / OPTIMIZED_BATCH_SIZE)
    const estimatedAPICallsPerBatch = 3 // companies, entities, holdings
    const totalEstimatedAPICalls = totalBatches * estimatedAPICallsPerBatch
    
    if (totalEstimatedAPICalls > 90) { // Conservative limit (100 per hour)
      const estimatedTimeMinutes = Math.ceil((totalBatches * RATE_LIMIT_DELAY) / (1000 * 60))
      onProgress?.(10, 100, 
        `⚠️ Stor fil detektert! Import vil ta ca. ${estimatedTimeMinutes} minutter pga. rate limiting. ${totalBatches} batch(es) å prosessere.`
      )
      
      // Give user a moment to see the warning
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    let totalImported = 0
    let totalErrors = 0
    const sessionId = `shareholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Process in optimized batches
    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * OPTIMIZED_BATCH_SIZE
      const batchEnd = Math.min(batchStart + OPTIMIZED_BATCH_SIZE, data.length)
      const batchData = data.slice(batchStart, batchEnd)
      
      const batchInfo = {
        current: i + 1,
        total: totalBatches
      }

      onProgress?.(
        10 + (i / totalBatches) * 80, 
        100, 
        `Prosesserer batch ${i + 1}/${totalBatches} (rader ${batchStart + 1}-${batchEnd})`
      )

      let retries = 0
      let batchSuccess = false
      
      while (retries < MAX_RETRIES && !batchSuccess) {
        try {
          const { data: result, error } = await supabase.functions.invoke(
            'shareholders-simple-import',
            {
              body: {
                data: batchData,
                year,
                batchInfo,
                sessionId
              }
            }
          )

          if (error) {
            throw new Error(error.message)
          }

          totalImported += result.imported || 0
          totalErrors += result.errors || 0
          batchSuccess = true

          onBatchComplete?.(i + 1, totalBatches, result)

          // Progress update
          const progressPercent = 10 + ((i + 1) / totalBatches) * 80
          onProgress?.(
            progressPercent,
            100,
            `Batch ${i + 1}/${totalBatches} fullført. ${result.imported} importert, ${result.errors} feil.`
          )

        } catch (error: any) {
          retries++
          console.error(`Batch ${i + 1} attempt ${retries} failed:`, error)
          
          if (retries < MAX_RETRIES) {
            const retryDelay = RATE_LIMIT_DELAY * Math.pow(2, retries - 1)
            onProgress?.(
              10 + (i / totalBatches) * 80,
              100,
              `Batch ${i + 1} feilet. Prøver igjen om ${Math.round(retryDelay/1000)} sekunder... (forsøk ${retries}/${MAX_RETRIES})`
            )
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          } else {
            // Skip this batch after max retries
            totalErrors += batchData.length
            onProgress?.(
              10 + ((i + 1) / totalBatches) * 80,
              100,
              `⚠️ Batch ${i + 1} hoppet over etter ${MAX_RETRIES} forsøk`
            )
            batchSuccess = true // Continue with next batch
          }
        }
      }

      // Rate limiting delay between successful batches
      if (batchSuccess && i < totalBatches - 1) {
        onProgress?.(
          10 + ((i + 1) / totalBatches) * 80,
          100,
          `⏳ Venter ${RATE_LIMIT_DELAY/1000} sekunder (rate limiting)...`
        )
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
      }
    }

    onProgress?.(95, 100, 'Fullfører import...')

    const results = {
      totalRows: data.length,
      imported: totalImported,
      errors: totalErrors,
      batchesProcessed: totalBatches,
      sessionId
    }

    onProgress?.(100, 100, `Import fullført! ${totalImported} rader importert, ${totalErrors} feil.`)
    onComplete?.(results)

    return results

  } catch (error: any) {
    console.error('Shareholder import failed:', error)
    onError?.(error.message)
    throw error
  }
}

async function parseCSVFile(file: File): Promise<ShareholderRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const mapped = results.data.map((row: any) => mapRowToShareholderData(row))
          resolve(mapped.filter(row => row !== null) as ShareholderRow[])
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => reject(new Error(`CSV parsing error: ${error.message}`))
    })
  })
}

async function parseExcelFile(file: File): Promise<ShareholderRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        const mapped = jsonData.map((row: any) => mapRowToShareholderData(row))
        resolve(mapped.filter(row => row !== null) as ShareholderRow[])
      } catch (error) {
        reject(new Error(`Excel parsing error: ${(error as Error).message}`))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function mapRowToShareholderData(row: any): ShareholderRow | null {
  try {
    // Extract company org number - support various formats
    const orgNrRaw = String(
      row.Orgnr || row.orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || 
      row.org_nr || row['org-nr'] || row['"Orgnr'] || ''
    ).trim().replace(/[^\d]/g, '')
    
    // Normalize org number
    let company_orgnr = orgNrRaw
    if (company_orgnr.length === 8) {
      company_orgnr = '0' + company_orgnr
    }
    
    if (!company_orgnr || (company_orgnr.length !== 9 && company_orgnr.length !== 8)) {
      console.warn(`Invalid org number: ${orgNrRaw}`)
      return null
    }

    const company_name = String(
      row.Selskap || row.selskap || row.selskapsnavn || row.navn || row.company_name || ''
    ).trim()

    const holder_name = String(
      row['Navn aksjonær'] || row['navn aksjonær'] || row.navn_aksjonaer || 
      row.aksjonaer || row.eier || row.holder || row.eier_navn || ''
    ).trim()

    if (!company_name && !holder_name) {
      console.warn('Missing both company name and holder name')
      return null
    }

    // Parse share amount
    const sharesStr = String(
      row['Antall aksjer'] || row['antall aksjer'] || row.antall_aksjer || 
      row.aksjer || row.shares || row.andeler || '0'
    ).replace(/[^\d]/g, '')
    
    const shares = parseInt(sharesStr) || 0

    // Extract holder details
    const holder_orgnr_raw = String(
      row['Fødselsår/orgnr'] || row['fødselsår/orgnr'] || row.fodselsar_orgnr || 
      row.eier_orgnr || row.holder_orgnr || ''
    ).trim().replace(/[^\d]/g, '')

    let holder_orgnr: string | undefined
    let holder_birth_year: number | undefined

    if (holder_orgnr_raw.length === 9) {
      holder_orgnr = holder_orgnr_raw
    } else if (holder_orgnr_raw.length === 4 && parseInt(holder_orgnr_raw) >= 1900) {
      holder_birth_year = parseInt(holder_orgnr_raw)
    }

    const holder_country = String(
      row.Landkode || row.landkode || row.country_code || 'NO'
    ).trim().toUpperCase() || 'NO'

    const share_class = String(
      row.Aksjeklasse || row.aksjeklasse || row.share_class || 'Ordinære aksjer'
    ).trim() || 'Ordinære aksjer'

    return {
      company_orgnr,
      company_name: company_name || `Ukjent selskap (${company_orgnr})`,
      holder_name: holder_name || 'Ukjent eier',
      holder_orgnr,
      holder_birth_year,
      holder_country,
      share_class,
      shares,
      raw_row: row
    }

  } catch (error) {
    console.error('Error mapping row:', error, row)
    return null
  }
}