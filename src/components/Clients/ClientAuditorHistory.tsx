import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClientAuditorHistory } from "@/hooks/useClientHistory"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Building, Calendar, CheckCircle, XCircle } from "lucide-react"

interface ClientAuditorHistoryProps {
  clientId: string
}

export function ClientAuditorHistory({ clientId }: ClientAuditorHistoryProps) {
  const { data: auditorHistory, isLoading } = useClientAuditorHistory(clientId)

  if (isLoading) {
    return <div>Laster revisorhistorikk...</div>
  }

  const getAuditorTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'revisor':
        return 'Revisor'
      case 'regnskapsfører':
        return 'Regnskapsfører'
      case 'autorisert_regnskapsfører':
        return 'Autorisert regnskapsfører'
      default:
        return 'Ukjent'
    }
  }

  const getDiscoveryLabel = (via: string) => {
    switch (via) {
      case 'brreg_sync':
        return 'BRREG'
      case 'manual_entry':
        return 'Manuell'
      case 'bulk_import':
        return 'Import'
      default:
        return via
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Revisorhistorikk
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!auditorHistory || auditorHistory.length === 0 ? (
          <p className="text-muted-foreground">Ingen revisorhistorikk registrert.</p>
        ) : (
          <div className="space-y-4">
            {auditorHistory.map((auditor) => (
              <div key={auditor.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{auditor.auditor_name}</h4>
                    {auditor.is_current ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Nåværende
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        Tidligere
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {getDiscoveryLabel(auditor.discovered_via)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Org.nummer</div>
                    <div className="font-medium">{auditor.auditor_org_number}</div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium">{getAuditorTypeLabel(auditor.auditor_type)}</div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">Gyldig fra</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(auditor.valid_from), 'dd.MM.yyyy', { locale: nb })}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">Gyldig til</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {auditor.valid_to 
                        ? format(new Date(auditor.valid_to), 'dd.MM.yyyy', { locale: nb })
                        : 'Pågående'
                      }
                    </div>
                  </div>
                </div>

                {auditor.brreg_data && Object.keys(auditor.brreg_data).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      BRREG-data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(auditor.brreg_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}