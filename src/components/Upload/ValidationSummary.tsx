import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, XCircle, Info, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationResult {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string[];
  count?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ValidationSummaryData {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  results: ValidationResult[];
  downloadLinks?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
}

interface ValidationSummaryProps {
  data: ValidationSummaryData;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  data,
  onClose,
  onRetry,
  className
}) => {
  const getResultIcon = (type: ValidationResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getResultVariant = (type: ValidationResult['type']) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const hasErrors = data.results.some(r => r.type === 'error');
  const hasWarnings = data.results.some(r => r.type === 'warning');
  const isSuccessful = !hasErrors && data.validRows > 0;

  const successRate = data.totalRows > 0 ? (data.validRows / data.totalRows) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Valideringsresultat: {data.fileName}</span>
          <div className="flex items-center gap-2">
            {isSuccessful && !hasWarnings && (
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                Vellykket
              </Badge>
            )}
            {hasWarnings && !hasErrors && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
                Med advarsler
              </Badge>
            )}
            {hasErrors && (
              <Badge variant="destructive">
                Feil oppstod
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{data.totalRows}</div>
            <div className="text-xs text-muted-foreground">Totalt rader</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600">{data.validRows}</div>
            <div className="text-xs text-green-700 dark:text-green-400">Gyldige rader</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600">{data.invalidRows}</div>
            <div className="text-xs text-red-700 dark:text-red-400">Ugyldige rader</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">{data.skippedRows}</div>
            <div className="text-xs text-muted-foreground">Hoppet over</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Suksessrate</span>
            <span className={cn(
              "font-medium",
              successRate >= 90 ? "text-green-600" :
              successRate >= 70 ? "text-yellow-600" : "text-red-600"
            )}>
              {Math.round(successRate)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all",
                successRate >= 90 ? "bg-green-600" :
                successRate >= 70 ? "bg-yellow-600" : "bg-red-600"
              )}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Validation Results */}
        <div className="space-y-3">
          <h4 className="font-semibold">Detaljer</h4>
          {data.results.map((result, index) => (
            <Alert key={index} className={cn(
              result.type === 'success' && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
              result.type === 'warning' && 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
              result.type === 'error' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            )}>
              <div className="flex items-start gap-3">
                {getResultIcon(result.type)}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{result.message}</span>
                      {result.count && (
                        <Badge variant={getResultVariant(result.type)} className="text-xs">
                          {result.count}
                        </Badge>
                      )}
                    </div>
                    
                    {result.details && result.details.length > 0 && (
                      <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                        {result.details.slice(0, 5).map((detail, idx) => (
                          <li key={idx}>• {detail}</li>
                        ))}
                        {result.details.length > 5 && (
                          <li>... og {result.details.length - 5} flere</li>
                        )}
                      </ul>
                    )}
                    
                    {result.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={result.action.onClick}
                      >
                        {result.action.label}
                      </Button>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Download Links */}
        {data.downloadLinks && data.downloadLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Nedlastinger</h4>
            <div className="flex flex-wrap gap-2">
              {data.downloadLinks.map((link, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={link.onClick}
                  className="flex items-center gap-2"
                >
                  {link.icon || <Download className="w-4 h-4" />}
                  {link.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onRetry && hasErrors && (
            <Button variant="outline" onClick={onRetry}>
              Prøv igjen
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose}>
              {isSuccessful ? 'Ferdig' : 'Lukk'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationSummary;