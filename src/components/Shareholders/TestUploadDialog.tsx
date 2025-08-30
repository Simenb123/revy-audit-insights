import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { parseXlsxSafely, getWorksheetDataSafely } from '@/utils/secureXlsx'
import Papa from 'papaparse'

interface TestUploadDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
}

interface ColumnMapping {
  detected: string
  mapped: string
  confidence: 'high' | 'medium' | 'low'
  hasData: boolean
}

export const TestUploadDialog: React.FC<TestUploadDialogProps> = ({
  isOpen,
  onOpenChange,
  file
}) => {
  const [testRows, setTestRows] = useState(100)
  const [isProcessing, setIsProcessing] = useState(false)
  const [testResult, setTestResult] = useState<{
    totalRows: number
    sampleRows: any[]
    columnMappings: ColumnMapping[]
    issues: string[]
  } | null>(null)

  const normalizeHeader = (header: string): string => {
    return header.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
  }

  const detectColumnMapping = (headers: string[], sampleData: any[]): ColumnMapping[] => {
    const expectedColumns = [
      { key: 'orgnr', variations: ['orgnr', 'organisasjonsnummer', 'org_nr', 'A'] },
      { key: 'selskap', variations: ['navn', 'selskapsnavn', 'company_name', 'selskap', 'B'] },
      { key: 'aksjeklasse', variations: ['aksjeklasse', 'share_class', 'C'] },
      { key: 'navn_aksjonaer', variations: ['aksjonaer', 'eier', 'holder', 'navn_aksjonaer', 'navn aksjonær', 'D'] },
      { key: 'fodselsar_orgnr', variations: ['eier_orgnr', 'holder_orgnr', 'fodselsar_orgnr', 'fødselsår/orgnr', 'E'] },
      { key: 'landkode', variations: ['landkode', 'country_code', 'G'] },
      { key: 'antall_aksjer', variations: ['aksjer', 'shares', 'antall_aksjer', 'antall aksjer', 'H'] },
      { key: 'antall_aksjer_selskap', variations: ['antall_aksjer_selskap', 'total_shares', 'I'] }
    ]

    return expectedColumns.map(expected => {
      let bestMatch = ''
      let confidence: 'high' | 'medium' | 'low' = 'low'
      
      // Find best matching header
      for (const header of headers) {
        const normalizedHeader = normalizeHeader(header)
        
        for (const variation of expected.variations) {
          const normalizedVariation = normalizeHeader(variation)
          
          if (normalizedHeader === normalizedVariation) {
            bestMatch = header
            confidence = 'high'
            break
          } else if (normalizedHeader.includes(normalizedVariation) || normalizedVariation.includes(normalizedHeader)) {
            if (bestMatch === '' || confidence === 'low') {
              bestMatch = header
              confidence = 'medium'
            }
          }
        }
        if (confidence === 'high') break
      }

      // Check if column has actual data
      const hasData = sampleData.some(row => {
        const value = bestMatch ? row[bestMatch] : null
        return value && String(value).trim().length > 0
      })

      return {
        detected: bestMatch || 'Ikke funnet',
        mapped: expected.key,
        confidence,
        hasData
      }
    })
  }

  const runTest = async () => {
    if (!file) return

    setIsProcessing(true)
    setTestResult(null)

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls'

      let sampleData: any[] = []
      let totalRows = 0

      if (isExcel) {
        const workbook = await parseXlsxSafely(file)
        const worksheetData = getWorksheetDataSafely(workbook)
        totalRows = worksheetData.length
        sampleData = worksheetData.slice(0, Math.min(testRows, worksheetData.length))
      } else {
        // For CSV, we need to parse the entire file to get total rows
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        totalRows = lines.length - 1 // Subtract header row

        // Parse just the sample rows
        const sampleText = lines.slice(0, Math.min(testRows + 1, lines.length)).join('\n')
        const parsed = Papa.parse(sampleText, { header: true, skipEmptyLines: true })
        sampleData = parsed.data as any[]
      }

      // Get headers from first row
      const headers = sampleData.length > 0 ? Object.keys(sampleData[0]) : []
      
      // Detect column mappings
      const columnMappings = detectColumnMapping(headers, sampleData)
      
      // Identify issues
      const issues: string[] = []
      
      if (sampleData.length === 0) {
        issues.push('Ingen data funnet i filen')
      }
      
      if (headers.length === 0) {
        issues.push('Ingen kolonner funnet')
      }
      
      const criticalColumns = ['orgnr', 'selskap', 'navn_aksjonaer', 'antall_aksjer']
      const missingCritical = columnMappings
        .filter(m => criticalColumns.includes(m.mapped) && (m.detected === 'Ikke funnet' || !m.hasData))
        .map(m => m.mapped)
      
      if (missingCritical.length > 0) {
        issues.push(`Mangler kritiske kolonner: ${missingCritical.join(', ')}`)
      }
      
      const lowConfidence = columnMappings.filter(m => m.confidence === 'low' && m.detected !== 'Ikke funnet')
      if (lowConfidence.length > 0) {
        issues.push(`Usikker kolonne-mapping for: ${lowConfidence.map(m => m.mapped).join(', ')}`)
      }

      setTestResult({
        totalRows,
        sampleRows: sampleData.slice(0, 10), // Show first 10 rows for preview
        columnMappings,
        issues
      })

    } catch (error: any) {
      setTestResult({
        totalRows: 0,
        sampleRows: [],
        columnMappings: [],
        issues: [`Feil ved lesing av fil: ${error.message}`]
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-600'
      case 'medium': return 'text-amber-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'low': return <XCircle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Test Fil Opplasting
          </DialogTitle>
          <DialogDescription>
            Test de første radene av filen for å validere kolonne-mapping og dataformat før full import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-rows">Antall rader å teste</Label>
                <Input
                  id="test-rows"
                  type="number"
                  value={testRows}
                  onChange={(e) => setTestRows(parseInt(e.target.value) || 100)}
                  min={10}
                  max={1000}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={runTest}
                  disabled={!file || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Tester...' : 'Start Test'}
                </Button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-6">
              {/* Issues */}
              {testResult.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Problemer funnet:</div>
                      <ul className="list-disc list-inside text-sm">
                        {testResult.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* File Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fil Oversikt</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground">Totalt antall rader:</div>
                      <div className="font-medium">{testResult.totalRows.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Testet rader:</div>
                      <div className="font-medium">{testResult.sampleRows.length.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column Mappings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Kolonne Mapping</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResult.columnMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{mapping.mapped}</div>
                          <div className="text-sm text-muted-foreground">
                            {mapping.detected === 'Ikke funnet' ? 'Ikke funnet' : `Mappes til: ${mapping.detected}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {mapping.hasData && (
                            <Badge variant="outline" className="text-xs">
                              Har data
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            {getConfidenceIcon(mapping.confidence)}
                            <span className={`text-xs font-medium ${getConfidenceColor(mapping.confidence)}`}>
                              {mapping.confidence}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sample Data Preview */}
              {testResult.sampleRows.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Data Forhåndsvisning (første 10 rader)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(testResult.sampleRows[0]).map((header, index) => (
                              <th key={index} className="text-left p-2 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.sampleRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b">
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="p-2 text-muted-foreground">
                                  {String(value).slice(0, 50)}
                                  {String(value).length > 50 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}