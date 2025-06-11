
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditPhase, Client } from '@/types/revio';
import { FileText, Users, Calculator, CheckSquare } from 'lucide-react';
import ClientDetails from './ClientDetails';
import EngagementChecklist from '@/components/Engagement/EngagementChecklist';

interface PhaseContentProps {
  phase: AuditPhase;
  client: Client;
}

const PhaseContent = ({ phase, client }: PhaseContentProps) => {
  const renderEngagementContent = () => (
    <div className="space-y-6">
      <EngagementChecklist clientId={client.id} clientName={client.name} />
    </div>
  );

  const renderPlanningContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Planlegging og Materialitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Materialitet</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Beregn materialitetsgrense</li>
                <li>• Identifiser risikoområder</li>
                <li>• Sett rapporteringsgrense</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Revisjonsstrategi</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Velg tilnærming</li>
                <li>• Planlegg substantive handlinger</li>
                <li>• Tidsplan for gjennomføring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExecutionContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Utførelse og Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Regnskapsanalyse</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Analytiske handlinger</li>
                <li>• Detaljkontroller</li>
                <li>• Stikkprøvetesting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dokumentasjon</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Arbeidsark og notater</li>
                <li>• Bevis og konklusjoner</li>
                <li>• Avvik og oppfølging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompletionContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Avslutning og Rapportering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Konklusjon</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Samle alle bevis</li>
                <li>• Vurder konklusjon</li>
                <li>• Kvalitetssikring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Rapportering</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Revisjonsberetning</li>
                <li>• Ledelsesrapport</li>
                <li>• Oppfølging med klient</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (phase) {
    case 'engagement':
      return renderEngagementContent();
    case 'planning':
      return renderPlanningContent();
    case 'execution':
      return renderExecutionContent();
    case 'completion':
      return renderCompletionContent();
    default:
      return renderEngagementContent();
  }
};

export default PhaseContent;
