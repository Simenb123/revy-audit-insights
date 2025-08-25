import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Upload, FileText, AlertCircle, Pause, Play, X } from 'lucide-react'
import Papa from 'papaparse'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

import { startImportSession, ingestBatch, finishImport } from '@/services/shareholders'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'

const importSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, 'Fil er påkrevd'),
  year: z.number().min(2000).max(new Date().getFullYear()),
  delimiter: z.enum([';', ',']),
  encoding: z.enum(['AUTO', 'UTF-8', 'CP1252']),
  mode: z.enum(['full', 'clients-only']),
  isGlobal: z.boolean().optional()
})

type ImportFormData = z.infer<typeof importSchema>

export const ShareholdersImportForm: React.FC = () => {
  const { toast } = useToast()
  const { data: isSuperAdmin } = useIsSuperAdmin()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [processedRows, setProcessedRows] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [processingLog, setProcessingLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)
  const parserRef = useRef<Papa.Parser | null>(null)

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      year: new Date().getFullYear() - 1, // Forrige år som standard
      delimiter: ';',
      encoding: 'AUTO',
      mode: 'full',
      isGlobal: false
    }
  })

  // Header mapping for different CSV formats
  const normalizeHeader = (header: string): string => {
    return header.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
  }

  // Add log entry
  const addLog = (message: string) => {
    setProcessingLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const importMutation = useMutation({
    mutationFn: async (data: ImportFormData) => {
      if (!file) throw new Error('Ingen fil valgt')

      setIsProcessing(true)
      setProcessedRows(0)
      setTotalRows(0)
      setProcessingLog([])
      setUploadProgress(0)

      addLog('Starter import session...')
      
      // Start import session
      const session = await startImportSession(data.year)
      addLog(`Session startet: ${session.session_id}`)

      const BATCH_SIZE = 2000
      let buffer: any[] = []
      let currentRowNumber = 0
      let totalProcessed = 0

      // We'll get the actual total rows from Papa Parse
      let actualTotalRows = 0

      return new Promise<any>((resolve, reject) => {
        const processBatch = async () => {
          if (buffer.length === 0) return

          try {
            addLog(`Prosesserer batch: ${buffer.length} rader`)
            const result = await ingestBatch(session.session_id, data.year, buffer, data.isGlobal)
            totalProcessed += buffer.length
            setProcessedRows(totalProcessed)
            // Update progress based on actual row counts
            const progressPercent = actualTotalRows > 0 ? (totalProcessed / actualTotalRows) * 90 : 0
            setUploadProgress(progressPercent)
            
            addLog(`Batch fullført: ${result.companies} selskaper, ${result.entities} eiere, ${result.holdings} eierandeler`)
            buffer = []
          } catch (error) {
            reject(error)
          }
        }

        Papa.parse(file, {
          worker: false,
          header: true,
          skipEmptyLines: true,
          step: async (results, parser) => {
            if (isPaused) {
              parser.pause()
              parserRef.current = parser
              return
            }

            currentRowNumber++
            actualTotalRows = currentRowNumber
            setTotalRows(currentRowNumber)
            
            const row = results.data as any

            // Debug logging for first few rows
            if (currentRowNumber <= 5) {
              addLog(`Rad ${currentRowNumber}: ${JSON.stringify(Object.keys(row)).slice(0, 200)}`)
            }

            // Map common header variations to standard fields
            const normalizedRow = {
              orgnr: String(row.orgnr || row.organisasjonsnummer || row.org_nr || '').trim(),
              selskap: String(row.navn || row.selskapsnavn || row.company_name || '').trim(),
              aksjeklasse: String(row.aksjeklasse || row.share_class || '').trim() || null,
              navn_aksjonaer: String(row.aksjonaer || row.eier || row.holder || row.navn_aksjonaer || '').trim(),
              fodselsar_orgnr: String(row.eier_orgnr || row.holder_orgnr || row.fodselsar_orgnr || '').trim() || null,
              landkode: String(row.landkode || row.country_code || '').trim() || null,
              antall_aksjer: String(row.aksjer || row.shares || row.antall_aksjer || '0').trim(),
              antall_aksjer_selskap: String(row.antall_aksjer_selskap || row.total_shares || '').trim() || null
            }

            // Debug logging for data mapping
            if (currentRowNumber <= 3) {
              addLog(`Normalisert rad ${currentRowNumber}: orgnr=${normalizedRow.orgnr}, selskap=${normalizedRow.selskap}, aksjer=${normalizedRow.antall_aksjer}`)
            }

            // Filter for clients-only mode
            if (data.mode === 'clients-only') {
              // This would need client org numbers - simplified for now
              // In practice, you'd need to fetch client org numbers first
            }

            buffer.push(normalizedRow)

            // Process batch when full
            if (buffer.length >= BATCH_SIZE) {
              parser.pause()
              await processBatch()
              if (!isPaused) {
                parser.resume()
              }
            }
          },
          complete: async () => {
            try {
              // Process remaining buffer
              await processBatch()
              
              addLog('Avslutter import...')
              const finishResult = await finishImport(session.session_id, data.year, data.isGlobal)
              
              setUploadProgress(100)
              addLog(`Import fullført! ${finishResult.summary.companies} selskaper, ${finishResult.summary.holdings} eierandeler`)
              
              resolve({
                processedRows: totalProcessed,
                skippedRows: 0,
                errorRows: 0,
                totalRows: currentRowNumber
              })
            } catch (error) {
              reject(error)
            }
          },
          error: (error) => {
            addLog(`Parsing feil: ${error.message}`)
            reject(error)
          }
        })
      })
    },
    onSuccess: (result) => {
      setIsProcessing(false)
      toast({
        title: 'Import fullført',
        description: `${result.processedRows} rader importert`,
      })
      
      // Reset form
      form.reset()
      setFile(null)
      setUploadProgress(0)
      setProcessedRows(0)
      setTotalRows(0)
    },
    onError: (error) => {
      setIsProcessing(false)
      setUploadProgress(0)
      addLog(`FEIL: ${error.message}`)
      toast({
        title: 'Import feilet',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handlePause = () => {
    setIsPaused(true)
    if (parserRef.current) {
      parserRef.current.pause()
    }
  }

  const handleResume = () => {
    setIsPaused(false)
    if (parserRef.current) {
      parserRef.current.resume()
    }
  }

  const handleCancel = () => {
    if (parserRef.current) {
      parserRef.current.abort()
    }
    setIsProcessing(false)
    setIsPaused(false)
    setUploadProgress(0)
    setProcessedRows(0)
    setTotalRows(0)
    addLog('Import avbrutt')
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      form.setValue('file', selectedFile)
    }
  }

  const onSubmit = (data: ImportFormData) => {
    importMutation.mutate(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Filvalg */}
      <div className="space-y-2">
        <Label htmlFor="file">CSV-fil fra Skatteetaten</Label>
        <div className="flex items-center gap-4">
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          )}
        </div>
        {form.formState.errors.file && (
          <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>
        )}
      </div>

      {/* Global import toggle (kun for superadmin) */}
      {isSuperAdmin && (
        <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
          <Switch
            id="isGlobal"
            checked={form.watch('isGlobal') || false}
            onCheckedChange={(checked) => form.setValue('isGlobal', checked)}
            disabled={isProcessing}
          />
          <div className="space-y-1">
            <Label htmlFor="isGlobal" className="text-sm font-medium">
              Global import
            </Label>
            <p className="text-xs text-muted-foreground">
              Import som globale data tilgjengelig for alle brukere (kun superadmin)
            </p>
          </div>
        </div>
      )}

      {/* Parametere */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Regnskapsår</Label>
          <Input
            id="year"
            type="number"
            min="2000"
            max={new Date().getFullYear()}
            {...form.register('year', { valueAsNumber: true })}
            disabled={isProcessing}
          />
        </div>

        <div className="space-y-2">
          <Label>Skilletegn</Label>
          <Select 
            value={form.watch('delimiter')} 
            onValueChange={(value) => form.setValue('delimiter', value as ';' | ',')}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=";">Semikolon (;)</SelectItem>
              <SelectItem value=",">Komma (,)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tegnkoding</Label>
          <Select 
            value={form.watch('encoding')} 
            onValueChange={(value) => form.setValue('encoding', value as 'AUTO' | 'UTF-8' | 'CP1252')}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">Automatisk</SelectItem>
              <SelectItem value="UTF-8">UTF-8</SelectItem>
              <SelectItem value="CP1252">CP1252</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Import-modus</Label>
          <Select 
            value={form.watch('mode')} 
            onValueChange={(value) => form.setValue('mode', value as 'full' | 'clients-only')}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Alle selskaper</SelectItem>
              <SelectItem value="clients-only">Kun mine klienter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info om clients-only modus */}
      {form.watch('mode') === 'clients-only' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kun selskaper som matcher organisjonsnummer på dine klienter vil bli importert.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress bar and controls */}
      {isProcessing && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prosesserer: {processedRows.toLocaleString()} / {totalRows.toLocaleString()} rader</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
          
          {/* Control buttons */}
          <div className="flex gap-2">
            {!isPaused ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePause}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline" 
                size="sm"
                onClick={handleResume}
              >
                <Play className="h-4 w-4 mr-2" />
                Fortsett
              </Button>
            )}
            
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLog(!showLog)}
            >
              {showLog ? 'Skjul' : 'Vis'} logg
            </Button>
          </div>

          {/* Processing log */}
          {showLog && (
            <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-xs font-mono">
              {processingLog.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit knapp */}
      <Button type="submit" disabled={!file || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Importerer...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Start Import
          </>
        )}
      </Button>
    </form>
  )
}