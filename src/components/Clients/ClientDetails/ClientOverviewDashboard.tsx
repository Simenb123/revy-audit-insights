
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Database, 
  FileText, 
  ArrowRight,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccountingData } from '@/hooks/useAccountingData';
import { Client } from '@/types/revio';

interface ClientOverviewDashboardProps {
  client: Client;
}

const ClientOverviewDashboard = ({ client }: ClientOverviewDashboardProps) => {
  const navigate = useNavigate();
  const { data: accountingData, isLoading } = useAccountingData(client.id);

  // Calculate completion status
  const hasTrialBalance = accountingData?.chartOfAccountsCount > 0;
  const hasGeneralLedger = accountingData?.accountingDocsCount > 0;
  const accountingDataComplete = hasTrialBalance && hasGeneralLedger;
  
  const completedTasks = [hasTrialBalance, hasGeneralLedger].filter(Boolean).length;
  const totalTasks = 2;
  const completionPercentage = (completedTasks / totalTasks) * 100;

  const getNextAction = () => {
    if (!hasTrialBalance) {
      return {
        title: 'Last opp Saldobalanse',
        description: 'Start med å laste opp saldobalanse for å etablere kontostruktur',
        action: () => navigate(`/klienter/${client.org_number}/regnskapsdata`),
        urgent: true
      };
    }
    
    if (!hasGeneralLedger) {
      return {
        title: 'Last opp Hovedbok',
        description: 'Last opp hovedbok for å få tilgang til alle transaksjoner',
        action: () => navigate(`/klienter/${client.org_number}/regnskapsdata`),
        urgent: true
      };
    }
    
    return {
      title: 'Start revisjonshandlinger',
      description: 'Regnskapsdata er komplett - fortsett med revisjonshandlinger',
      action: () => navigate(`/klienter/${client.org_number}/handlinger`),
      urgent: false
    };
  };

  const nextAction = getNextAction();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Next Steps Card */}
        <Card className={`${nextAction.urgent ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {nextAction.urgent ? (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                Neste steg
              </CardTitle>
              <Badge variant={nextAction.urgent ? "destructive" : "default"}>
                {nextAction.urgent ? "Kreves" : "Klar"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{nextAction.title}</h3>
                <p className="text-muted-foreground">{nextAction.description}</p>
              </div>
              <Button 
                onClick={nextAction.action}
                className="gap-2"
                variant={nextAction.urgent ? "default" : "outline"}
              >
                {nextAction.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Regnskapsdata Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Regnskapsdata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fullføringsgrad</span>
              <span className="text-sm text-muted-foreground">
                {completedTasks} av {totalTasks} oppgaver
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className={`p-4 rounded-lg border ${
                hasTrialBalance ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {hasTrialBalance ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-600" />
                  )}
                  <span className="font-medium text-sm">Saldobalanse</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasTrialBalance 
                    ? `${accountingData?.chartOfAccountsCount} kontoer lastet`
                    : 'Ikke lastet opp ennå'
                  }
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                hasGeneralLedger ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {hasGeneralLedger ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-600" />
                  )}
                  <span className="font-medium text-sm">Hovedbok</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasGeneralLedger 
                    ? `${accountingData?.accountingDocsCount} fil(er) lastet`
                    : 'Ikke lastet opp ennå'
                  }
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => navigate(`/klienter/${client.org_number}/regnskapsdata`)}
            >
              <Database className="h-4 w-4" />
              Administrer regnskapsdata
            </Button>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Klientinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Organisasjonsnummer</span>
                <p className="font-medium">{client.org_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bransje</span>
                <p className="font-medium">{client.industry || 'Ikke oppgitt'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Regnskapssystem</span>
                <p className="font-medium">{client.accounting_system || 'Ikke oppgitt'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Årsavslutning</span>
                <p className="font-medium">
                  {client.year_end_date ? new Date(client.year_end_date).toLocaleDateString('nb-NO') : 'Ikke oppgitt'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hurtigstatistikk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fase</span>
              <Badge variant="outline">
                {client.phase === 'overview' && 'Oversikt'}
                {client.phase === 'engagement' && 'Oppdrag'}
                {client.phase === 'planning' && 'Planlegging'}
                {client.phase === 'risk_assessment' && 'Risikovurdering'}
                {client.phase === 'execution' && 'Gjennomføring'}
                {client.phase === 'completion' && 'Fullføring'}
                {client.phase === 'reporting' && 'Rapportering'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fremdrift</span>
              <span className="font-medium">{client.progress || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Regnskapsdata</span>
              <span className="font-medium">{completionPercentage.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Siste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {accountingData?.latestAccountingFile && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Regnskapsfil lastet opp
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Opprettet {new Date(client.created_at).toLocaleDateString('nb-NO')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientOverviewDashboard;
