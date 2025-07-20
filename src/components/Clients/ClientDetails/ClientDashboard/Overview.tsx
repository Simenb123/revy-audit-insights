
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { Client } from "@/types/revio";
import BrregInfoCard from "./BrregInfoCard";
import AccountingDataCard from "./AccountingDataCard";
import { useClientRoles } from "@/hooks/useClientRoles";

interface OverviewProps {
  client: Client;
  documentCount: number;
  nextAuditDeadline: string;
}

const Overview = ({ 
  client,
  documentCount, 
  nextAuditDeadline
}: OverviewProps) => {
  const { data: roles = [], isLoading: rolesLoading } = useClientRoles(client.id);

  const getPhaseStatus = (phase: string) => {
    const phaseMap: Record<string, { label: string; color: string; icon: any }> = {
      'overview': { label: 'Oversikt', color: 'bg-blue-500', icon: TrendingUp },
      'engagement': { label: 'Oppdrag', color: 'bg-orange-500', icon: AlertTriangle },
      'planning': { label: 'Planlegging', color: 'bg-yellow-500', icon: Calendar },
      'execution': { label: 'Gjennomføring', color: 'bg-purple-500', icon: FileText },
      'completion': { label: 'Ferdigstillelse', color: 'bg-green-500', icon: CheckCircle2 },
    };
    return phaseMap[phase] || phaseMap['overview'];
  };

  const currentPhaseInfo = getPhaseStatus(client.phase);
  const PhaseIcon = currentPhaseInfo.icon;

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Revisjonsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${currentPhaseInfo.color} text-white`}>
                <PhaseIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">{currentPhaseInfo.label}</p>
                <p className="text-sm text-muted-foreground">{client.progress}% fullført</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dokumenter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{documentCount}</p>
                <p className="text-sm text-muted-foreground">totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Revisjonsfrist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-semibold">{nextAuditDeadline}</p>
                <p className="text-sm text-muted-foreground">neste frist</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrregInfoCard client={client} roles={roles} />
        <AccountingDataCard client={client} />
      </div>

      {/* Additional Client Details */}
      <Card>
        <CardHeader>
          <CardTitle>Klientdetaljer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.year_end_date && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Regnskapsår slutt</h4>
                <p className="text-sm">{new Date(client.year_end_date).toLocaleDateString('nb-NO')}</p>
              </div>
            )}
            
            {client.audit_fee && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Revisjonshonorar</h4>
                <p className="text-sm">{client.audit_fee.toLocaleString('nb-NO')} NOK</p>
              </div>
            )}
            
            {client.previous_auditor && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Forrige revisor</h4>
                <p className="text-sm">{client.previous_auditor}</p>
              </div>
            )}
            
            {client.board_meetings_per_year && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Styremøter per år</h4>
                <p className="text-sm">{client.board_meetings_per_year}</p>
              </div>
            )}
            
            {client.internal_controls && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Internkontroll</h4>
                <p className="text-sm">{client.internal_controls}</p>
              </div>
            )}
            
            {client.risk_assessment && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Risikovurdering</h4>
                <p className="text-sm">{client.risk_assessment}</p>
              </div>
            )}
          </div>
          
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notater</h4>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
