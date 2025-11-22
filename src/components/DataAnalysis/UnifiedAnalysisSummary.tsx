import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  Database, 
  CheckCircle, 
  Calculator, 
  FileText, 
  RefreshCw, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { useAnalysisContext } from '@/components/DataAnalysis/AnalysisProvider';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { formatNumeric } from '@/utils/kpiFormat';
import { safeNet } from '@/utils/netCalculation';
import { CrossCheckCard } from '@/components/Accounting/CrossCheckCard';
import { TrialBalanceSummaryCard } from '@/components/Accounting/TrialBalanceSummaryCard';

interface UnifiedAnalysisSummaryProps {
  clientId: string;
}

export function UnifiedAnalysisSummary({ clientId }: UnifiedAnalysisSummaryProps) {
  const { data: activeGLVersion } = useActiveVersion(clientId);
  const [showAccounts, setShowAccounts] = React.useState(false);
  const [showMonthly, setShowMonthly] = React.useState(false);
  const [showQuality, setShowQuality] = React.useState(false);

  // Use shared analysis context
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
      refetch();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Extract key metrics
  const statistics = useMemo(() => {
    if (!analysis) return null;

    const monthlyData = analysis.monthly_summary || [];
    const totalDebit = monthlyData.reduce((sum, m) => sum + (m.debit || 0), 0);
    const totalCredit = monthlyData.reduce((sum, m) => sum + (m.credit || 0), 0);
    
    return {
      totalTransactions: analysis.total_transactions,
      totalDebit,
      totalCredit,
      balanceDifference: analysis.trial_balance_crosscheck.diff,
      isBalanced: Math.abs(analysis.trial_balance_crosscheck.diff || 0) === 0,
      dataQualityIssues: analysis.data_quality_flags?.reduce((sum, flag) => sum + flag.count, 0) || 0,
      accountCount: analysis.account_distribution.length
    };
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (!analysis || !statistics) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Ingen analyse data tilgjengelig. Sørg for at regnskapsdata er lastet opp.
        </AlertDescription>
      </Alert>
    );
  }

  const balanceStatus = statistics.isBalanced
    ? { status: 'success', text: 'Balansert' }
    : { status: 'destructive', text: 'Ubalanse' };

  return (
    <div className="space-y-6">
      {/* Header with version info and refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Regnskapsanalyse</h2>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
            <p className="text-sm">AI-drevet analyse av regnskapsdata</p>
            {activeGLVersion && (
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                <span className="text-xs bg-muted px-2 py-1 rounded-md">
                  Datasett: v{activeGLVersion.version_number} • {activeGLVersion.total_transactions || 0} transaksjoner
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Sist oppdatert:</span> {lastUpdated}
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </div>
      </div>

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

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksjoner</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumeric(statistics.totalTransactions)}</div>
            <p className="text-xs text-muted-foreground">
              {analysis.date_range.start} til {analysis.date_range.end}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontoer</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumeric(statistics.accountCount)}</div>
            <p className="text-xs text-muted-foreground">Unike kontoer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanse</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {formatCurrency(Math.abs(statistics.balanceDifference))}
              </div>
              <Badge variant={balanceStatus.status as any}>
                {balanceStatus.text}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.isBalanced ? 'Perfekt balanse' : 'Avvik funnet'}
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
              <div className="text-2xl font-bold">{statistics.dataQualityIssues}</div>
              <Badge variant={statistics.dataQualityIssues === 0 ? 'success' : 'destructive'}>
                {statistics.dataQualityIssues === 0 ? 'OK' : 'Problemer'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.dataQualityIssues === 0 ? 'Ingen problemer' : 'Krever oppmerksomhet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible: Account distribution */}
      <Collapsible open={showAccounts} onOpenChange={setShowAccounts}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle>Kontofordeling</CardTitle>
                  <CardDescription>Kontoer med høyest aktivitet og beløp</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  {showAccounts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
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
                  {analysis.account_distribution.slice(0, 15).map((account, index) => {
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
              {analysis.account_distribution.length > 15 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Viser topp 15 av {analysis.account_distribution.length} kontoer
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Collapsible: Monthly summary */}
      {analysis.monthly_summary.length > 0 && (
        <Collapsible open={showMonthly} onOpenChange={setShowMonthly}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div>
                    <CardTitle>Månedsoversikt</CardTitle>
                    <CardDescription>Debet/kredit aktivitet per måned</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {showMonthly ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Collapsible: Data quality issues */}
      {analysis.data_quality_flags.length > 0 && (
        <Collapsible open={showQuality} onOpenChange={setShowQuality}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div>
                    <CardTitle>Datakvalitet detaljer</CardTitle>
                    <CardDescription>
                      {statistics.dataQualityIssues} identifiserte problemer i regnskapsdata
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {showQuality ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
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
                      <Badge variant={
                        flag.severity === 'high' ? 'destructive' : 
                        flag.severity === 'med' ? 'warning' : 
                        'secondary'
                      }>
                        {flag.severity === 'high' ? 'Høy' : flag.severity === 'med' ? 'Medium' : 'Lav'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
