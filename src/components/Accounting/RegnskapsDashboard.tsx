import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Database, CheckCircle, Calculator, FileText, RefreshCw, Clock } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';
import { formatNumeric, formatPercent } from '@/utils/kpiFormat';
import { safeNet } from '@/utils/netCalculation';

interface RegnskapsDashboardProps {
  clientId: string;
}


export function RegnskapsDashboard({ clientId }: RegnskapsDashboardProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { data: activeGLVersion } = useActiveVersion(clientId);

  // Use optimized analysis instead of fetching all transaction data
  const { 
    data: analysisResult, 
    isLoading, 
    error, 
    refetch 
  } = useOptimizedAnalysis(
    { 
      clientId,
      datasetId: activeGLVersion?.id 
    },
    { 
      enabled: !!activeGLVersion?.id,
      staleTime: 2 * 60 * 1000 // 2 minutes
    }
  );

  // Extract key metrics from optimized analysis
  const statistics = useMemo(() => {
    if (!analysisResult) return null;

    const monthlyData = analysisResult.monthly_summary || [];
    const totalDebit = monthlyData.reduce((sum, m) => sum + (m.debit || 0), 0);
    const totalCredit = monthlyData.reduce((sum, m) => sum + (m.credit || 0), 0);
    
    return {
      totalTransactions: analysisResult.total_transactions,
      totalDebit,
      totalCredit,
      balanceDifference: analysisResult.trial_balance_crosscheck.diff,
      isBalanced: analysisResult.trial_balance_crosscheck.balanced,
      dataQualityIssues: analysisResult.data_quality_flags?.reduce((sum, flag) => sum + flag.count, 0) || 0,
      topAccounts: analysisResult.top_accounts || [],
      accountDistribution: analysisResult.account_distribution || []
    };
  }, [analysisResult]);

  const lastUpdated = analysisResult?.metadata?.generated_at 
    ? new Date(analysisResult.metadata.generated_at).toLocaleString('no-NO', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  if (!statistics) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Ingen regnskapsdata funnet for denne klienten.
        </AlertDescription>
      </Alert>
    );
  }

  const getBalanceStatus = () => {
    if (statistics.isBalanced) return { status: 'success', text: 'Balansert' };
    const diff = Math.abs(statistics.balanceDifference);
    if (diff < 100) return { status: 'warning', text: 'Mindre avvik' };
    return { status: 'destructive', text: 'Ubalanse' };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="space-y-6">
      {/* Last updated timestamp */}
      {lastUpdated && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Sist oppdatert: {lastUpdated}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </div>
      )}

      {/* Hovednøkkeltall */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale transaksjoner</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumeric(statistics.totalTransactions)}</div>
            <p className="text-xs text-muted-foreground">Hovedboksposter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale kontoer</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumeric(statistics.accountDistribution.length)}</div>
            <p className="text-xs text-muted-foreground">Unike kontoer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debet/Kredit balanse</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {formatNumeric(Math.abs(statistics.balanceDifference))}
              </div>
              <Badge variant={balanceStatus.status as any}>
                {balanceStatus.text}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Debet: {formatNumeric(statistics.totalDebit)} / Kredit: {formatNumeric(statistics.totalCredit)}
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
                {statistics.dataQualityIssues === 0 ? 'OK' : 'Feil'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Datakvalitetsproblemer</p>
          </CardContent>
        </Card>
      </div>

      {/* Top kontoer */}
      <Card>
        <CardHeader>
          <CardTitle>Kontoanalyse</CardTitle>
          <CardDescription>Kontoer med høyest aktivitet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.topAccounts.slice(0, 5).map((account, index) => {
              const netValue = safeNet(account);
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{account.account}</div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatNumeric(Math.abs(netValue))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Datakvalitet detaljer */}
      {analysisResult && analysisResult.data_quality_flags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Datakvalitet detaljer</CardTitle>
            <CardDescription>Funnet {statistics.dataQualityIssues} datakvalitetsproblemer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisResult.data_quality_flags.map((flag, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {flag.code === 'MISSING_ACCOUNT' && 'Manglende kontomapping'}
                    {flag.code === 'ZERO_AMOUNT' && 'Nullbeløp transaksjoner'}
                    {flag.code === 'FUTURE_DATE' && 'Fremtidige datoer'}
                  </div>
                  <div className="text-xs text-muted-foreground">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}