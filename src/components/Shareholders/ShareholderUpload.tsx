import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useSequentialImport } from '@/hooks/useSequentialImport'
import { cn } from '@/lib/utils'

interface ShareholderUploadProps {
  year: number
  onUploadComplete?: (sessionId: string, totalRows: number) => void
}

export function ShareholderUpload({ year, onUploadComplete }: ShareholderUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { processFiles, resetImport, status, overallProgress, fileStatuses, totalProcessedRows, sessionId } = useSequentialImport()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.toLowerCase().endsWith('.csv') ||
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls')
    )
    
    setSelectedFiles(validFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      await processFiles(selectedFiles, year)
      
      // Notify parent about completion
      if (sessionId && onUploadComplete) {
        const totalRows = selectedFiles.reduce((sum, file) => sum + (fileStatuses.find(fs => fs.name === file.name)?.rows || 0), 0)
        onUploadComplete(sessionId, totalRows)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleReset = () => {
    resetImport()
    setSelectedFiles([])
  }

  const getStatusIcon = (fileStatus: string) => {
    switch (fileStatus) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'processing':
        return <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {status === 'idle' && (
        <Card>
          <CardContent className="p-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                selectedFiles.length > 0 ? "border-primary" : ""
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Last opp aksjonærfiler</h3>
                <p className="text-sm text-muted-foreground">
                  Dra og slipp CSV- eller Excel-filer her, eller
                </p>
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>Velg filer</span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Støttede formater: CSV, XLSX, XLS
                </p>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Valgte filer ({selectedFiles.length})</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleUpload} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Start import ({selectedFiles.length} filer)
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFiles([])}>
                    Fjern alle
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {(status === 'processing' || status === 'completed' || status === 'error') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Import Status</span>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Ny import
              </Button>
            </CardTitle>
            <CardDescription>
              Behandler {fileStatuses.length} filer for år {year}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Samlet fremgang</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Individual File Status */}
            <div className="space-y-2">
              {fileStatuses.map((fileStatus, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(fileStatus.status)}
                    <div>
                      <p className="text-sm font-medium">{fileStatus.name}</p>
                      {fileStatus.rows && (
                        <p className="text-xs text-muted-foreground">
                          {fileStatus.rows.toLocaleString()} rader prosessert
                        </p>
                      )}
                      {fileStatus.error && (
                        <p className="text-xs text-red-600">{fileStatus.error}</p>
                      )}
                    </div>
                  </div>
                  {fileStatus.progress !== undefined && fileStatus.status === 'processing' && (
                    <div className="w-20">
                      <Progress value={fileStatus.progress} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Totalt rader prosessert:</span>
                <span className="font-medium">{totalProcessedRows.toLocaleString()}</span>
              </div>
            </div>

            {status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import fullført! {totalProcessedRows.toLocaleString()} rader ble prosessert.
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Import feilet. Se detaljer over for mer informasjon.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}