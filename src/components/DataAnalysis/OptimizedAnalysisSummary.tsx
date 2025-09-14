import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  RefreshCw, 
  AlertTriangle, 
  Database, 
  Clock, 
  TrendingUp, 
  FileText,
  Calculator,
  CheckCircle 
} from 'lucide-react';
import { useAnalysisContext } from '@/components/DataAnalysis/AnalysisProvider';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { formatNumeric } from '@/utils/kpiFormat';
import { safeNet } from '@/utils/netCalculation';
import { TrialBalanceSummaryCard } from '@/components/Accounting/TrialBalanceSummaryCard';
import { CrossCheckCard } from '@/components/Accounting/CrossCheckCard';
import { AnalysisCacheStatus } from '@/components/DataAnalysis/AnalysisCacheStatus';

interface OptimizedAnalysisSummaryProps {
  clientId: string;
  versionId?: string;
  showCacheStatus?: boolean;
}

const OptimizedAnalysisSummary: React.FC<OptimizedAnalysisSummaryProps> = ({ 
  clientId, 
  versionId,
  showCacheStatus = false
}) => {
  // Use shared analysis context to avoid duplicate API calls
  const { 
    analysis, 
    isLoading, 
    error, 
    refetch,
    lastUpdated 
  } = useAnalysisContext();

  const { invalidateClientCache } = useCacheInvalidation();

  const handleRefresh = async () => {
    try {
      await invalidateClientCache(clientId);
      refetch();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      refetch(); // Still try to refetch even if cache invalidation fails
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // lastUpdated is now provided by the context

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Kunne ikke laste analyse: {error.message}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Prøv på nytt
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Ingen analyse data tilgjengelig. Sørg for at regnskapsdata er lastet opp.
        </AlertDescription>
      </Alert>
    );
  }

  // Use strict equality check for balanced status
  const isBalanced = Math.abs(analysis.trial_balance_crosscheck.diff || 0) === 0;
  const balanceStatus = isBalanced
    ? { status: 'success', text: 'Balansert' }
    : { status: 'destructive', text: 'Ubalanse' };

  const qualityScore = analysis.data_quality_flags.reduce((sum, flag) => sum + flag.count, 0);

  return (
    <div className="space-y-6">
      {/* Timestamp and refresh */}
      {lastUpdated && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Sist oppdatert: {lastUpdated}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </div>
      )}

      {/* Cross-check and Trial Balance Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrossCheckCard 
          crossCheck={analysis.trial_balance_crosscheck}
          isLoading={isLoading}
        />
        <TrialBalanceSummaryCard 
          summary={analysis.trial_balance_summary}
          isLoading={isLoading}
        />
      </div>

      {/* Cache Status (optional) */}
      {showCacheStatus && (
        <AnalysisCacheStatus
          clientId={clientId}
          lastUpdated={lastUpdated}
          isCached={analysis.metadata?.cached === true}
        />
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksjoner</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumeric(analysis.total_transactions)}</div>
            <p className="text-xs text-muted-foreground">
              {analysis.date_range.start} til {analysis.date_range.end}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanse Status</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {formatCurrency(Math.abs(analysis.trial_balance_crosscheck.diff))}
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                balanceStatus.status === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {balanceStatus.text}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isBalanced ? 'Hovedbok og saldobalanse stemmer overens' : 'Avvik funnet mellom hovedbok og saldobalanse'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datakvalitet</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{qualityScore}</div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                qualityScore === 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {qualityScore === 0 ? 'OK' : 'Problemer'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Datakvalitet problemer</p>
          </CardContent>
        </Card>
      </div>

      {/* Account distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Kontofordeling</CardTitle>
          <CardDescription>Kontoer med høyest aktivitet og beløp</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Konto</TableHead>
                <TableHead className="text-right">Beløp</TableHead>
                <TableHead className="text-right">Transaksjoner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.account_distribution.slice(0, 10).map((account, index) => {
                // Safeguard: ensure amount is not NaN
                const safeAmount = isNaN(account.amount) ? 0 : (account.amount ?? 0);
                const safeCount = isNaN(account.count) ? 0 : (account.count ?? 0);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{account.account}</TableCell>
                    <TableCell className="text-right">{formatCurrency(safeAmount)}</TableCell>
                    <TableCell className="text-right">{formatNumeric(safeCount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {analysis.account_distribution.length > 10 && (
            <p className="text-sm text-muted-foreground mt-3">
              Viser topp 10 av {analysis.account_distribution.length} kontoer
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly summary */}
      {analysis.monthly_summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Månedsoversikt</CardTitle>
            <CardDescription>Debet/kredit aktivitet per måned</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Måned</TableHead>
                  <TableHead className="text-right">Debet</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.monthly_summary.map((month, index) => {
                  const netValue = safeNet(month);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.debit ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.credit ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(netValue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Data quality issues */}
      {analysis.data_quality_flags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Datakvalitet detaljer</CardTitle>
            <CardDescription>Identifiserte problemer i regnskapsdata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.data_quality_flags.map((flag, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">
                      {flag.code === 'MISSING_ACCOUNT' && 'Manglende kontomapping'}
                      {flag.code === 'ZERO_AMOUNT' && 'Nullbeløp transaksjoner'}  
                      {flag.code === 'FUTURE_DATE' && 'Fremtidige datoer'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {flag.count} forekomster
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    flag.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    flag.severity === 'med' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {flag.severity === 'high' ? 'Høy' : flag.severity === 'med' ? 'Medium' : 'Lav'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizedAnalysisSummary;