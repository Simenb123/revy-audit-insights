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
          // Detect file type and set correct MIME type
          const getFileType = (fileName: string): { mimeType: string, fileType: 'csv' | 'excel' } => {
            const extension = fileName.toLowerCase().split('.').pop()
            if (extension === 'csv') {
              return { mimeType: 'text/csv', fileType: 'csv' }
            } else if (extension === 'xlsx' || extension === 'xls') {
              return { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileType: 'excel' }
            } else {
              throw new Error(`Unsupported file type: ${extension}`)
            }
          }
          
          const { mimeType, fileType } = getFileType(file.name)
          
          // Convert file to base64 using FileReader for large files
          const base64Content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Remove the data URL prefix to get just the base64 content
              const base64 = result.split(',')[1]
              resolve(base64)
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })
          
          // Use bulk import function with enhanced batch settings
          const result = await supabase.functions.invoke('shareholders-bulk-import', {
            body: {
              sessionId,
              year,
              fileName: file.name,
              fileContent: `data:${mimeType};base64,${base64Content}`,
              fileSize: file.size,
              fileType: fileType,
              batchSize: 8000, // Larger batches for efficiency
              delayBetweenBatches: 2500, // Longer delays for rate limiting
              maxRetries: 3
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