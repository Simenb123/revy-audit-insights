import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, User, Building2, UserCheck, Calendar, FileEdit } from 'lucide-react'
import { useClientHistory, useClientHistoryStats } from '@/hooks/useClientHistory'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

interface ClientHistoryCardProps {
  clientId: string
}

const getChangeTypeIcon = (changeType: string) => {
  switch (changeType) {
    case 'role_change':
      return <User className="h-3 w-3" />
    case 'auditor_change':
      return <Building2 className="h-3 w-3" />
    case 'contact_change':
      return <UserCheck className="h-3 w-3" />
    case 'brreg_sync':
      return <FileEdit className="h-3 w-3" />
    default:
      return <Calendar className="h-3 w-3" />
  }
}

const getChangeTypeLabel = (changeType: string) => {
  switch (changeType) {
    case 'role_change':
      return 'Rolleendring'
    case 'auditor_change':
      return 'Revisorendring'
    case 'contact_change':
      return 'Kontaktendring'
    case 'brreg_sync':
      return 'BRREG-synkronisering'
    case 'created':
      return 'Opprettet'
    case 'updated':
      return 'Oppdatert'
    default:
      return changeType
  }
}

const getChangeTypeColor = (changeType: string) => {
  switch (changeType) {
    case 'role_change':
      return 'bg-blue-500/10 text-blue-700 border-blue-200'
    case 'auditor_change':
      return 'bg-purple-500/10 text-purple-700 border-purple-200'
    case 'contact_change':
      return 'bg-green-500/10 text-green-700 border-green-200'
    case 'brreg_sync':
      return 'bg-orange-500/10 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200'
  }
}

export function ClientHistoryCard({ clientId }: ClientHistoryCardProps) {
  const { data: history, isLoading: historyLoading } = useClientHistory(clientId)
  const { data: stats, isLoading: statsLoading } = useClientHistoryStats(clientId)

  if (historyLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Endringshistorikk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const recentHistory = history?.slice(0, 5) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Endringshistorikk
        </CardTitle>
        <CardDescription>
          Oversikt over endringer gjort på klienten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Totale endringer:</span>
                <span className="font-medium">{stats.total_changes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manuelle endringer:</span>
                <span className="font-medium">{stats.manual_changes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BRREG-synk:</span>
                <span className="font-medium">{stats.brreg_syncs}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rolleendringer:</span>
                <span className="font-medium">{stats.role_changes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revisorendringer:</span>
                <span className="font-medium">{stats.auditor_changes}</span>
              </div>
              {stats.last_change_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Siste endring:</span>
                  <span className="font-medium text-xs">
                    {formatDistanceToNow(new Date(stats.last_change_at), { 
                      addSuffix: true, 
                      locale: nb 
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {recentHistory.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Siste endringer</h4>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {recentHistory.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg border bg-card/50">
                    <Badge 
                      variant="outline" 
                      className={`shrink-0 ${getChangeTypeColor(log.change_type)}`}
                    >
                      {getChangeTypeIcon(log.change_type)}
                      <span className="ml-1 text-xs">{getChangeTypeLabel(log.change_type)}</span>
                    </Badge>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {log.description || `${log.field_name} endret`}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(log.created_at), { 
                            addSuffix: true, 
                            locale: nb 
                          })}
                        </span>
                      </div>
                      
                      {(log.old_value || log.new_value) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.old_value && (
                            <span className="line-through">"{log.old_value}"</span>
                          )}
                          {log.old_value && log.new_value && <span> → </span>}
                          {log.new_value && (
                            <span className="text-foreground">"{log.new_value}"</span>
                          )}
                        </div>
                      )}
                      
                      {(log.first_name || log.last_name) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Endret av: {log.first_name} {log.last_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Ingen endringshistorikk tilgjengelig</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}