import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Database, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { parseXlsxSafely, getWorksheetDataSafely } from '@/utils/secureXlsx'
import * as XLSX from 'xlsx'

interface ParsedRow {
  company_orgnr: string
  company_name: string
  holder_name: string
  holder_orgnr?: string
  holder_birth_year?: number
  holder_country?: string
  share_class: string
  shares: number
  raw_row: any
}

interface PreviewData {
  data: ParsedRow[]
  stats: {
    totalRows: number
    companies: number
    holders: number
    totalShares: number
  }
}

export const ShareholdersUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [isDragging, setIsDragging] = useState(false)
  const [step, setStep] = useState<'select' | 'preview' | 'upload' | 'success'>('select')
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [uploadStats, setUploadStats] = useState<{imported: number, errors: number} | null>(null)

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    const extension = selectedFile.name.toLowerCase().split('.').pop()
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      toast.error("Ugyldig filtype. Vennligst velg en CSV eller Excel-fil (.csv, .xlsx, .xls)")
      return
    }

    // Validate file size (max 100MB for frontend processing)
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error("Filen er for stor. Maksimal filstørrelse er 100MB for frontend-prosessering")
      return
    }

    setFile(selectedFile)
    
    // Parse file immediately for preview
    try {
      await parseFileForPreview(selectedFile)
    } catch (error) {
      console.error('File parsing error:', error)
      toast.error('Feil ved lesing av fil: ' + (error as Error).message)
      setFile(null)
    }
  }

  const parseFileForPreview = async (file: File) => {
    let rawData: any[] = []
    
    const extension = file.name.toLowerCase().split('.').pop()
    
    if (extension === 'csv') {
      // Parse CSV
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(';').map(h => h.trim())
      
      rawData = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(';')
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || ''
        })
        return row
      })
    } else {
      // Parse Excel
      const workbook = await parseXlsxSafely(file)
      rawData = getWorksheetDataSafely(workbook)
    }

    if (rawData.length === 0) {
      throw new Error('Ingen data funnet i filen')
    }

    // Parse and validate data
    const parsedData = parseShareholderData(rawData)
    if (parsedData.length === 0) {
      throw new Error('Ingen gyldig aksjonærdata funnet. Kontroller at filen har riktig format.')
    }

    // Calculate statistics
    const companies = new Set(parsedData.map(r => r.company_orgnr)).size
    const holders = new Set(parsedData.map(r => r.holder_name + r.holder_orgnr)).size
    const totalShares = parsedData.reduce((sum, r) => sum + r.shares, 0)

    setPreviewData({
      data: parsedData,
      stats: {
        totalRows: parsedData.length,
        companies,
        holders,
        totalShares
      }
    })
    
    setStep('preview')
  }

  const parseShareholderData = (rawData: any[]): ParsedRow[] => {
    const results: ParsedRow[] = []
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      
      // Skip empty rows
      if (!row || Object.values(row).every(v => !v || v === '')) continue
      
      try {
        // Extract data using flexible field mapping
        const companyOrgnr = extractField(row, ['orgnr', 'organisasjonsnummer', 'company_orgnr', 'selskap_orgnr'])
        const companyName = extractField(row, ['selskap', 'company_name', 'navn', 'selskapsnavn'])
        const holderName = extractField(row, ['aksjonær', 'holder_name', 'eier', 'name', 'navn'])
        const shareClass = extractField(row, ['aksjeklasse', 'share_class', 'klasse']) || 'Ordinære'
        const sharesStr = extractField(row, ['aksjer', 'shares', 'antall_aksjer', 'antall'])
        
        // Validate required fields
        if (!companyOrgnr || !holderName || !sharesStr) continue
        
        // Parse shares as integer
        const shares = parseInt(sharesStr.toString().replace(/[^0-9]/g, ''))
        if (isNaN(shares) || shares <= 0) continue
        
        // Try to extract holder org number (if company holder)
        const holderOrgnr = extractField(row, ['eier_orgnr', 'holder_orgnr', 'organisasjonsnummer_eier'])
        
        // Try to extract birth year (if person holder)
        const birthYearStr = extractField(row, ['fødselstall', 'birth_year', 'fødselsår'])
        const birthYear = birthYearStr ? parseInt(birthYearStr.toString().substring(0, 4)) : undefined
        
        // Extract country
        const country = extractField(row, ['land', 'country', 'landkode']) || 'NO'
        
        results.push({
          company_orgnr: companyOrgnr,
          company_name: companyName || `Selskap ${companyOrgnr}`,
          holder_name: holderName,
          holder_orgnr: holderOrgnr || undefined,
          holder_birth_year: birthYear,
          holder_country: country,
          share_class: shareClass,
          shares,
          raw_row: row
        })
      } catch (error) {
        console.warn(`Error parsing row ${i}:`, error)
        continue
      }
    }
    
    return results
  }

  const extractField = (row: any, fieldNames: string[]): string | null => {
    for (const fieldName of fieldNames) {
      // Try exact match first
      if (row[fieldName]) return row[fieldName].toString().trim()
      
      // Try case-insensitive match
      const keys = Object.keys(row)
      const matchedKey = keys.find(key => key.toLowerCase() === fieldName.toLowerCase())
      if (matchedKey && row[matchedKey]) return row[matchedKey].toString().trim()
      
      // Try partial match
      const partialKey = keys.find(key => key.toLowerCase().includes(fieldName.toLowerCase()))
      if (partialKey && row[partialKey]) return row[partialKey].toString().trim()
    }
    return null
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

  const handleConfirmUpload = async () => {
    if (!previewData || !file) return
    
    setStep('upload')
    setProcessing(true)
    setUploadProgress(0)

    try {
      let imported = 0
      let errors = 0
      const batchSize = 500 // Process in smaller batches
      const batches = Math.ceil(previewData.data.length / batchSize)
      
      // Process data in batches to avoid memory issues
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startIndex = batchIndex * batchSize
        const endIndex = Math.min(startIndex + batchSize, previewData.data.length)
        const batchData = previewData.data.slice(startIndex, endIndex)
        
        try {
          const result = await processBatch(batchData, year, batchIndex + 1, batches)
          imported += result.imported
          errors += result.errors
          
          // Update progress
          const progress = Math.round(((batchIndex + 1) / batches) * 100)
          setUploadProgress(progress)
          
        } catch (error) {
          console.error(`Batch ${batchIndex + 1} failed:`, error)
          errors += batchData.length
        }
      }
      
      setUploadStats({ imported, errors })
      setStep('success')
      
      toast.success(`Import fullført! ${imported} rader importert${errors > 0 ? `, ${errors} feil` : ''}`)
      
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Import feilet: ' + (error as Error).message)
      setStep('preview')
    } finally {
      setProcessing(false)
    }
  }

  const processBatch = async (batchData: ParsedRow[], year: number, batchNum: number, totalBatches: number) => {
    // Call simplified edge function for batch processing
    const { data, error } = await supabase.functions.invoke('shareholders-simple-import', {
      body: {
        data: batchData,
        year,
        batchInfo: { current: batchNum, total: totalBatches }
      }
    })

    if (error) {
      throw new Error(`Batch ${batchNum} failed: ${error.message}`)
    }

    return data
  }

  const resetUpload = () => {
    setFile(null)
    setStep('select')
    setPreviewData(null)
    setUploadProgress(0)
    setProcessing(false)
    setUploadStats(null)
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
            Last opp CSV eller Excel-filer fra Skatteetaten. Maksimal filstørrelse er 100MB.
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
              disabled={step === 'upload' || processing}
            />
          </div>

          {step === 'select' && (
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
                CSV, Excel (.xlsx, .xls) - maks 100MB
              </p>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{file?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {previewData.stats.totalRows.toLocaleString()} rader · {previewData.stats.companies} selskaper · {previewData.stats.holders} eiere
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetUpload}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Forhåndsvisning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{previewData.stats.totalRows.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Rader</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{previewData.stats.companies.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Selskaper</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{previewData.stats.holders.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Eiere</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{previewData.stats.totalShares.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Aksjer</div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-2 text-sm font-medium">
                      Første 5 rader:
                    </div>
                    <div className="divide-y">
                      {previewData.data.slice(0, 5).map((row, index) => (
                        <div key={index} className="p-3 text-sm">
                          <div><strong>{row.company_name}</strong> ({row.company_orgnr})</div>
                          <div className="text-muted-foreground">
                            {row.holder_name} · {row.shares.toLocaleString()} {row.share_class} aksjer
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={() => setStep('select')} variant="outline" className="flex-1">
                  Velg ny fil
                </Button>
                <Button onClick={handleConfirmUpload} className="flex-1">
                  <Database className="h-4 w-4 mr-2" />
                  Importer data
                </Button>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Importerer aksjonærdata...</div>
                <Progress value={uploadProgress} className="w-full" />
                <div className="text-sm text-muted-foreground mt-2">
                  {uploadProgress}% fullført
                </div>
              </div>
            </div>
          )}

          {step === 'success' && uploadStats && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import fullført! {uploadStats.imported.toLocaleString()} rader importert
                  {uploadStats.errors > 0 && `, ${uploadStats.errors} feil`}.
                </AlertDescription>
              </Alert>
              
              <Button onClick={resetUpload} className="w-full">
                Last opp ny fil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}