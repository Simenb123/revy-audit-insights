import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useAccountingValidation } from '@/hooks/useAccountingValidation';
import { formatCurrency } from '@/lib/formatters';

interface ValidationPanelProps {
  clientId: string;
  selectedGLVersion?: string;
  selectedTBVersion?: string;
}

const ValidationPanel = ({ clientId, selectedGLVersion, selectedTBVersion }: ValidationPanelProps) => {
  const { data: validation, isLoading, error } = useAccountingValidation(clientId, selectedGLVersion, selectedTBVersion);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !validation) {
    const errorMessage = error?.message || 'Validering kunne ikke utføres';
    const isDataMissing = errorMessage.includes('Mangler data') || 
                         errorMessage.includes('no data') || 
                         errorMessage.includes('RLS') ||
                         errorMessage.includes('permission') ||
                         errorMessage.includes('access') ||
                         !validation;
    
    // Add detailed logging for debugging
    console.error('❌ ValidationPanel error details:', {
      error: error?.message || 'Unknown error',
      errorObject: error,
      hasValidation: !!validation,
      isDataMissing,
      clientId,
      selectedGLVersion,
      selectedTBVersion
    });
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validering</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={isDataMissing ? "default" : "destructive"}>
            {isDataMissing ? <Info className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>
              {isDataMissing 
                ? 'Venter på at hovedbok og saldobalanse data lastes inn...' 
                : `Kunne ikke utføre validering: ${errorMessage}`}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { overallValidation, accountValidations } = validation;
  const errorCount = accountValidations.filter(v => v.severity === 'error').length;
  const warningCount = accountValidations.filter(v => v.severity === 'warning').length;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive' as const;
      case 'warning': return 'default' as const;
      case 'info': return 'default' as const;
      default: return 'default' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon(overallValidation.severity)}
          Kryssjekk Hovedbok vs. Saldobalanse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={getVariant(overallValidation.severity)}>
          {getIcon(overallValidation.severity)}
          <AlertDescription>{overallValidation.message}</AlertDescription>
        </Alert>

        {(errorCount > 0 || warningCount > 0) && (
          <div className="space-y-2">
            <div className="flex gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} kritiske avvik
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary">
                  {warningCount} advarsler
                </Badge>
              )}
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto">
              {accountValidations
                .filter(v => !v.isValid)
                .map(validation => (
                  <div key={validation.accountId} className="text-sm p-2 border rounded">
                    <div className="font-medium">
                      {validation.accountNumber} - {validation.accountName}
                    </div>
                    <div className="text-muted-foreground">
                      Hovedbok: {formatCurrency(validation.generalLedgerTotal)} | 
                      Saldobalanse: {formatCurrency(validation.trialBalanceTotal)} | 
                      Differanse: {formatCurrency(validation.difference)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {overallValidation.isValid && (
          <div className="text-sm text-muted-foreground">
            Alle {accountValidations.length} kontoer stemmer overens mellom hovedbok og saldobalanse.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationPanel;