import React from 'react';
import { Link } from 'react-router-dom';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAccountingData } from '@/hooks/useAccountingData';

interface OverviewPhaseProps {
  client: Client;
}

const OverviewPhase = ({ client }: OverviewPhaseProps) => {
  const { data: accountingData } = useAccountingData(client.id);

  const hasTrialBalance = accountingData?.chartOfAccountsCount > 0;
  const hasGeneralLedger = accountingData?.hasGeneralLedger;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Klientinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Firmanavn</p>
              <p className="font-medium">{client.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organisasjonsnummer</p>
              <p className="font-medium">{client.org_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gjeldende fase</p>
              <Badge variant="default" className="text-sm">
                {client.phase === 'overview' ? 'Oversikt' :
                 client.phase === 'engagement' ? 'Oppdragsvurdering' :
                 client.phase === 'planning' ? 'Planlegging' :
                 client.phase === 'risk_assessment' ? 'Risikovurdering' :
                 client.phase === 'execution' ? 'Utførelse' :
                 client.phase === 'completion' ? 'Avslutning' :
                 'Rapportering'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opprettet</p>
              <p className="text-sm">{new Date(client.created_at || '').toLocaleDateString('nb-NO')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Regnskapsdata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Saldobalanse</p>
                <p className="text-sm text-muted-foreground">Planleggingsfase</p>
              </div>
              <div className="flex items-center gap-2">
                {hasTrialBalance ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <Button size="sm" variant="outline" className="flex items-center gap-1" asChild>
                  <Link to={hasTrialBalance ? `/clients/${client.id}/analysis` : `/clients/${client.id}/trial-balance`}>
                    <ExternalLink className="h-3 w-3" />
                    {hasTrialBalance ? 'Vis' : 'Last opp'}
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Hovedbok</p>
                <p className="text-sm text-muted-foreground">Utførelsesfase</p>
              </div>
              <div className="flex items-center gap-2">
                {hasGeneralLedger ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <Button size="sm" variant="outline" className="flex items-center gap-1" asChild>
                  <Link to={hasGeneralLedger ? `/clients/${client.id}/analysis` : `/clients/${client.id}/general-ledger`}>
                    <ExternalLink className="h-3 w-3" />
                    {hasGeneralLedger ? 'Vis' : 'Last opp'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPhase;