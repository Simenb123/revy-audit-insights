import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface FileStatus {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  rows?: number
  error?: string
  progress?: number
}

interface ImportState {
  status: 'idle' | 'processing' | 'completed' | 'error'
  currentFileIndex: number
  totalFiles: number
  currentFile: string
  overallProgress: number
  totalProcessedRows: number
  error?: string
  fileStatuses: FileStatus[]
  sessionId?: string
}

export const useSequentialImport = () => {
  const [state, setState] = useState<ImportState>({
    status: 'idle',
    currentFileIndex: 0,
    totalFiles: 0,
    currentFile: '',
    overallProgress: 0,
    totalProcessedRows: 0,
    fileStatuses: []
  })

  const processFiles = async (files: File[], year: number) => {
    if (files.length === 0) return

    const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Initialize state
    const initialFileStatuses = files.map(file => ({
      name: file.name,
      status: 'pending' as const,
      progress: 0
    }))

    setState({
      status: 'processing',
      currentFileIndex: 0,
      totalFiles: files.length,
      currentFile: files[0]?.name || '',
      overallProgress: 0,
      totalProcessedRows: 0,
      fileStatuses: initialFileStatuses,
      sessionId,
      error: undefined
    })

    let totalProcessedRows = 0
    
    try {
      console.log(`🚀 Starting optimized import session: ${sessionId}`)
      
      // Estimate total file size and warn about large uploads
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const totalSizeMB = totalSize / (1024 * 1024)
      
      if (totalSizeMB > 50) {
        console.log(`⚠️ Large upload detected: ${totalSizeMB.toFixed(1)}MB total. This may take several minutes due to rate limiting.`)
      }
      
      // Process files one by one using optimized import
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update current file
        setState(prev => ({
          ...prev,
          currentFileIndex: i + 1,
          currentFile: file.name,
          fileStatuses: prev.fileStatuses.map((status, index) => 
            index === i ? { ...status, status: 'processing' } : status
          )
        }))

        console.log(`🔄 Processing file ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        
        try {
          // Parse file content first
          let data: any[] = []
          
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

          console.log(`📊 Parsed ${data.length} rows from ${file.name}`)
          
          // Use simple import function that works
          const result = await supabase.functions.invoke('shareholders-simple-import', {
            body: {
              data: data,
              year,
              batchInfo: {
                current: i + 1,
                total: files.length
              },
              sessionId
            }
          })

          if (result.error) {
            throw new Error(result.error.message)
          }

          const fileRows = result.data?.processedRows || 0
          totalProcessedRows += fileRows
          
          // Update file as completed
          setState(prev => ({
            ...prev,
            totalProcessedRows,
            fileStatuses: prev.fileStatuses.map((status, index) => 
              index === i ? { 
                ...status, 
                status: 'completed', 
                rows: fileRows,
                progress: 100 
              } : status
            ),
            overallProgress: ((i + 1) / files.length) * 100
          }))
          
          console.log(`✅ Completed ${file.name}: ${fileRows} rows processed`)
          
          // Rate limiting delay between files (especially important for multiple files)
          if (i < files.length - 1) {
            console.log(`⏳ Waiting 3 seconds between files for rate limiting...`)
            await new Promise(resolve => setTimeout(resolve, 3000))
          }
          
        } catch (fileError: any) {
          console.error(`❌ Error processing ${file.name}:`, fileError)
          
          // Check if it's a rate limiting error
          const isRateLimitError = fileError.message?.includes('429') || 
                                   fileError.message?.includes('rate limit') ||
                                   fileError.message?.includes('too many requests')
          
          if (isRateLimitError) {
            console.log('🚫 Rate limit detected, waiting longer before continuing...')
            await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second wait
          }
          
          // Mark file as failed but continue
          setState(prev => ({
            ...prev,
            fileStatuses: prev.fileStatuses.map((status, index) => 
              index === i ? { 
                ...status, 
                status: 'error', 
                error: isRateLimitError ? 'Rate limit exceeded - try again later' : fileError.message,
                progress: 0 
              } : status
            ),
            overallProgress: ((i + 1) / files.length) * 100
          }))
          
          // Continue with next file
          console.log('📄 Continuing with next file...')
        }
      }

      console.log(`🏁 All files processed for session: ${sessionId}`)

      // Check if any files were processed successfully
      const successfulFiles = state.fileStatuses.filter(f => f.status === 'completed').length
      
      if (successfulFiles === 0) {
        throw new Error('No files were processed successfully. This may be due to rate limiting - please try again later.')
      }

      setState(prev => ({
        ...prev,
        status: 'completed',
        overallProgress: 100
      }))
      
      console.log(`🎉 Import completed! ${successfulFiles}/${files.length} files successful. Total rows: ${totalProcessedRows}`)
      
    } catch (error: any) {
      console.error('Import failed:', error)
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Unknown error occurred'
      }))
    }
  }

  const resetImport = () => {
    setState({
      status: 'idle',
      currentFileIndex: 0,
      totalFiles: 0,
      currentFile: '',
      overallProgress: 0,
      totalProcessedRows: 0,
      fileStatuses: []
    })
  }

  return {
    ...state,
    processFiles,
    resetImport
  }
}

// Helper functions for file parsing
async function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
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

async function parseExcelFile(file: File): Promise<any[]> {
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
        resolve(mapped.filter(row => row !== null))
      } catch (error) {
        reject(new Error(`Excel parsing error: ${(error as Error).message}`))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function mapRowToShareholderData(row: any): any | null {
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