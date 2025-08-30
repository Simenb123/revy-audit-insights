import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Users, 
  Building2, 
  TrendingUp,
  RotateCcw,
  Download,
  Eye,
  Search
} from 'lucide-react'

interface ImportVerificationProps {
  year: number
  sessionId?: string
}

interface VerificationData {
  file_analysis: {
    total_files: number
    total_file_rows: number
    processed_files: number
    failed_files: number
  }
  database_counts: {
    companies: number
    holdings: number
    entities: number
    duplicates: number
  }
  data_integrity: {
    orphaned_holdings: number
    missing_companies: number
    invalid_orgnr: number
    data_quality_score: number
  }
  import_history: Array<{
    session_id: string
    start_time: string
    end_time: string | null
    status: string
    processed_rows: number
    error_count: number
  }>
}

export function ImportVerificationDashboard({ year, sessionId }: ImportVerificationProps) {
  const [verification, setVerification] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVerificationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: verifyError } = await supabase.rpc('get_import_verification' as any, {
        p_year: year,
        p_session_id: sessionId
      })

      if (verifyError) throw verifyError

      setVerification(data as VerificationData)
    } catch (err) {
      console.error('Error fetching verification data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch verification data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerificationData()
  }, [year, sessionId])

  const getDataQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDataQualityBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Utmerket</Badge>
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Bra</Badge>
    return <Badge variant="destructive">Trenger Oppmerksomhet</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Analyserer importerte data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !verification) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-destructive">{error || 'Ingen verifikasjonsdata funnet'}</p>
            <Button onClick={fetchVerificationData} variant="outline" size="sm">
              Prøv igjen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completionRate = verification.file_analysis.total_file_rows > 0 
    ? (verification.database_counts.holdings / verification.file_analysis.total_file_rows) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Import Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-2xl font-bold">{completionRate.toFixed(1)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {verification.database_counts.holdings.toLocaleString()} / {verification.file_analysis.total_file_rows.toLocaleString()} rader
                </p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Datakvalitet</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-2xl font-bold ${getDataQualityColor(verification.data_integrity.data_quality_score)}`}>
                    {verification.data_integrity.data_quality_score}%
                  </span>
                </div>
                <div className="mt-1">
                  {getDataQualityBadge(verification.data_integrity.data_quality_score)}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duplikater</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-bold text-amber-600">
                    {verification.database_counts.duplicates.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {((verification.database_counts.duplicates / verification.file_analysis.total_file_rows) * 100).toFixed(1)}% av totalt
                </p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Problemer</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-bold text-red-600">
                    {verification.data_integrity.orphaned_holdings + verification.data_integrity.missing_companies + verification.data_integrity.invalid_orgnr}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Krever oppmerksomhet
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Sammendrag</TabsTrigger>
          <TabsTrigger value="integrity">Data Integritet</TabsTrigger>
          <TabsTrigger value="history">Import Historikk</TabsTrigger>
          <TabsTrigger value="actions">Handlinger</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Import Sammendrag
              </CardTitle>
              <CardDescription>
                Oversikt over importerte data for år {year}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">FILE ANALYSE</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Totalt filer:</span>
                      <span className="font-medium">{verification.file_analysis.total_files}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Prosesserte filer:</span>
                      <span className="font-medium text-green-600">{verification.file_analysis.processed_files}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Feilede filer:</span>
                      <span className="font-medium text-red-600">{verification.file_analysis.failed_files}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Totalt rader i filer:</span>
                      <span className="font-medium">{verification.file_analysis.total_file_rows.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">DATABASE INNHOLD</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Selskaper:</span>
                      <span className="font-medium">{verification.database_counts.companies.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Eierandeler:</span>
                      <span className="font-medium">{verification.database_counts.holdings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Eiere:</span>
                      <span className="font-medium">{verification.database_counts.entities.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Duplikater:</span>
                      <span className="font-medium text-amber-600">{verification.database_counts.duplicates.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">FULLFØRELSE</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Import rate:</span>
                        <span className="font-medium">{completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {verification.database_counts.holdings >= verification.file_analysis.total_file_rows 
                        ? '✅ Alle rader importert successfully' 
                        : `⚠️ ${verification.file_analysis.total_file_rows - verification.database_counts.holdings} rader ikke importert`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Data Integritetsanalyse
              </CardTitle>
              <CardDescription>
                Detaljert analyse av datakvalitet og mulige problemer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">IDENTIFISERTE PROBLEMER</h4>
                  <div className="space-y-3">
                    {verification.data_integrity.orphaned_holdings > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Foreldreløse eierandeler</span>
                        </div>
                        <Badge variant="destructive">{verification.data_integrity.orphaned_holdings}</Badge>
                      </div>
                    )}
                    
                    {verification.data_integrity.missing_companies > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Manglende selskaper</span>
                        </div>
                        <Badge variant="destructive">{verification.data_integrity.missing_companies}</Badge>
                      </div>
                    )}
                    
                    {verification.data_integrity.invalid_orgnr > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Ugyldige organisasjonsnummer</span>
                        </div>
                        <Badge variant="destructive">{verification.data_integrity.invalid_orgnr}</Badge>
                      </div>
                    )}
                    
                    {verification.data_integrity.orphaned_holdings === 0 && 
                     verification.data_integrity.missing_companies === 0 && 
                     verification.data_integrity.invalid_orgnr === 0 && (
                      <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-medium text-green-800 dark:text-green-400">
                            Ingen data-integritetsroblemer funnet!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">KVALITETSINDIKATORER</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Samlet Datakvalitet</span>
                        <span className={`text-lg font-bold ${getDataQualityColor(verification.data_integrity.data_quality_score)}`}>
                          {verification.data_integrity.data_quality_score}%
                        </span>
                      </div>
                      <Progress 
                        value={verification.data_integrity.data_quality_score} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Basert på data-integritet, duplikatrate og importkomplettering
                      </p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Duplikat-rate: {((verification.database_counts.duplicates / verification.file_analysis.total_file_rows) * 100).toFixed(2)}%</p>
                      <p>• Import-rate: {completionRate.toFixed(2)}%</p>
                      <p>• Feil-rate: {((verification.data_integrity.orphaned_holdings + verification.data_integrity.missing_companies + verification.data_integrity.invalid_orgnr) / verification.file_analysis.total_file_rows * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Import Historikk
              </CardTitle>
              <CardDescription>
                Historikk over tidligere import-sesjoner for år {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verification.import_history.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  Ingen import-historikk funnet for dette året.
                </p>
              ) : (
                <div className="space-y-3">
                  {verification.import_history.map((session, index) => (
                    <div key={session.session_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">{session.session_id}</span>
                          <Badge variant={session.status === 'completed' ? 'default' : session.status === 'failed' ? 'destructive' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {session.processed_rows.toLocaleString()} rader
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Start: {new Date(session.start_time).toLocaleString()}</p>
                        {session.end_time && (
                          <p>Slutt: {new Date(session.end_time).toLocaleString()}</p>
                        )}
                        {session.error_count > 0 && (
                          <p className="text-red-600">{session.error_count} feil</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Tilgjengelige Handlinger
              </CardTitle>
              <CardDescription>
                Handlinger du kan utføre basert på verifikasjonsresultatene
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Last ned verifikasjonsrapport
                </Button>
                
                <Button variant="outline" className="justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Vis problematiske poster
                </Button>
                
                <Button variant="outline" className="justify-start" disabled>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rull tilbake import
                </Button>
                
                <Button variant="outline" onClick={fetchVerificationData} className="justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Oppdater analyse
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Anbefalte Neste Steg:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {verification.data_integrity.data_quality_score >= 90 && (
                    <li>✅ Data kvaliteten er utmerket. Ingen handling nødvendig.</li>
                  )}
                  {verification.data_integrity.data_quality_score < 90 && verification.data_integrity.data_quality_score >= 70 && (
                    <li>⚠️ Vurder å gjennomgå og korrigere identifiserte problemer.</li>
                  )}
                  {verification.data_integrity.data_quality_score < 70 && (
                    <li>🚨 Anbefaler å undersøke og korrigere data-problemer før videre bruk.</li>
                  )}
                  {verification.database_counts.duplicates > (verification.file_analysis.total_file_rows * 0.1) && (
                    <li>📋 Høy duplikat-rate kan indikere behov for data-berensing.</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}