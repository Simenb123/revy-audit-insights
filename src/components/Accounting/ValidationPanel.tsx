import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useAccountingValidation } from '@/hooks/useAccountingValidation';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAnalysisContext } from '@/components/DataAnalysis/AnalysisProvider';

interface ValidationPanelProps {
  clientId: string;
  selectedGLVersion?: string;
  selectedTBVersion?: string;
}

const ValidationPanel = ({ clientId, selectedGLVersion, selectedTBVersion }: ValidationPanelProps) => {
  // Try to use analysis context for cross-check if available
  let analysisContext;
  let hasAnalysisContext = false;
  
  try {
    analysisContext = useAnalysisContext();
    hasAnalysisContext = Boolean(analysisContext?.analysis);
  } catch (error) {
    // Not within AnalysisProvider, use fallback validation
    hasAnalysisContext = false;
  }
  
  // Enhanced logging for debugging version issues
  console.log('🔍 ValidationPanel props:', {
    clientId,
    selectedGLVersion,
    selectedTBVersion,
    hasGLVersion: !!selectedGLVersion,
    hasTBVersion: !!selectedTBVersion,
    hasAnalysisContext
  });

  const { data: validation, isLoading, error, status, fetchStatus } = useAccountingValidation(clientId, selectedGLVersion, selectedTBVersion);

  console.log('[ValidationPanel] Query status:', { status, fetchStatus, isLoading });
  console.log('[ValidationPanel] Validation data:', validation);
  console.log('[ValidationPanel] Error:', error);

  // Show "Venter på data" only if ledger OR trial balance is missing
  const isDataMissing = !selectedGLVersion || !selectedTBVersion;
  
  if (isDataMissing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kryssjekk Hovedbok vs. Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Venter på data - {!selectedGLVersion ? 'hovedbok' : ''}{!selectedGLVersion && !selectedTBVersion ? ' og ' : ''}{!selectedTBVersion ? 'saldobalanse' : ''} mangler
            </AlertDescription>
          </Alert>
          {!selectedTBVersion && (
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to={`/clients/${clientId}/trial-balance`}>Velg/last opp saldobalanse</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Use analysis context for quick cross-check if available
  if (hasAnalysisContext && analysisContext?.analysis?.trial_balance_crosscheck) {
    const crossCheck = analysisContext.analysis.trial_balance_crosscheck;
    const isBalanced = crossCheck.balanced;
    const difference = Math.abs(crossCheck.diff || 0);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isBalanced ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            Kryssjekk Hovedbok vs. Saldobalanse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={isBalanced ? "default" : "destructive"}>
            {isBalanced ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>
              {isBalanced 
                ? `Hovedbok og saldobalanse er balansert (differanse: ${formatCurrency(difference)})`
                : `Ubalanse oppdaget: ${formatCurrency(difference)} differanse mellom hovedbok og saldobalanse`
              }
            </AlertDescription>
          </Alert>
          
          {!isBalanced && (
            <div className="text-sm text-muted-foreground">
              Bruk detaljert validering nedenfor for mer informasjon om avvikene.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading || status === 'pending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kryssjekk Hovedbok vs. Saldobalanse</CardTitle>
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

  if (error) {
    console.error('❌ ValidationPanel error details:', {
      error: error?.message || 'Unknown error',
      errorObject: error,
      hasValidation: !!validation,
      clientId,
      selectedGLVersion,
      selectedTBVersion
    });
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kryssjekk Hovedbok vs. Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Feil under validering: {error.message || 'Ukjent feil'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!validation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kryssjekk Hovedbok vs. Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Laster validering...
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