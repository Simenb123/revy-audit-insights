import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClientHistory, useClientHistoryStats } from "@/hooks/useClientHistory"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import { Clock, User, FileText, Building, AlertTriangle } from "lucide-react"

interface ClientHistoryProps {
  clientId: string
}

export function ClientHistory({ clientId }: ClientHistoryProps) {
  const { data: history, isLoading: historyLoading } = useClientHistory(clientId)
  const { data: stats, isLoading: statsLoading } = useClientHistoryStats(clientId)

  if (historyLoading || statsLoading) {
    return <div>Laster historikk...</div>
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'role_change':
        return <User className="h-4 w-4" />
      case 'auditor_change':
        return <Building className="h-4 w-4" />
      case 'contact_change':
        return <FileText className="h-4 w-4" />
      case 'brreg_sync':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
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
        return 'BRREG-oppdatering'
      case 'created':
        return 'Opprettet'
      case 'updated':
        return 'Oppdatert'
      default:
        return changeType
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual':
        return 'Manuell'
      case 'brreg_sync':
        return 'BRREG'
      case 'bulk_import':
        return 'Masseimport'
      case 'system':
        return 'System'
      default:
        return source
    }
  }

  const getSourceVariant = (source: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (source) {
      case 'brreg_sync':
        return 'default'
      case 'manual':
        return 'secondary'
      case 'bulk_import':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_changes}</div>
              <p className="text-sm text-muted-foreground">Totale endringer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.role_changes}</div>
              <p className="text-sm text-muted-foreground">Rolleendringer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.auditor_changes}</div>
              <p className="text-sm text-muted-foreground">Revisorendringer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.brreg_syncs}</div>
              <p className="text-sm text-muted-foreground">BRREG-synk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.manual_changes}</div>
              <p className="text-sm text-muted-foreground">Manuelle</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Endringshistorikk</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-muted-foreground">Ingen endringer registrert ennå.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex gap-4 border-l-2 border-muted pl-4 pb-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {getChangeTypeIcon(entry.change_type)}
                      <Badge variant="outline">
                        {getChangeTypeLabel(entry.change_type)}
                      </Badge>
                      <Badge variant={getSourceVariant(entry.change_source)}>
                        {getSourceLabel(entry.change_source)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground min-w-fit">
                    {formatDistanceToNow(new Date(entry.created_at), { 
                      addSuffix: true, 
                      locale: nb 
                    })}
                  </div>
                  
                  <div className="w-full">
                    {entry.description && (
                      <p className="text-sm mb-2">{entry.description}</p>
                    )}
                    
                    {entry.field_name && (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{entry.field_name}</div>
                        {entry.old_value && entry.new_value && (
                          <div className="text-muted-foreground">
                            <span className="line-through">{entry.old_value}</span>
                            {' → '}
                            <span className="font-medium">{entry.new_value}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}