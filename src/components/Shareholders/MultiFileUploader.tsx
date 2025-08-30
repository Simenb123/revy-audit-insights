import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Upload, X } from "lucide-react"
import { useSequentialImport } from '@/hooks/useSequentialImport'
import { validateXmlFile } from '@/utils/fileValidation'
import { useToast } from "@/hooks/use-toast"

interface MultiFileUploaderProps {
  year: number
  onComplete?: (results: any) => void
}

export const MultiFileUploader: React.FC<MultiFileUploaderProps> = ({ year, onComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { toast } = useToast()
  const importState = useSequentialImport()

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    try {
      // Validate each file
      const validFiles: File[] = []
      const errors: string[] = []
      
      files.forEach(file => {
        try {
          validateXmlFile(file, 100_000_000) // 100MB max per file
          validFiles.push(file)
        } catch (error: any) {
          errors.push(`${file.name}: ${error.message}`)
        }
      })
      
      if (errors.length > 0) {
        toast({
          title: "File Validation Errors",
          description: errors.join('\n'),
          variant: "destructive"
        })
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        toast({
          title: "Files Selected",
          description: `${validFiles.length} valid files selected for import`
        })
      }
      
    } catch (error: any) {
      toast({
        title: "File Selection Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const startImport = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select XML files to import",
        variant: "destructive"
      })
      return
    }
    
    importState.processFiles(selectedFiles, year)
  }

  const resetImport = () => {
    importState.resetImport()
    setSelectedFiles([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Multiple Shareholder Files ({year})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        {importState.status === 'idle' && (
          <div className="space-y-4">
            <div>
              <input
                type="file"
                multiple
                accept=".xml"
                onChange={handleFileSelection}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-500 mt-2">
                Select multiple XML files (max 800k rows each, 100MB per file)
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                <div className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={startImport} className="w-full">
                  Start Import
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Progress Display */}
        {importState.status !== 'idle' && (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(importState.overallProgress)}%</span>
              </div>
              <Progress value={importState.overallProgress} className="w-full" />
              <div className="text-sm text-gray-600">
                Processing file {importState.currentFileIndex} of {importState.totalFiles}: {importState.currentFile}
              </div>
              <div className="text-sm text-gray-600">
                Total rows processed: {importState.totalProcessedRows.toLocaleString()}
              </div>
            </div>

            {/* File Status List */}
            <div className="space-y-2">
              <h4 className="font-medium">File Status</h4>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {importState.fileStatuses.map((fileStatus, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(fileStatus.status)}
                      <span className="text-sm font-medium truncate">{fileStatus.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fileStatus.rows && (
                        <span className="text-xs text-gray-500">
                          {fileStatus.rows.toLocaleString()} rows
                        </span>
                      )}
                      <Badge className={getStatusColor(fileStatus.status)}>
                        {fileStatus.status}
                      </Badge>
                    </div>
                    {fileStatus.error && (
                      <div className="text-xs text-red-600 mt-1 truncate max-w-48">
                        {fileStatus.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {importState.status === 'completed' && (
                <Button onClick={resetImport} variant="outline" className="flex-1">
                  Import More Files
                </Button>
              )}
              {importState.status === 'error' && (
                <Button onClick={resetImport} variant="outline" className="flex-1">
                  Try Again
                </Button>
              )}
            </div>

            {/* Error Display */}
            {importState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Import Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{importState.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}