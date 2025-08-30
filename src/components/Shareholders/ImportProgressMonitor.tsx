import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface ImportProgressMonitor {
  sessionId?: string
  year: number
  onComplete?: (summary: any) => void
}

interface DatabaseSummary {
  companies_count: number
  holdings_count: number
  entities_count: number
  needs_aggregation: boolean
  year: number
}

export function ImportProgressMonitor({ sessionId, year, onComplete }: ImportProgressMonitor) {
  const [summary, setSummary] = useState<DatabaseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current database status
      const { data, error: statusError } = await supabase.rpc('get_import_session_status', {
        p_session_id: sessionId || 'unknown',
        p_year: year
      })

      if (statusError) {
        throw statusError
      }

      const summary = data as unknown as DatabaseSummary
      setSummary(summary)
      setLastUpdated(new Date())
      
      // If we have substantial data and no aggregation needed, consider it complete
      if (summary && summary.companies_count > 0 && !summary.needs_aggregation) {
        onComplete?.(summary)
      }

    } catch (err) {
      console.error('Error fetching database status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 3 seconds during import
  useEffect(() => {
    fetchDatabaseStatus()
    
    const interval = setInterval(fetchDatabaseStatus, 3000)
    
    return () => clearInterval(interval)
  }, [sessionId, year])

  // Real-time subscription to database changes
  useEffect(() => {
    const channel = supabase
      .channel('import-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'share_companies',
          filter: `year=eq.${year}`
        },
        () => {
          fetchDatabaseStatus()
        }
      )
      .on(
        'postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'share_holdings',
          filter: `year=eq.${year}`
        },
        () => {
          fetchDatabaseStatus()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [year])

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Laster...</Badge>
    }
    
    if (error) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Feil</Badge>
    }
    
    if (!summary) {
      return <Badge variant="secondary">Ingen data</Badge>
    }
    
    if (summary.companies_count === 0) {
      return <Badge variant="secondary">Ingen import startet</Badge>
    }
    
    if (summary.needs_aggregation) {
      return <Badge variant="outline">Aggregerer...</Badge>
    }
    
    return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Fullført</Badge>
  }

  const getProgressPercentage = () => {
    if (!summary || summary.companies_count === 0) return 0
    
    // Rough estimation: if we have data but need aggregation, show 90%
    if (summary.needs_aggregation) return 90
    
    // If complete, show 100%
    return 100
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Database Status
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              Sanntidsstatus fra databasen for år {year}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDatabaseStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Import fremgang</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-foreground">Selskaper</div>
              <div className="text-2xl font-bold text-primary">
                {summary.companies_count.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground">Eierandeler</div>
              <div className="text-2xl font-bold text-primary">
                {summary.holdings_count.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground">Eiere</div>
              <div className="text-2xl font-bold text-primary">
                {summary.entities_count.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground">Status</div>
              <div className="text-sm">
                {summary.needs_aggregation ? 'Aggregerer...' : 'Komplett'}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Sist oppdatert: {lastUpdated.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}