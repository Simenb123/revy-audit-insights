import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Building, Users, BarChart3, Database, Monitor } from 'lucide-react'
import { LargeDatasetUploader, AdvancedUploadProvider } from '@/components/Upload'
import { ShareholderAnalysis } from '@/components/Shareholders/ShareholderAnalysis'
import { EnhancedImportMonitor } from '@/components/Shareholders/EnhancedImportMonitor'
import { ImportVerificationDashboard } from '@/components/Shareholders/ImportVerificationDashboard'

export function ShareholderRegister() {
  const [currentYear] = useState(new Date().getFullYear())
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [totalFileRows, setTotalFileRows] = useState<number>(0)

  const handleUploadComplete = (sessionId: string, fileRows: number) => {
    setActiveSession(sessionId)
    setTotalFileRows(fileRows)
  }

  return (
    <AdvancedUploadProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aksjonærregister</h1>
            <p className="text-muted-foreground">
              Last opp og analyser aksjonærdata for {currentYear}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {currentYear}
          </Badge>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Systemet støtter CSV- og Excel-filer med aksjonærdata. Data behandles sikkert og er tilgjengelig kun for deg.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Last Opp
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Overvåkning
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Verifikasjon
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Analyse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importér Aksjonærdata
                </CardTitle>
                <CardDescription>
                  Last opp CSV- eller Excel-filer med aksjonærinformasjon. 
                  Systemet håndterer filer opp til 500MB med avansert batch-prosessering.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LargeDatasetUploader
                  uploadType="shareholders"
                  acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                  maxFileSize={500 * 1024 * 1024} // 500MB
                  enableWebWorker={true}
                  enableStreaming={true}
                  chunkSize={50000} // 50K rader per chunk
                  onComplete={(results) => {
                    // Map to existing callback format
                    const totalRows = results.reduce((sum, result) => sum + result.totalRows, 0)
                    const sessionId = `session-${Date.now()}`
                    handleUploadComplete(sessionId, totalRows)
                    console.log('Upload completed:', results);
                  }}
                  onProgress={(progress) => {
                    console.log('Upload progress:', progress);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <EnhancedImportMonitor 
              year={currentYear}
              sessionId={activeSession || undefined}
              totalFileRows={totalFileRows}
              onComplete={(summary) => {
                console.log('Import completed:', summary)
              }}
            />
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <ImportVerificationDashboard 
              year={currentYear}
              sessionId={activeSession || undefined}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Aksjonæranalyse
                </CardTitle>
                <CardDescription>
                  Analyser og visualiser aksjonærstrukturer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShareholderAnalysis year={currentYear} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdvancedUploadProvider>
  )
}