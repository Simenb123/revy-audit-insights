import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import ActionsContainer from '../Actions/ActionsContainer';

interface OverviewPhaseProps {
  client: Client;
}

const OverviewPhase = ({ client }: OverviewPhaseProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Klientoversikt
          </CardTitle>
          <CardDescription>
            Generell informasjon og oversikt over revisjonsoppdraget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Opprettet</p>
              <p className="text-sm">{new Date(client.created_at || '').toLocaleDateString('nb-NO')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tidsplan
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risikoer
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progresjon
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Neste steg
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Basert på gjeldende fase, her er de neste anbefalte stegene:
          </p>
          <div className="space-y-2">
            {client.phase === 'overview' && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Start med oppdragsvurdering</p>
                <p className="text-xs text-blue-700">Vurder klientaksept og etabler oppdragsvilkår</p>
              </div>
            )}
            {client.phase === 'engagement' && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-900">Gå videre til planlegging</p>
                <p className="text-xs text-purple-700">Last opp saldobalanse og planlegg revisjonsstrategi</p>
              </div>
            )}
            {client.phase === 'planning' && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-900">Utfør risikovurdering</p>
                <p className="text-xs text-orange-700">Vurder iboende og kontrollrisiko</p>
              </div>
            )}
            {client.phase === 'risk_assessment' && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">Start utførelsesfasen</p>
                <p className="text-xs text-green-700">Last opp hovedbok og utfør tester</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ActionsContainer clientId={client.id} phase="overview" />
    </div>
  );
};

export default OverviewPhase;