import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { checkImportRecovery, finishImportBatch } from '@/services/shareholders'
import { useSessionStorage } from '@/hooks/useSessionStorage'

interface ImportRecoveryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  year: number
  isGlobal?: boolean
  onRecoveryComplete?: () => void
}

export const ImportRecoveryDialog: React.FC<ImportRecoveryDialogProps> = ({
  isOpen,
  onOpenChange,
  sessionId: initialSessionId,
  year,
  isGlobal = false,
  onRecoveryComplete
}) => {
  const { toast } = useToast()
  const { sessions } = useSessionStorage()
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessionId || '')
  const [recoveryStatus, setRecoveryStatus] = useState<any>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryProgress, setRecoveryProgress] = useState(0)
  const [recoveryLog, setRecoveryLog] = useState<string[]>([])

  // Get available sessions for the year
  const availableSessions = sessions.filter(s => 
    s.year === year && s.isGlobal === isGlobal
  )

  // Use selected session ID or fallback to initial
  const activeSessionId = selectedSessionId || initialSessionId

  // Add log entry
  const addLog = (message: string) => {
    setRecoveryLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Check recovery status
  const checkStatusMutation = useMutation({
    mutationFn: () => checkImportRecovery(activeSessionId, year, isGlobal),
    onSuccess: (result) => {
      setRecoveryStatus(result.status)
      addLog(`Status sjekket: ${result.status.companies_count} selskaper, ${result.status.holdings_count} eierandeler`)
      if (result.needs_aggregation) {
        addLog('Aggregering av totalverdier er nødvendig')
      } else {
        addLog('Alle data er allerede aggregert')
      }
    },
    onError: (error) => {
      toast({
        title: 'Kunne ikke sjekke status',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Recover import process
  const recoveryMutation = useMutation({
    mutationFn: async () => {
      setIsRecovering(true)
      setRecoveryProgress(0)
      setRecoveryLog([])
      
      let offset = 0
      const batchSize = 1000
      let hasMore = true
      let totalProcessed = 0

      addLog('Starter recovery prosess...')

      while (hasMore) {
        const result = await finishImportBatch(activeSessionId, year, isGlobal, batchSize, offset)
        
        totalProcessed += result.batch_result.processed_count
        const progress = Math.min(100, (totalProcessed / result.batch_result.total_companies) * 100)
        setRecoveryProgress(progress)
        
        addLog(`Batch ${offset / batchSize + 1}: Prosesserte ${result.batch_result.processed_count} selskaper`)
        
        hasMore = result.batch_result.has_more
        offset += batchSize

        if (result.completed && result.summary) {
          addLog(`Recovery fullført! ${result.summary.companies} selskaper, ${result.summary.holdings} eierandeler`)
          return result.summary
        }

        // Prevent infinite loops
        if (offset > 500000) {
          addLog('Recovery limit nådd, stopper')
          break
        }
      }

      return { companies: totalProcessed, holdings: recoveryStatus?.holdings_count || 0 }
    },
    onSuccess: (summary) => {
      setIsRecovering(false)
      setRecoveryProgress(100)
      toast({
        title: 'Recovery fullført',
        description: `${summary.companies} selskaper prosessert`,
      })
      onRecoveryComplete?.()
    },
    onError: (error) => {
      setIsRecovering(false)
      addLog(`FEIL: ${error.message}`)
      toast({
        title: 'Recovery feilet',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Import Recovery
          </DialogTitle>
          <DialogDescription>
            Gjenopprett en import session som ikke ble fullført på grunn av timeout eller andre feil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Valg</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableSessions.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Velg Session:</label>
                  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg en session..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSessions.map(session => (
                        <SelectItem key={session.sessionId} value={session.sessionId}>
                          <div className="flex flex-col">
                            <span>{session.fileName}</span>
                            <span className="text-xs text-muted-foreground">
                              {session.sessionId} - {new Date(session.startedAt).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    Ingen aktive sessions funnet for år {year}. Prøv å starte en ny import først.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Session ID:</strong> {activeSessionId || 'Ikke valgt'}</div>
                <div><strong>År:</strong> {year}</div>
                <div><strong>Type:</strong> {isGlobal ? 'Global' : 'Bruker'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Status Check */}
          <div className="space-y-4">
            <Button 
              onClick={() => checkStatusMutation.mutate()} 
              disabled={checkStatusMutation.isPending || isRecovering || !activeSessionId}
              className="w-full"
            >
              {checkStatusMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sjekker status...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sjekk Import Status
                </>
              )}
            </Button>

            {recoveryStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {recoveryStatus.needs_aggregation ? (
                      <XCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    Import Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground">Selskaper:</div>
                      <div className="font-medium">{recoveryStatus.companies_count.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Eierandeler:</div>
                      <div className="font-medium">{recoveryStatus.holdings_count.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Eiere:</div>
                      <div className="font-medium">{recoveryStatus.entities_count.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Aggregering:</div>
                      <div className={`font-medium ${recoveryStatus.needs_aggregation ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {recoveryStatus.needs_aggregation ? 'Nødvendig' : 'Fullført'}
                      </div>
                    </div>
                  </div>

                  {recoveryStatus.needs_aggregation && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Data er importert men totalverdier må aggregeres. Trykk "Start Recovery" for å fullføre prosessen.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recovery Process */}
          {recoveryStatus?.needs_aggregation && (
            <div className="space-y-4">
              <Button 
                onClick={() => recoveryMutation.mutate()} 
                disabled={recoveryMutation.isPending || isRecovering}
                className="w-full"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gjennoppretter...
                  </>
                ) : (
                  'Start Recovery'
                )}
              </Button>

              {isRecovering && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Recovery Progress</span>
                    <span>{Math.round(recoveryProgress)}%</span>
                  </div>
                  <Progress value={recoveryProgress} />
                </div>
              )}
            </div>
          )}

          {/* Recovery Log */}
          {recoveryLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recovery Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded p-3 max-h-48 overflow-y-auto">
                  <div className="text-xs font-mono space-y-1">
                    {recoveryLog.map((log, index) => (
                      <div key={index} className="text-muted-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}