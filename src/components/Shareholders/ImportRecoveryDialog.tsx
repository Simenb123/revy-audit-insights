import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'

import { checkImportRecovery, finishImportBatch } from '@/services/shareholders'

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
  sessionId,
  year,
  isGlobal = false,
  onRecoveryComplete
}) => {
  const { toast } = useToast()
  const [recoveryStatus, setRecoveryStatus] = useState<any>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryProgress, setRecoveryProgress] = useState(0)
  const [recoveryLog, setRecoveryLog] = useState<string[]>([])

  // Add log entry
  const addLog = (message: string) => {
    setRecoveryLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Check recovery status
  const checkStatusMutation = useMutation({
    mutationFn: () => checkImportRecovery(sessionId, year, isGlobal),
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
        const result = await finishImportBatch(sessionId, year, isGlobal, batchSize, offset)
        
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
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Informasjon</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div><strong>Session ID:</strong> {sessionId}</div>
              <div><strong>År:</strong> {year}</div>
              <div><strong>Type:</strong> {isGlobal ? 'Global' : 'Bruker'}</div>
            </CardContent>
          </Card>

          {/* Status Check */}
          <div className="space-y-4">
            <Button 
              onClick={() => checkStatusMutation.mutate()} 
              disabled={checkStatusMutation.isPending || isRecovering}
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