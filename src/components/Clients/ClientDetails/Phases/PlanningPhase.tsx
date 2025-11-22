import React from 'react';
import { Link } from 'react-router-dom';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Database, FileText } from 'lucide-react';
import ActionsContainer from '../Actions/ActionsContainer';
import TrialBalanceUploader from '@/components/Accounting/TrialBalanceUploader';

interface PlanningPhaseProps {
  client: Client;
}

const PlanningPhase = ({ client }: PlanningPhaseProps) => {
  const [showUploader, setShowUploader] = React.useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planleggingsfase</CardTitle>
          <CardDescription>
            Utforming av revisjonsstrategi og saldobalanse-opplastning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            I denne fasen planlegges revisjonsstrategien og fokusområdene identifiseres. 
            Start med å laste opp saldobalansen for å etablere kontostrukturen.
          </p>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Last opp saldobalanse
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Vis kontoplan
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link to={`/clients/${client.id}/accounting-data`}>
                <FileText className="h-4 w-4" />
                Se alle regnskapsdata
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle>Saldobalanse-opplastning</CardTitle>
            <CardDescription>
              Last opp saldobalanse-fil for å etablere kontostrukturen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrialBalanceUploader 
              clientId={client.id}
              onUploadComplete={() => setShowUploader(false)}
            />
          </CardContent>
        </Card>
      )}
      
      <ActionsContainer clientId={client.id} phase="planning" />
    </div>
  );
};

export default PlanningPhase;