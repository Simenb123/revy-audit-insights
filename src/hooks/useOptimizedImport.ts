import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { parseXlsxSafely, getWorksheetDataSafely } from '@/utils/secureXlsx'

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

  const workerRef = useRef<Worker | null>(null)
  const sessionRef = useRef<string>('')
  const optionsRef = useRef<ImportOptions>()

  const addLog = useCallback((message: string) => {
    console.log(`[Import] ${message}`)
    optionsRef.current?.onLog?.(message)
  }, [])

  const updateProgress = useCallback((updates: Partial<ImportProgress>) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...updates }
      optionsRef.current?.onProgress?.(newProgress)
      return newProgress
    })
  }, [])

  const startImport = useCallback(async (file: File, options: ImportOptions) => {
    optionsRef.current = options
    
    try {
      addLog('Starter optimalisert import...')
      updateProgress({ status: 'parsing' })

      // Start import session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('shareholders-bulk-import', {
        body: {
          action: 'START_SESSION',
          year: options.year,
          file_data: { name: file.name, size: file.size }
        }
      })

      if (sessionError) {
        throw new Error(`Session start failed: ${sessionError.message}`)
      }

      const sessionId = sessionData.session_id
      sessionRef.current = sessionId

      updateProgress({ 
        sessionId,
        status: 'parsing',
        canResume: true
      })

      addLog(`Session startet: ${sessionId}`)

      // Determine file type and processing method
      const fileName = file.name.toLowerCase()
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

      if (isExcel) {
        await processExcelFile(file, sessionId, options)
      } else {
        await processCSVFile(file, sessionId, options)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Import feilet: ${errorMessage}`)
      updateProgress({ status: 'error', error: errorMessage })
      options.onError?.(errorMessage)
    }
  }, [addLog, updateProgress])

  const processExcelFile = async (file: File, sessionId: string, options: ImportOptions) => {
    addLog('Prosesserer Excel-fil...')
    
    try {
      const workbook = await parseXlsxSafely(file)
      const worksheetData = getWorksheetDataSafely(workbook)
      
      addLog(`Excel-fil inneholder ${worksheetData.length} rader`)
      updateProgress({ totalRows: worksheetData.length })

      await processBatches(worksheetData, sessionId, options)
    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`)
    }
  }

  const processCSVFile = async (file: File, sessionId: string, options: ImportOptions) => {
    addLog('Prosesserer stor CSV-fil med forbedret Web Worker...')
    
    return new Promise<void>((resolve, reject) => {
      // Create enhanced web worker
      workerRef.current = new Worker('/file-worker.js')
      
      let totalBatches = 0
      let processedBatches = 0
      let successfulBatches = 0
      let failedBatches = 0
      const activeBatches = new Set()
      const MAX_CONCURRENT_BATCHES = 2 // Reduced to avoid overloading Edge Functions
      
      // Enhanced progress tracking
      let lastProgressUpdate = Date.now()
      const PROGRESS_UPDATE_INTERVAL = 2000 // Update every 2 seconds

      workerRef.current.onmessage = async (e) => {
        const { type, batch, batchNumber, rowCount, totalRows, validRows, errorRows, error, memoryUsage } = e.data

        switch (type) {
          case 'LOG':
            addLog(`[Worker] ${e.data.message}`)
            break

          case 'PARSE_START':
            addLog(`Starter prosessering av ${e.data.fileName} (${Math.round(e.data.fileSize / 1024 / 1024)}MB)`)
            updateProgress({ status: 'parsing' })
            break

          case 'PROGRESS':
            const now = Date.now()
            if (now - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
              const memInfo = memoryUsage ? ` (Minne: ${memoryUsage}MB)` : ''
              const errorRate = rowCount > 0 ? Math.round((errorRows / rowCount) * 100) : 0
              addLog(`Prosessert ${rowCount} rader, ${validRows} gyldige (${100 - errorRate}%), ${errorRows} advarsler${memInfo}`)
              updateProgress({ 
                processedRows: rowCount,
                progress: Math.min((validRows / (totalRows || validRows)) * 50, 50) // More accurate progress based on valid rows
              })
              lastProgressUpdate = now
            }
            break

          case 'BATCH_READY':
            totalBatches++
            
            // Wait if too many concurrent batches
            while (activeBatches.size >= MAX_CONCURRENT_BATCHES) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            // Process batch asynchronously
            const batchId = `${sessionId}-${batchNumber}`
            activeBatches.add(batchId)
            
            processSingleBatch(batch, sessionId, options)
              .then(() => {
                successfulBatches++
                processedBatches++
                activeBatches.delete(batchId)
                
                const overallProgress = 60 + (processedBatches / totalBatches) * 30 // 60-90%
                updateProgress({ 
                  status: 'uploading',
                  progress: overallProgress
                })
                
                if (processedBatches % 10 === 0) {
                  addLog(`Fullført ${processedBatches}/${totalBatches} batches (${successfulBatches} vellykket, ${failedBatches} feilet)`)
                }
              })
              .catch((error) => {
                failedBatches++
                processedBatches++
                activeBatches.delete(batchId)
                addLog(`Batch ${batchNumber} feilet: ${error.message}`)
                
                // Continue processing even if some batches fail
                const overallProgress = 60 + (processedBatches / totalBatches) * 30
                updateProgress({ 
                  status: 'uploading',
                  progress: overallProgress
                })
              })
            break

          case 'PARSE_COMPLETE':
            const successRate = totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0
            addLog(`Parsing fullført: ${totalRows} rader totalt, ${validRows} gyldige (${successRate}%), ${errorRows} advarsler`)
            updateProgress({ totalRows: validRows, status: 'uploading', progress: 50 }) // Use valid rows as total
            
            // Wait for all batches to complete
            const waitForBatches = setInterval(async () => {
              if (activeBatches.size === 0 && processedBatches >= totalBatches) {
                clearInterval(waitForBatches)
                
                addLog(`Alle batches prosessert: ${successfulBatches}/${totalBatches} vellykket`)
                
                if (successfulBatches === 0) {
                  reject(new Error(`Ingen batches ble prosessert vellykket. Sjekk dataformat og kolonnenavn.`))
                  return
                }
                
                try {
                  await finishImport(sessionId, options)
                  resolve()
                } catch (error) {
                  reject(error)
                }
              }
            }, 500)
            
            // Timeout after 10 minutes
            setTimeout(() => {
              clearInterval(waitForBatches)
              reject(new Error('Import timeout - tok for lang tid å prosessere alle batches'))
            }, 600000)
            break

          case 'ERROR':
            addLog(`Worker feil: ${error}`)
            reject(new Error(error))
            break

          case 'PAUSED':
            updateProgress({ status: 'paused' })
            break

          case 'RESUMED':
            updateProgress({ status: 'uploading' })
            break
        }
      }

      workerRef.current.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`))
      }

      // Start parsing
      workerRef.current.postMessage({
        type: 'PARSE_FILE',
        data: { file }
      })
    })
  }

  const processBatches = async (data: any[], sessionId: string, options: ImportOptions) => {
    const BATCH_SIZE = 3000 // Drastically reduced to avoid WORKER_LIMIT errors
    const batches = []
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE))
    }

    addLog(`Prosesserer ${batches.length} mindre batches med ${BATCH_SIZE} rader hver`)
    updateProgress({ status: 'uploading' })

    // Reduced concurrency to avoid overloading
    const CONCURRENT_BATCHES = 2
    let successfulBatches = 0
    let failedBatches = 0
    
    for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
      const batchGroup = batches.slice(i, i + CONCURRENT_BATCHES)
      
      const results = await Promise.allSettled(batchGroup.map(async (batch, index) => {
        const normalizedBatch = batch.map(row => normalizeRowData(row))
        await processSingleBatch(normalizedBatch, sessionId, options)
        
                const batchIndex = i + index
                const totalProcessed = Math.min((batchIndex + 1) * BATCH_SIZE, data.length)
                updateProgress({ 
                  processedRows: totalProcessed,
                  progress: (totalProcessed / data.length) * 90
                })
                
                // Add delay between batches to avoid overwhelming Edge Functions
                await new Promise(resolve => setTimeout(resolve, 200))
                
                return batchIndex
      }))
      
      // Count successful vs failed batches
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulBatches++
        } else {
          failedBatches++
          addLog(`Batch ${i + index} feilet: ${result.reason?.message || 'Unknown error'}`)
        }
      })

      addLog(`Fullført ${Math.min(i + CONCURRENT_BATCHES, batches.length)} av ${batches.length} batches (${successfulBatches} vellykket, ${failedBatches} feilet)`)
    }
    
    if (successfulBatches === 0) {
      throw new Error('Ingen batches ble prosessert vellykket. Sjekk dataformat og Edge Function logs.')
    }

    await finishImport(sessionId, options)
  }

  const processSingleBatch = async (batchData: any[], sessionId: string, options: ImportOptions) => {
    const retryAttempts = 5 // Increased retry attempts
    let lastError = null
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Pre-validate batch data with relaxed validation
        const validRows = batchData.filter(row => {
          const orgnr = String(row.orgnr || '').trim().replace(/\D/g, '')
          const orgnrLength = orgnr.length
          return orgnr && (orgnrLength === 8 || orgnrLength === 9) && (row.selskap || row.navn_aksjonaer)
        })
        
        if (validRows.length === 0) {
          addLog(`Batch skipped: ingen gyldige rader av ${batchData.length}`)
          return { processed_rows: 0, total_rows: batchData.length, errors: ['No valid rows in batch'] }
        }
        
        const { data, error } = await supabase.functions.invoke('shareholders-bulk-import', {
          body: {
            action: 'PROCESS_BATCH',
            session_id: sessionId,
            year: options.year,
            batch_data: validRows, // Send only valid rows
            is_global: options.isGlobal || false
          }
        })

        if (error) {
          // Check for specific error types
          if (error.message?.includes('WORKER_LIMIT') || error.message?.includes('546')) {
            throw new Error(`Edge Function overloaded (WORKER_LIMIT). Batch too large or too many concurrent requests.`)
          }
          throw new Error(`Batch processing failed: ${error.message}`)
        }
        
        // Enhanced logging
        const processedCount = data?.processed_rows || 0
        const errorCount = data?.errors?.length || 0
        
        if (processedCount === 0 && errorCount > 0) {
          addLog(`Batch feilet: ${errorCount} feil, ingen rader prosessert`)
          if (data.errors?.length > 0) {
            addLog(`Første 3 feil: ${data.errors.slice(0, 3).join('; ')}`)
          }
        } else {
          addLog(`Batch OK: ${processedCount}/${validRows.length} rader prosessert, ${errorCount} feil`)
        }
        
        return data // Success
        
      } catch (error) {
        lastError = error
        const isWorkerLimit = error.message?.includes('WORKER_LIMIT') || error.message?.includes('546')
        
        if (attempt < retryAttempts) {
          const waitTime = isWorkerLimit ? 5000 * attempt : 1000 * attempt // Longer wait for worker limits
          addLog(`Batch forsøk ${attempt} feilet: ${error.message}. Venter ${waitTime}ms før retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
    
    throw lastError
  }

  const finishImport = async (sessionId: string, options: ImportOptions) => {
    addLog('Aggregerer data...')
    updateProgress({ status: 'aggregating', progress: 90 })

    const { data, error } = await supabase.functions.invoke('shareholders-bulk-import', {
      body: {
        action: 'FINISH_SESSION',
        session_id: sessionId,
        year: options.year,
        is_global: options.isGlobal || false
      }
    })

    if (error) {
      throw new Error(`Import finish failed: ${error.message}`)
    }

    updateProgress({ status: 'completed', progress: 100 })
    addLog(`Import fullført! ${data.summary?.companies || 0} selskaper, ${data.summary?.holdings || 0} eierandeler`)
    
    options.onComplete?.(data)
  }

  const normalizeRowData = (row: any) => {
    // Normalize org number with padding for 8-digit numbers
    let orgnr = String(
      row.orgnr || row.Orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || row.org_nr || 
      row.A || ''
    ).trim().replace(/\D/g, '') // Remove non-digits
    
    // Pad 8-digit org numbers to 9 digits
    if (orgnr.length === 8) {
      orgnr = '0' + orgnr
    }

    return {
      orgnr: orgnr,
      selskap: String(
        row.navn || row.selskapsnavn || row.company_name || row.Selskap || 
        row.B || ''
      ).trim(),
      aksjeklasse: String(
        row.aksjeklasse || row.Aksjeklasse || row.share_class || 
        row.C || ''
      ).trim() || null,
      navn_aksjonaer: String(
        row.aksjonaer || row.eier || row.holder || row.navn_aksjonaer || 
        row['Navn aksjonÃ¦r'] || row['Navn aksjonær'] || 
        row.D || ''
      ).trim(),
      fodselsar_orgnr: String(
        row.eier_orgnr || row.holder_orgnr || row.fodselsar_orgnr || 
        row['FÃ¸dselsÃ¥r/orgnr'] || row['Fødselsår/orgnr'] || 
        row.E || ''
      ).trim() || null,
      landkode: String(
        row.landkode || row.Landkode || row.country_code || 
        row.G || ''
      ).trim() || null,
      antall_aksjer: String(
        row.aksjer || row.shares || row.antall_aksjer || 
        row['Antall aksjer'] || 
        row.H || '0'
      ).trim(),
      antall_aksjer_selskap: String(
        row.antall_aksjer_selskap || row.total_shares || 
        row['Antall aksjer selskap'] || 
        row.I || ''
      ).trim() || null
    }
  }

  const pauseImport = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'PAUSE' })
    }
    updateProgress({ status: 'paused' })
  }, [updateProgress])

  const resumeImport = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RESUME' })
    }
    updateProgress({ status: 'uploading' })
  }, [updateProgress])

  const cancelImport = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL' })
      workerRef.current.terminate()
      workerRef.current = null
    }
    updateProgress({ status: 'idle', progress: 0, processedRows: 0 })
  }, [updateProgress])

  const checkSession = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase.functions.invoke('shareholders-bulk-import', {
      body: {
        action: 'CHECK_SESSION',
        session_id: sessionId
      }
    })

    if (error) {
      return null
    }

    return data
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