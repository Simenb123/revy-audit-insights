import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayCircle, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { formatNumeric, formatPercent } from '@/utils/kpiFormat';
import { formatCurrency } from '@/lib/formatters';
import { Spinner } from '@/components/ui/spinner';

interface VisualFormulaTestResult {
  value: number;
  formattedValue: string;
  isValid: boolean;
  error?: string;
  metadata?: any;
  executionTime?: number;
}

interface VisualFormulaTesterProps {
  formulaExpression: any;
  formulaId?: string;
  clientId?: string;
  mappings?: Record<string, string>;
  onTestResult?: (result: VisualFormulaTestResult | null) => void;
  format?: 'currency' | 'percent' | 'number';
}

export function VisualFormulaTester({ 
  formulaExpression, 
  formulaId,
  clientId, 
  mappings,
  onTestResult,
  format = 'number'
}: VisualFormulaTesterProps) {
  const [isManualTest, setIsManualTest] = useState(false);
  const [testResult, setTestResult] = useState<VisualFormulaTestResult | null>(null);
  const { selectedFiscalYear } = useFiscalYear();

  const calculation = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId,
    customFormula: formulaExpression,
    enabled: false // Manual control
  });

  const handleTest = async () => {
    if (!clientId || !selectedFiscalYear) {
      setTestResult({
        value: 0,
        formattedValue: 'N/A',
        isValid: false,
        error: 'Mangler klient eller regnskapsår'
      });
      return;
    }

    setIsManualTest(true);
    const startTime = Date.now();
    
    try {
      await calculation.refetch();
      const endTime = Date.now();
      
      if (calculation.data) {
        const result: VisualFormulaTestResult = {
          ...calculation.data,
          executionTime: endTime - startTime
        };
        setTestResult(result);
        onTestResult?.(result);
      }
    } catch (error) {
      const result: VisualFormulaTestResult = {
        value: 0,
        formattedValue: 'N/A',
        isValid: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
        executionTime: Date.now() - startTime
      };
      setTestResult(result);
      onTestResult?.(result);
    }
    
    setIsManualTest(false);
  };

  const formatResult = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      default:
        return formatNumeric(value);
    }
  };

  const getStatusColor = () => {
    if (!testResult) return 'secondary';
    if (!testResult.isValid) return 'destructive';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!testResult) return <Calculator className="h-4 w-4" />;
    if (!testResult.isValid) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const canTest = Boolean(clientId && selectedFiscalYear && (formulaExpression || formulaId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Formeltest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleTest}
            disabled={!canTest || isManualTest || calculation.isLoading}
            className="flex items-center gap-2"
          >
            {(isManualTest || calculation.isLoading) ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Test formel
          </Button>
          
          {testResult && (
            <Badge variant={getStatusColor() as any} className="flex items-center gap-1">
              {getStatusIcon()}
              {testResult.isValid ? 'Gyldig' : 'Feil'}
            </Badge>
          )}
          
          {testResult?.executionTime && (
            <Badge variant="outline" className="text-xs">
              {testResult.executionTime}ms
            </Badge>
          )}
        </div>

        {!canTest && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              For å teste formelen trenger du:
              <ul className="mt-2 list-disc list-inside space-y-1">
                {!clientId && <li>Valgt klient</li>}
                {!selectedFiscalYear && <li>Valgt regnskapsår</li>}
                {!formulaExpression && !formulaId && <li>Gyldig formel</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Resultat</div>
                  <div className="text-2xl font-bold">
                    {testResult.isValid ? formatResult(testResult.value) : 'N/A'}
                  </div>
                </div>
                {testResult.isValid && (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
            </div>

            {testResult.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Feil:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            )}

            {testResult.metadata && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div><strong>Detaljer:</strong></div>
                {testResult.metadata.formula_used && (
                  <div>Formel: {testResult.metadata.formula_used}</div>
                )}
                {testResult.metadata.accounts_used && (
                  <div>Kontoer brukt: {testResult.metadata.accounts_used.join(', ')}</div>
                )}
                {testResult.metadata.calculation_steps && (
                  <div>Steg: {testResult.metadata.calculation_steps}</div>
                )}
              </div>
            )}
          </div>
        )}

        {mappings && Object.keys(mappings).length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Aktive mappinger:
            </div>
            <div className="space-y-1">
              {Object.entries(mappings).map(([account, mapping]) => (
                <div key={account} className="text-sm text-blue-700">
                  {account} → {mapping}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {clientId && (
            <div>Klient-ID: {clientId}</div>
          )}
          {selectedFiscalYear && (
            <div>Regnskapsår: {selectedFiscalYear}</div>
          )}
          {format !== 'number' && (
            <div>Format: {format}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}