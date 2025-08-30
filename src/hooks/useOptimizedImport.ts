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
    addLog('Prosesserer CSV-fil med Web Worker...')
    
    return new Promise<void>((resolve, reject) => {
      // Create web worker
      workerRef.current = new Worker('/file-worker.js')
      
      let totalBatches = 0
      let processedBatches = 0
      const pendingBatches: any[] = []

      workerRef.current.onmessage = async (e) => {
        const { type, batch, rowCount, totalRows, error } = e.data

        switch (type) {
          case 'PARSE_START':
            updateProgress({ status: 'parsing' })
            break

          case 'PROGRESS':
            updateProgress({ processedRows: rowCount })
            break

          case 'BATCH_READY':
            pendingBatches.push(batch)
            totalBatches++
            
            // Process batches immediately to avoid memory buildup
            if (pendingBatches.length >= 3) { // Process multiple batches in parallel
              const batchesToProcess = pendingBatches.splice(0, 3)
              await Promise.all(batchesToProcess.map(async (batchData) => {
                await processSingleBatch(batchData, sessionId, options)
                processedBatches++
                updateProgress({ 
                  status: 'uploading',
                  progress: (processedBatches / totalBatches) * 90 
                })
              }))
            }
            break

          case 'PARSE_COMPLETE':
            updateProgress({ totalRows, status: 'uploading' })
            
            // Process remaining batches
            if (pendingBatches.length > 0) {
              await Promise.all(pendingBatches.map(async (batchData) => {
                await processSingleBatch(batchData, sessionId, options)
                processedBatches++
              }))
            }

            // Finish import
            await finishImport(sessionId, options)
            resolve()
            break

          case 'ERROR':
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
    const BATCH_SIZE = 10000 // Increased batch size
    const batches = []
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE))
    }

    addLog(`Prosesserer ${batches.length} batches med ${BATCH_SIZE} rader hver`)
    updateProgress({ status: 'uploading' })

    // Process batches in parallel (limited concurrency)
    const CONCURRENT_BATCHES = 3
    for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
      const batchGroup = batches.slice(i, i + CONCURRENT_BATCHES)
      
      await Promise.all(batchGroup.map(async (batch, index) => {
        const normalizedBatch = batch.map(row => normalizeRowData(row))
        await processSingleBatch(normalizedBatch, sessionId, options)
        
        const totalProcessed = (i + index + 1) * BATCH_SIZE
        updateProgress({ 
          processedRows: Math.min(totalProcessed, data.length),
          progress: (Math.min(totalProcessed, data.length) / data.length) * 90
        })
      }))

      addLog(`Fullført ${Math.min(i + CONCURRENT_BATCHES, batches.length)} av ${batches.length} batches`)
    }

    await finishImport(sessionId, options)
  }

  const processSingleBatch = async (batchData: any[], sessionId: string, options: ImportOptions) => {
    const { error } = await supabase.functions.invoke('shareholders-bulk-import', {
      body: {
        action: 'PROCESS_BATCH',
        session_id: sessionId,
        year: options.year,
        batch_data: batchData,
        is_global: options.isGlobal || false
      }
    })

    if (error) {
      throw new Error(`Batch processing failed: ${error.message}`)
    }
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
    return {
      orgnr: String(
        row.orgnr || row.Orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || row.org_nr || 
        row.A || ''
      ).trim(),
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