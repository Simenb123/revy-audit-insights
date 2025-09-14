import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { TrialBalanceSummary } from '@/types/optimizedAnalysis';

interface TrialBalanceSummaryCardProps {
  summary?: TrialBalanceSummary;
  isLoading?: boolean;
}

export function TrialBalanceSummaryCard({ summary, isLoading }: TrialBalanceSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Saldobalanse oversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Saldobalanse oversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ingen saldobalanse data tilgjengelig
          </p>
        </CardContent>
      </Card>
    );
  }

  const isBalanced = !summary.has_imbalance;
  const netAmount = Math.abs(summary.total_net);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Saldobalanse oversikt
          </div>
          <Badge 
            variant={isBalanced ? "default" : "destructive"}
            className={isBalanced 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }
          >
            {isBalanced ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Balansert
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Ubalanse
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Totale kontoer</div>
            <div className="text-lg font-semibold">{summary.total_accounts}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Netto balanse</div>
            <div className={`text-lg font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netAmount)}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Totalt debet:</span>
            <span className="text-sm font-medium">{formatCurrency(summary.total_debit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Totalt kredit:</span>
            <span className="text-sm font-medium">{formatCurrency(summary.total_credit)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Differanse:</span>
              <span className={`text-sm font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netAmount)}
              </span>
            </div>
          </div>
        </div>

        {!isBalanced && (
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            ⚠️ Saldobalansen er ikke i balanse. Sjekk at alle kontoer er riktig bokført.
          </div>
        )}
      </CardContent>
    </Card>
  );
}