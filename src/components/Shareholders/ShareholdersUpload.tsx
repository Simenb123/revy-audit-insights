import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  fileName?: string
  totalRows?: number
  processedRows?: number
  error?: string
}

export const ShareholdersUpload: React.FC = () => {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  })

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const extension = selectedFile.name.toLowerCase().split('.').pop()
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      toast({
        title: "Ugyldig filtype",
        description: "Vennligst velg en CSV eller Excel-fil (.csv, .xlsx, .xls)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 500MB)
    if (selectedFile.size > 500 * 1024 * 1024) {
      toast({
        title: "Filen er for stor",
        description: "Maksimal filstørrelse er 500MB",
        variant: "destructive"
      })
      return
    }

    setFile(selectedFile)
    setUploadState({
      status: 'idle',
      progress: 0,
      message: '',
      fileName: selectedFile.name
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const processFile = async () => {
    if (!file) return

    setUploadState({
      status: 'uploading',
      progress: 10,
      message: 'Forbereder fil...',
      fileName: file.name
    })

    try {
      // Convert file to base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = () => reject(new Error('Kunne ikke lese fil'))
        reader.readAsDataURL(file)
      })

      setUploadState(prev => ({
        ...prev,
        progress: 30,
        message: 'Laster opp til server...'
      }))

      // Call the new unified edge function
      const { data, error } = await supabase.functions.invoke('shareholders-unified-import', {
        body: {
          fileName: file.name,
          fileContent: base64Content,
          fileSize: file.size,
          year: year
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 50,
        message: 'Prosesserer data...'
      }))

      // Poll for progress updates
      const sessionId = data.sessionId
      if (sessionId) {
        await pollProgress(sessionId)
      } else {
        // Direct response, no polling needed
        setUploadState({
          status: 'completed',
          progress: 100,
          message: `Import fullført! ${data.processedRows} rader prosessert.`,
          totalRows: data.totalRows,
          processedRows: data.processedRows
        })
      }

      toast({
        title: "Import fullført!",
        description: `${data.processedRows || 0} rader ble importert.`
      })

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadState({
        status: 'error',
        progress: 0,
        message: 'Import feilet',
        error: error.message || 'Ukjent feil oppstod'
      })

      toast({
        title: "Import feilet",
        description: error.message || 'En feil oppstod under importen',
        variant: "destructive"
      })
    }
  }

  const pollProgress = async (sessionId: string) => {
    const maxAttempts = 120 // 10 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('shareholders-status', {
          body: { sessionId }
        })

        if (error) throw error

        const { status, progress, processedRows, totalRows, error: sessionError } = data

        setUploadState(prev => ({
          ...prev,
          progress: Math.max(prev.progress, progress || 50),
          message: status === 'processing' ? 'Prosesserer data...' : prev.message,
          totalRows,
          processedRows
        }))

        if (status === 'completed') {
          setUploadState({
            status: 'completed',
            progress: 100,
            message: `Import fullført! ${processedRows} rader prosessert.`,
            totalRows,
            processedRows
          })
          return
        }

        if (status === 'error' || sessionError) {
          throw new Error(sessionError || 'Import feilet')
        }

        attempts++
        if (attempts < maxAttempts && status === 'processing') {
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error: any) {
        setUploadState({
          status: 'error',
          progress: 0,
          message: 'Import feilet',
          error: error.message
        })
      }
    }

    poll()
  }

  const resetUpload = () => {
    setFile(null)
    setUploadState({
      status: 'idle',
      progress: 0,
      message: ''
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Last opp aksjonærregister
          </CardTitle>
          <CardDescription>
            Last opp CSV eller Excel-filer fra Skatteetaten. Støtter filer opp til 500MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year">År</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min={2000}
              max={new Date().getFullYear()}
              disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
            />
          </div>

          {!file ? (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Dra og slipp filen her, eller klikk for å velge
              </p>
              <p className="text-sm text-muted-foreground">
                CSV, Excel (.xlsx, .xls) - maks 500MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                {uploadState.status === 'idle' && (
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploadState.status !== 'idle' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {uploadState.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : uploadState.status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                      )}
                      <span className="font-medium">{uploadState.message}</span>
                    </div>
                    {uploadState.processedRows && uploadState.totalRows && (
                      <span className="text-sm text-muted-foreground">
                        {uploadState.processedRows.toLocaleString()} / {uploadState.totalRows.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <Progress value={uploadState.progress} className="w-full" />
                  
                  {uploadState.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadState.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {uploadState.status === 'idle' && (
                  <Button onClick={processFile} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Start import
                  </Button>
                )}
                
                {(uploadState.status === 'completed' || uploadState.status === 'error') && (
                  <Button onClick={resetUpload} variant="outline" className="flex-1">
                    Last opp ny fil
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}