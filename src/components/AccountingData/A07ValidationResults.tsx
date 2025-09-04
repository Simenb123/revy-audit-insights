import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  discrepancies: string[];
  errors?: string[];
  totalRows?: number;
  totalAmount?: number;
}

interface A07ValidationResultsProps {
  validation: ValidationResult;
  onClose?: () => void;
}

export function A07ValidationResults({ validation, onClose }: A07ValidationResultsProps) {
  const hasErrors = validation.errors && validation.errors.length > 0;
  const hasDiscrepancies = validation.discrepancies.length > 0;
  const hasIssues = hasErrors || hasDiscrepancies;

  return (
    <Card className={`border-2 ${hasIssues ? 'border-orange-200' : 'border-green-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            A07 Valideringsresultater
            <Badge variant={hasIssues ? "destructive" : "default"}>
              {hasIssues ? "Problemer funnet" : "Alt OK"}
            </Badge>
          </CardTitle>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Lukk"
            >
              ×
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {validation.totalRows !== undefined && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Totalt antall rader</div>
              <div className="text-2xl font-bold">{validation.totalRows.toLocaleString('no-NO')}</div>
            </div>
            {validation.totalAmount !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">Total beløp</div>
                <div className="text-2xl font-bold">
                  {validation.totalAmount.toLocaleString('no-NO', {
                    style: 'currency',
                    currency: 'NOK',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {!hasIssues && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              A07-dataene er validert uten feil. Alle totaler stemmer overens med kontrollsummene.
            </AlertDescription>
          </Alert>
        )}

        {/* Parsing Errors */}
        {hasErrors && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <h4 className="font-semibold text-red-800">Parsing-feil ({validation.errors!.length})</h4>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {validation.errors!.map((error, index) => (
                <Alert key={index} className="border-red-200 bg-red-50 py-2">
                  <AlertDescription className="text-sm text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Control Sum Discrepancies */}
        {hasDiscrepancies && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h4 className="font-semibold text-orange-800">
                Avvik i kontrollsummer ({validation.discrepancies.length})
              </h4>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {validation.discrepancies.map((discrepancy, index) => (
                <Alert key={index} className="border-orange-200 bg-orange-50 py-2">
                  <AlertDescription className="text-sm text-orange-800 font-mono">
                    {discrepancy}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Information Note */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {hasIssues 
              ? "Vennligst gjennomgå og korriger feilene før du eksporterer dataene til regnskap eller avstemming."
              : "A07-dataene er klare for eksport til Excel eller videre prosessering."
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default A07ValidationResults;