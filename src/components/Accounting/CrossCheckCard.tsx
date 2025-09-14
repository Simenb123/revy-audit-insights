import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { TrialBalanceCrosscheck } from '@/types/optimizedAnalysis';

interface CrossCheckCardProps {
  crossCheck?: TrialBalanceCrosscheck;
  isLoading?: boolean;
}

export function CrossCheckCard({ crossCheck, isLoading }: CrossCheckCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kryssjekk Hovedbok vs. Saldobalanse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!crossCheck) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kryssjekk Hovedbok vs. Saldobalanse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Venter på data for kryssjekk
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Use strict equality on diff for balanced status
  const difference = crossCheck.diff;
  const isBalanced = difference === 0;
  const absoluteDifference = Math.abs(difference ?? 0);

  const getStatusIcon = () => {
    if (isBalanced) {
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  const getStatusText = () => {
    if (isBalanced) return "Balansert";
    return "Ubalansert";
  };

  const getStatusVariant = () => {
    if (isBalanced) return "default";
    return "destructive";
  };

  const getAlertVariant = () => {
    if (isBalanced) return "default";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kryssjekk Hovedbok vs. Saldobalanse
          </div>
          <Badge 
            variant={getStatusVariant()}
            className={isBalanced 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }
          >
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={getAlertVariant()}>
          {getStatusIcon()}
          <AlertDescription>
            {isBalanced 
              ? `Hovedbok og saldobalanse stemmer overens (differanse: ${formatCurrency(absoluteDifference)})`
              : `Avvik funnet: ${formatCurrency(absoluteDifference)} differanse mellom hovedbok og saldobalanse`
            }
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Status</div>
            <div className={`font-semibold ${
              isBalanced 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {getStatusText()}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Differanse</div>
            <div className={`font-semibold ${
              isBalanced 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(absoluteDifference)}
            </div>
          </div>
        </div>

        {!isBalanced && (
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            💡 Tips: Sjekk om alle transaksjoner er riktig bokført og at alle kontoer er med i saldobalansen.
          </div>
        )}
      </CardContent>
    </Card>
  );
}