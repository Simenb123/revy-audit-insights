import React from 'react';
import { useFirmFinancialStatements } from '@/hooks/useFirmFinancialStatements';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Info } from 'lucide-react';
import FinancialStatementsContainer from './FinancialStatements/FinancialStatementsContainer';

interface ClientFinancialStatementGeneratorProps {
  clientId: string;
  selectedVersion?: string;
  onNavigateToMapping?: () => void;
}

const ClientFinancialStatementGenerator: React.FC<ClientFinancialStatementGeneratorProps> = ({
  clientId,
  selectedVersion,
  onNavigateToMapping
}) => {
  const { financialStatement, mappingStats, periodInfo, isLoading } = useFirmFinancialStatements(clientId, selectedVersion);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Regnskapsoppstilling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Genererer regnskapsoppstilling...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financialStatement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Regnskapsoppstilling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">Kan ikke generere regnskapsoppstilling</p>
              <p className="text-sm text-muted-foreground">
                Mangler nødvendige data eller mapping mellom kontoer og standardkontoer
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onNavigateToMapping}>
              <FileText className="h-4 w-4 mr-2" />
              Gå til Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FinancialStatementsContainer
      financialStatement={financialStatement}
      mappingStats={mappingStats}
      periodInfo={periodInfo}
      onNavigateToMapping={onNavigateToMapping}
    />
  );
};

export default ClientFinancialStatementGenerator;