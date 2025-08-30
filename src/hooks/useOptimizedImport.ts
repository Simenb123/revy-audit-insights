import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

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
      
      addLog('Leser filinnhold...')
      options.onLog?.('Leser filinnhold...')

      // Read file content
      let fileContent: string
      if (file.name.toLowerCase().endsWith('.csv')) {
        fileContent = await readFileAsText(file)
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        fileContent = await readFileAsBase64(file)
      } else {
        throw new Error('Støtter kun CSV og Excel filer')
      }

      updateProgress({ status: 'uploading', progress: 40 }, options)
      addLog('Sender fildata til server for prosessering...')
      options.onLog?.('Sender fildata til server for prosessering...')

      // Send file directly to edge function
      const { data, error } = await supabase.functions.invoke('shareholders-bulk-import', {
        body: {
          sessionId,
          year: options.year,
          fileName: file.name,
          fileContent,
          fileSize: file.size,
          batchSize: 8000,
          maxRetries: 3,
          delayBetweenBatches: 200
        }
      })

      if (error) {
        throw new Error(`Import failed: ${error.message}`)
      }

      updateProgress({ 
        status: 'completed', 
        progress: 100, 
        totalRows: data.processedRows || 0, 
        processedRows: data.processedRows || 0 
      }, options)
      
      addLog(`Import fullført! ${data.processedRows || 0} rader prosessert`)
      options.onLog?.(`Import fullført! ${data.processedRows || 0} rader prosessert`)
      
      options.onComplete?.(data)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Import feilet: ${errorMessage}`)
      options.onLog?.(`Import feilet: ${errorMessage}`)
      updateProgress({ status: 'error', error: errorMessage }, options)
      options.onError?.(errorMessage)
    }
  }, [addLog, updateProgress])

  // Helper function to read file as text (for CSV)
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file, 'utf-8')
    })
  }

  // Helper function to read file as base64 (for Excel)
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64) // Keep full data URL for Excel files
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
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