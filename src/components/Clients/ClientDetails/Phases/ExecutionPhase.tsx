import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import ActionsContainer from '../Actions/ActionsContainer';
import GeneralLedgerUploader from '@/components/Accounting/GeneralLedgerUploader';

interface ExecutionPhaseProps {
  client: Client;
}

const ExecutionPhase = ({ client }: ExecutionPhaseProps) => {
  const [showUploader, setShowUploader] = React.useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gjennomføringsfase</CardTitle>
          <CardDescription>
            Hovedbok-opplastning og utføring av substansielle tester
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            I denne fasen utføres substansielle tester og kontrolltester. 
            Last opp hovedboken for detaljert transaksjonsanalyse.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Last opp hovedbok
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vis transaksjoner
            </Button>
          </div>
        </CardContent>
      </Card>

      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle>Hovedbok-opplastning</CardTitle>
            <CardDescription>
              Last opp hovedbok-fil for detaljert transaksjonsanalyse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneralLedgerUploader 
              clientId={client.id}
              onUploadComplete={() => setShowUploader(false)}
            />
          </CardContent>
        </Card>
      )}
      
      <ActionsContainer clientId={client.id} phase="execution" />
    </div>
  );
};

export default ExecutionPhase;