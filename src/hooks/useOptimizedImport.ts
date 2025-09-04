import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ImportProgress {
  sessionId: string
  totalRows: number
  processedRows: number
  progress: number
  status: 'idle' | 'parsing' | 'uploading' | 'aggregating' | 'completed' | 'error' | 'paused'
  error?: string
  canResume: boolean
}

interface ImportOptions {
  year: number
  isGlobal?: boolean
  onProgress?: (progress: ImportProgress) => void
  onLog?: (message: string) => void
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

export function useOptimizedImport() {
  const [progress, setProgress] = useState<ImportProgress>({
    sessionId: '',
    totalRows: 0,
    processedRows: 0,
    progress: 0,
    status: 'idle',
    canResume: false
  })

  const addLog = useCallback((message: string) => {
    console.log(`[Import] ${message}`)
  }, [])

  const updateProgress = useCallback((updates: Partial<ImportProgress>, options?: ImportOptions) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...updates }
      options?.onProgress?.(newProgress)
      return newProgress
    })
  }, [])

  const startImport = useCallback(async (file: File, options: ImportOptions) => {
    try {
      addLog('Starter import...')
      options.onLog?.('Starter import...')
      updateProgress({ status: 'parsing', progress: 10 }, options)

      // Generate session ID
      const sessionId = `import-${Date.now()}-${Math.random().toString(36).substring(2)}`

      updateProgress({ 
        sessionId,
        status: 'parsing',
        progress: 20
      }, options)

      addLog(`Session startet: ${sessionId}`)
      options.onLog?.(`Session startet: ${sessionId}`)
      
      addLog('Leser og prosesserer filinnhold...')
      options.onLog?.('Leser og prosesserer filinnhold...')

      // Parse file content first
      let data: any[] = []
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        data = await parseCSVFile(file)
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        data = await parseExcelFile(file)
      } else {
        throw new Error('Støtter kun CSV og Excel filer')
      }

      if (data.length === 0) {
        throw new Error('Ingen data funnet i filen')
      }

      updateProgress({ 
        status: 'uploading', 
        progress: 40,
        totalRows: data.length
      }, options)
      addLog(`Sender ${data.length} rader til server for prosessering...`)
      options.onLog?.(`Sender ${data.length} rader til server for prosessering...`)

      // Send parsed data to working edge function
      const { data: result, error } = await supabase.functions.invoke('shareholders-simple-import', {
        body: {
          data: data,
          year: options.year,
          batchInfo: {
            current: 1,
            total: 1
          },
          sessionId
        }
      })

      if (error) {
        throw new Error(`Import failed: ${error.message}`)
      }

      updateProgress({ 
        status: 'completed', 
        progress: 100, 
        totalRows: result.imported || 0, 
        processedRows: result.imported || 0 
      }, options)
      
      addLog(`Import fullført! ${result.imported || 0} rader prosessert`)
      options.onLog?.(`Import fullført! ${result.imported || 0} rader prosessert`)
      
      options.onComplete?.(result)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Import feilet: ${errorMessage}`)
      options.onLog?.(`Import feilet: ${errorMessage}`)
      updateProgress({ status: 'error', error: errorMessage }, options)
      options.onError?.(errorMessage)
    }
  }, [addLog, updateProgress])

  // Helper functions for file parsing
  const parseCSVFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';', // Support for Skatteetaten CSV format
        complete: (results) => {
          try {
            const mapped = results.data.map((row: any) => mapRowToShareholderData(row))
            resolve(mapped.filter(row => row !== null))
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => reject(new Error(`CSV parsing error: ${error.message}`))
      })
    })
  }

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          // Use first row as headers instead of column letters (A, B, C)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use first row as headers
            defval: '' // Default value for empty cells
          })
          
          console.log('🔍 Excel parsing - first few rows:', jsonData.slice(0, 3))
          
          // Convert array format to object format with first row as headers
          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row')
          }
          
          const headers = jsonData[0] as string[]
          const dataRows = jsonData.slice(1)
          
          console.log('🔍 Excel headers:', headers)
          
          const objectData = dataRows.map((row: any[]) => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index] || ''
            })
            return obj
          })
          
          const mapped = objectData.map((row: any) => mapRowToShareholderData(row))
          resolve(mapped.filter(row => row !== null))
        } catch (error) {
          reject(new Error(`Excel parsing error: ${(error as Error).message}`))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const mapRowToShareholderData = (row: any): any | null => {
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

  const pauseImport = useCallback(() => {
    addLog('Pause ikke støttet i denne versjonen')
  }, [addLog])

  const resumeImport = useCallback(() => {
    addLog('Resume ikke støttet i denne versjonen')
  }, [addLog])

  const cancelImport = useCallback(() => {
    setProgress({
      sessionId: '',
      totalRows: 0,
      processedRows: 0,
      progress: 0,
      status: 'idle',
      canResume: false
    })
  }, [])

  const checkSession = useCallback(() => {
    // Simplified - no session to check since we process everything at once
    return false
  }, [])

  return {
    progress,
    startImport,
    pauseImport,
    resumeImport,
    cancelImport,
    checkSession
  }
}