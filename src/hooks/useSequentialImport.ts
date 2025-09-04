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
    // Debug: Log the first few rows to understand the structure
    const rowKeys = Object.keys(row)
    console.log('🔍 Processing row with keys:', rowKeys)
    console.log('🔍 Row data sample:', Object.fromEntries(Object.entries(row).slice(0, 5)))
    
    // Helper function to extract field value with flexible matching
    const extractField = (row: any, possibleNames: string[]): string => {
      const keys = Object.keys(row)
      
      for (const name of possibleNames) {
        // Try exact match first
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          const value = String(row[name]).trim()
          console.log(`✅ Found field "${name}" = "${value}"`)
          return value
        }
        
        // Try case-insensitive match
        const key = keys.find(k => k.toLowerCase() === name.toLowerCase())
        if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
          const value = String(row[key]).trim()
          console.log(`✅ Found field "${key}" (case insensitive for "${name}") = "${value}"`)
          return value
        }
        
        // Try partial match (contains)
        const partialKey = keys.find(k => k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase()))
        if (partialKey && row[partialKey] !== undefined && row[partialKey] !== null && row[partialKey] !== '') {
          const value = String(row[partialKey]).trim()
          console.log(`✅ Found field "${partialKey}" (partial match for "${name}") = "${value}"`)
          return value
        }
      }
      console.log(`❌ Field not found for names:`, possibleNames)
      return ''
    }

    // Extract company org number with enhanced support for Skatteetaten format
    const orgNrRaw = extractField(row, [
      'Orgnr',     // Standard format (moved to top)
      '"Orgnr',    // Skatteetaten format with quote
      'orgnr',
      'organisasjonsnummer',
      'Organisasjonsnummer',
      'org_nr',
      'org-nr'
    ]).replace(/[^\d]/g, '') // Remove all non-digits including quotes
    
    // Normalize org number
    let company_orgnr = orgNrRaw
    if (company_orgnr.length === 8) {
      company_orgnr = '0' + company_orgnr
    }
    
    console.log(`🏢 Org number: "${orgNrRaw}" -> "${company_orgnr}"`)
    
    if (!company_orgnr || (company_orgnr.length !== 9 && company_orgnr.length !== 8)) {
      console.warn(`❌ Invalid org number: "${orgNrRaw}", length: ${company_orgnr.length}`)
      return null
    }

    const company_name = extractField(row, [
      'Selskap',        // Skatteetaten format
      'selskap',
      'selskapsnavn',
      'navn',
      'company_name',
      'Company Name'
    ])

    const holder_name = extractField(row, [
      'Navn aksjonær',  // Skatteetaten format
      'navn aksjonær',
      'navn_aksjonaer',
      'aksjonaer',
      'eier',
      'holder',
      'eier_navn',
      'Holder Name'
    ])

    console.log(`📊 Extracted: company_name="${company_name}", holder_name="${holder_name}"`)

    if (!company_name || !holder_name) {
      console.warn('❌ Missing required fields:', { 
        company_name: !!company_name, 
        holder_name: !!holder_name, 
        orgNumber: !!company_orgnr,
        availableFields: Object.keys(row),
        sampleData: row
      })
      return null
    }

    // Parse share amount with enhanced extraction
    const sharesStr = extractField(row, [
      'Antall aksjer',           // Skatteetaten format
      'antall aksjer',
      'Antall aksjer selskap"',  // With trailing quote and text
      'antall_aksjer',
      'aksjer',
      'shares',
      'andeler'
    ]).replace(/[^\d]/g, '') // Remove all non-digits
    
    const shares = parseInt(sharesStr) || 0
    
    if (shares === 0) {
      console.warn('Zero or invalid shares:', sharesStr)
    }

    // Extract holder details (birth year or org number)
    const holder_orgnr_raw = extractField(row, [
      'Fødselsår/orgnr',  // Skatteetaten format
      'fødselsår/orgnr',
      'fodselsar_orgnr',
      'eier_orgnr',
      'holder_orgnr',
      'Birth Year/Org'
    ]).replace(/[^\d]/g, '')

    let holder_orgnr: string | undefined
    let holder_birth_year: number | undefined

    if (holder_orgnr_raw.length === 9) {
      holder_orgnr = holder_orgnr_raw
    } else if (holder_orgnr_raw.length === 4 && parseInt(holder_orgnr_raw) >= 1900) {
      holder_birth_year = parseInt(holder_orgnr_raw)
    }

    const holder_country = extractField(row, [
      'Landkode',     // Skatteetaten format
      'landkode',
      'country_code',
      'Country Code'
    ]).toUpperCase() || 'NOR'

    const share_class = extractField(row, [
      'Aksjeklasse',  // Skatteetaten format
      'aksjeklasse',
      'share_class',
      'Share Class'
    ]) || 'Ordinære aksjer'

    return {
      company_orgnr,
      company_name,
      holder_name,
      holder_orgnr,
      holder_birth_year,
      holder_country,
      share_class,
      shares,
      raw_row: row
    }

  } catch (error) {
    console.error('Error mapping row:', error, 'Row keys:', Object.keys(row))
    return null
  }
}