import React, { useRef, useState } from 'react'
import { Upload, FileText, BarChart3, Users, DollarSign, Calendar, Building2, Clock, AlertTriangle, CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { usePayrollImports, usePayrollSummary, useCreatePayrollImport, useDeletePayrollImport } from '@/hooks/usePayrollImports'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PayrollImporterProps {
  clientId: string;
  clientName: string;
}

export default function PayrollImporter({ clientId, clientName }: PayrollImporterProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const { selectedFiscalYear } = useFiscalYear()
  const [periodKey, setPeriodKey] = useState(() => selectedFiscalYear.toString())
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Use the passed clientId instead of selectedClientId
  const { toast } = useToast()
  
  const { data: imports = [], isLoading } = usePayrollImports(clientId)
  const { data: summary } = usePayrollSummary(selectedImportId)
  const createImport = useCreatePayrollImport()
  const deleteImport = useDeletePayrollImport()

  const handleFileUpload = async (file: File) => {
    if (!clientId) {
      toast({
        title: "Feil",
        description: "Du må velge en klient først",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      
      // Extract period from correct A07 JSON structure
      let extractedPeriod = periodKey
      let fomPeriod = ''
      let tomPeriod = ''
      
      // Use correct paths based on actual A07 structure
      if (json.mottatt?.fomKalendermaaned && json.mottatt?.tomKalendermaaned) {
        fomPeriod = json.mottatt.fomKalendermaaned // Format: "2024-01"
        tomPeriod = json.mottatt.tomKalendermaaned   // Format: "2024-12"
        extractedPeriod = `${fomPeriod}..${tomPeriod}`
      }
      
      await createImport.mutateAsync({
        client_id: clientId,
        period_key: extractedPeriod,
        file_name: file.name,
        payrollData: json
      })
      
      // Update the period key field with extracted period
      setPeriodKey(extractedPeriod)
      
      toast({
        title: "Import fullført",
        description: `A07-lønnsdata importert for periode ${fomPeriod} til ${tomPeriod}`
      })
    } catch (error: any) {
      console.error('Import error:', error)
      toast({
        title: "Import feilet",
        description: error.message || "Ukjent feil under import",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleChoose = () => fileRef.current?.click()

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/json') {
      await handleFileUpload(file)
    } else {
      toast({
        title: "Ugyldig fil",
        description: "Kun JSON-filer er støttet",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (importId: string) => {
    try {
      await deleteImport.mutateAsync({ importId, clientId })
      if (selectedImportId === importId) {
        setSelectedImportId(null)
      }
      toast({
        title: "Import slettet",
        description: "Lønnsdata har blitt slettet"
      })
    } catch (error: any) {
      toast({
        title: "Sletting feilet",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO')
  }

  if (!clientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            A07 Lønnsdata Import
          </CardTitle>
          <CardDescription>
            Du må velge en klient før du kan importere lønnsdata
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import A07 Lønnsdata
          </CardTitle>
          <CardDescription>
            Last opp JSON-fil med A07-lønnsdata for analyse og revisjon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="period-key">Periode</Label>
              <Input
                id="period-key"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                placeholder="f.eks. 2024 eller 2024-01..12"
              />
            </div>
            <div>
              <Label>Velg måned (alternativ)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Velg dato</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      if (date) {
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        setPeriodKey(`${year}-${month}`)
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    e.target.value = '' // Reset for re-upload
                    await handleFileUpload(file)
                  }
                }}
              />
              <Button onClick={handleChoose} disabled={isUploading} className="w-full">
                {isUploading ? 'Importerer...' : 'Velg JSON-fil'}
              </Button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Slipp A07-JSON fil her, eller klikk «Velg JSON-fil»
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Existing Imports */}
      {imports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Eksisterende Importer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {imports.map((imp) => (
                <div
                  key={imp.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                    selectedImportId === imp.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedImportId(imp.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {imp.fom_kalendermaaned && imp.tom_kalendermaaned 
                          ? `${imp.fom_kalendermaaned} - ${imp.tom_kalendermaaned}`
                          : imp.period_key
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {imp.file_name} • Importert {formatDate(imp.created_at)}
                      </p>
                      {imp.navn && (
                        <p className="text-xs text-muted-foreground">
                          {imp.navn} ({imp.orgnr})
                        </p>
                      )}
                      {imp.antall_personer_innrapportert && (
                        <p className="text-xs text-muted-foreground">
                          {imp.antall_personer_innrapportert} ansatte innrapportert
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {imp.avstemmingstidspunkt 
                        ? `Avstemt ${formatDate(imp.avstemmingstidspunkt)}`
                        : 'Importert'
                      }
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(imp.id)
                      }}
                    >
                      Slett
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary for Selected Import */}
      {selectedImportId && summary && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Virksomheter</p>
                    <p className="text-2xl font-bold">{summary.antVirks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Inntektsmottakere</p>
                    <p className="text-2xl font-bold">{summary.antMott}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bruttolønn</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.bruttolonn)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Økonomisk Oversikt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Forskuddstrekk (person):</span>
                  <span className="font-medium">{formatCurrency(summary.trekkPerson)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Forskuddstrekk (innsendinger):</span>
                  <span className="font-medium">{formatCurrency(summary.trekkInns)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">AGA (innsendinger):</span>
                  <span className="font-medium">{formatCurrency(summary.agaInns)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Employment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Arbeidsforhold
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Aktive i perioden:</span>
                  <span className="font-medium">{summary.afAktive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Nye i perioden:</span>
                  <span className="font-medium">{summary.afNye}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sluttede i perioden:</span>
                  <span className="font-medium">{summary.afSlutt}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AGA by Zone */}
          {Object.keys(summary.soner).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Arbeidsgiveravgift per Sone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(summary.soner).map(([sone, data]) => (
                    <div key={sone} className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">Sone {sone}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Grunnlag:</span>
                          <span>{formatCurrency(data.grunnlag)}</span>
                        </div>
                        {data.sats != null && (
                          <>
                            <div className="flex justify-between">
                              <span>Sats:</span>
                              <span>{data.sats}%</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Beløp:</span>
                              <span>{formatCurrency(data.belop || 0)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Instruksjoner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• Last opp A07 JSON-fil for å importere lønnsdata</p>
            <p>• Data lagres sikkert og kan brukes i revisjonshandlinger</p>
            <p>• Personnummer (FNR) lagres ikke for GDPR-sikkerhet</p>
            <p>• Alle beregninger gjøres automatisk etter import</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
