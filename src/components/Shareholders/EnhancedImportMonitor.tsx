import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle, Clock, FileText, Users, Building2, TrendingUp, Database } from 'lucide-react'

interface EnhancedImportMonitorProps {
  sessionId?: string
  year: number
  totalFileRows?: number
  onComplete?: (summary: any) => void
}

interface ImportSession {
  session_id: string
  total_file_rows: number
  processed_rows: number
  start_time: string
  status: 'active' | 'completed' | 'failed'
  current_batch: number
  total_batches: number
  errors_count: number
  duplicates_count: number
}

interface DetailedProgress {
  companies_count: number
  holdings_count: number
  entities_count: number
  needs_aggregation: boolean
  year: number
  processed_rows: number
  total_file_rows: number
  import_speed: number
  estimated_completion: string | null
  session: ImportSession | null
}

export function EnhancedImportMonitor({ sessionId, year, totalFileRows, onComplete }: EnhancedImportMonitorProps) {
  const [progress, setProgress] = useState<DetailedProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState<Date | null>(null)

  const fetchDetailedProgress = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get detailed import status
      const { data, error: statusError } = await (supabase as any).rpc('get_detailed_import_status', {
        p_session_id: sessionId || 'unknown',
        p_year: year,
        p_total_file_rows: totalFileRows || 0
      })

      if (statusError) {
        throw statusError
      }

      const progressData = data as unknown as DetailedProgress
      setProgress(progressData)
      setLastUpdated(new Date())
      
      // Set start time on first load if we have an active session
      if (progressData.session && !startTime) {
        setStartTime(new Date(progressData.session.start_time))
      }
      
      // Check if import is complete
      if (progressData && progressData.companies_count > 0 && !progressData.needs_aggregation) {
        onComplete?.(progressData)
      }

    } catch (err) {
      console.error('Error fetching detailed progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch progress')
    } finally {
      setLoading(false)
    }
  }, [sessionId, year, totalFileRows, onComplete, startTime])

  // Auto-refresh every 2 seconds during active import
  useEffect(() => {
    fetchDetailedProgress()
    
    const interval = setInterval(fetchDetailedProgress, 2000)
    
    return () => clearInterval(interval)
  }, [fetchDetailedProgress])

  // Real-time subscription to database changes
  useEffect(() => {
    const channel = supabase
      .channel('enhanced-import-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'share_holdings',
          filter: `year=eq.${year}`
        },
        () => {
          fetchDetailedProgress()
        }
      )
      .on(
        'postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'import_sessions'
        },
        () => {
          fetchDetailedProgress()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [year, fetchDetailedProgress])

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Laster...</Badge>
    }
    
    if (error) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Feil</Badge>
    }
    
    if (!progress || !progress.session) {
      return <Badge variant="secondary">Ingen aktiv import</Badge>
    }
    
    switch (progress.session.status) {
      case 'active':
        return <Badge variant="outline"><TrendingUp className="w-3 h-3 mr-1" />Pågår ({progress.session.current_batch}/{progress.session.total_batches})</Badge>
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Fullført</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Feilet</Badge>
      default:
        return <Badge variant="secondary">Ukjent status</Badge>
    }
  }

  const getOverallProgress = () => {
    if (!progress || !progress.session) return 0
    
    if (progress.session.status === 'completed') return 100
    
    if (progress.total_file_rows > 0) {
      return Math.min(95, (progress.processed_rows / progress.total_file_rows) * 100)
    }
    
    if (progress.session.total_batches > 0) {
      return Math.min(95, (progress.session.current_batch / progress.session.total_batches) * 100)
    }
    
    return 0
  }

  const getImportSpeed = () => {
    if (!progress || !startTime) return 0
    
    const elapsedMinutes = (Date.now() - startTime.getTime()) / 1000 / 60
    if (elapsedMinutes === 0) return 0
    
    return Math.round(progress.processed_rows / elapsedMinutes)
  }

  const getEstimatedTimeRemaining = () => {
    if (!progress || !progress.session || progress.session.status !== 'active') return null
    
    const speed = getImportSpeed()
    if (speed === 0) return null
    
    const remainingRows = progress.total_file_rows - progress.processed_rows
    if (remainingRows <= 0) return null
    
    const remainingMinutes = Math.ceil(remainingRows / speed)
    
    if (remainingMinutes < 1) return 'Under 1 minutt'
    if (remainingMinutes < 60) return `${remainingMinutes} min`
    
    const hours = Math.floor(remainingMinutes / 60)
    const minutes = remainingMinutes % 60
    return `${hours}t ${minutes}min`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Detaljert Import Status
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                Sanntidsovervåkning av import-prosessen for år {year}
                {sessionId && (
                  <span className="block text-xs font-mono mt-1">
                    Session: {sessionId}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDetailedProgress}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Samlet fremgang</span>
              <span>{getOverallProgress().toFixed(1)}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-3" />
            
            {progress?.session && progress.session.status === 'active' && (
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>
                  {progress.processed_rows.toLocaleString()} / {progress.total_file_rows.toLocaleString()} rader
                </span>
                <span>
                  {getImportSpeed()} rader/min
                </span>
              </div>
            )}
          </div>

          {/* Statistics Grid */}
          {progress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Building2 className="w-3 h-3" />
                  Selskaper
                </div>
                <div className="text-2xl font-bold text-primary">
                  {progress.companies_count.toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <FileText className="w-3 h-3" />
                  Eierandeler
                </div>
                <div className="text-2xl font-bold text-primary">
                  {progress.holdings_count.toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Users className="w-3 h-3" />
                  Eiere
                </div>
                <div className="text-2xl font-bold text-primary">
                  {progress.entities_count.toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <TrendingUp className="w-3 h-3" />
                  Hastighet
                </div>
                <div className="text-lg font-bold text-primary">
                  {getImportSpeed()}<span className="text-sm font-normal text-muted-foreground">/min</span>
                </div>
              </div>
            </div>
          )}

          {/* Session Details */}
          {progress?.session && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Import Detaljer</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Batch Fremgang:</span>
                  <span className="ml-2 font-medium">
                    {progress.session.current_batch} / {progress.session.total_batches}
                  </span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Duplikater:</span>
                  <span className="ml-2 font-medium text-amber-600">
                    {progress.session.duplicates_count.toLocaleString()}
                  </span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Feil:</span>
                  <span className="ml-2 font-medium text-destructive">
                    {progress.session.errors_count}
                  </span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Estimert tid igjen:</span>
                  <span className="ml-2 font-medium">
                    {getEstimatedTimeRemaining() || 'Beregner...'}
                  </span>
                </div>
              </div>
              
              {progress.session.start_time && (
                <div className="text-xs text-muted-foreground">
                  Startet: {new Date(progress.session.start_time).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Sist oppdatert: {lastUpdated.toLocaleTimeString()}</span>
            <span>Oppdateres hvert 2. sekund</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}