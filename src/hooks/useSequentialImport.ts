import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

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
      // Process files one by one
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
          // Convert file to base64
          const fileBuffer = await file.arrayBuffer()
          const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))
          
          // Process single file with optimized settings for large files
          const result = await supabase.functions.invoke('shareholders-bulk-import', {
            body: {
              sessionId,
              year,
              fileName: file.name,
              fileContent: base64Content,
              batchSize: 8000, // Larger batches for efficiency with 800K files
              maxRetries: 3,
              delayBetweenBatches: 200, // Reduced delay for faster processing
              fileSize: file.size
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
          
          // Add delay between files to prevent overwhelming (reduced for large files)
          if (i < files.length - 1) {
            console.log('⏳ Waiting 1 second before next file...')
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
        } catch (fileError: any) {
          console.error(`❌ Error processing ${file.name}:`, fileError)
          
          // Mark file as failed but continue
          setState(prev => ({
            ...prev,
            fileStatuses: prev.fileStatuses.map((status, index) => 
              index === i ? { 
                ...status, 
                status: 'error', 
                error: fileError.message,
                progress: 0 
              } : status
            ),
            overallProgress: ((i + 1) / files.length) * 100
          }))
          
          // Continue with next file
          console.log('📄 Continuing with next file...')
        }
      }

      // Check if any files were processed successfully
      const successfulFiles = state.fileStatuses.filter(f => f.status === 'completed').length
      
      if (successfulFiles === 0) {
        throw new Error('No files were processed successfully')
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