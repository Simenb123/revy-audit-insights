import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, AlertTriangle, Database, CheckCircle, Calculator, FileText } from 'lucide-react';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useGeneralLedgerValidation } from '@/hooks/useGeneralLedgerValidation';
import { formatNumeric, formatPercent } from '@/utils/kpiFormat';

interface RegnskapsDashboardProps {
  clientId: string;
}

interface StatisticsData {
  totalTransactions: number;
  uniqueVouchers: number;
  minAmount: number;
  maxAmount: number;
  avgAmount: number;
  medianAmount: number;
  stdDeviation: number;
  totalDebit: number;
  totalCredit: number;
  balanceDifference: number;
}

interface CrossCheckResult {
  accountsInLedgerOnly: string[];
  accountsInTrialOnly: string[];
  balanceDiscrepancies: Array<{
    accountNumber: string;
    ledgerBalance: number;
    trialBalance: number;
    difference: number;
  }>;
}

export function RegnskapsDashboard({ clientId }: RegnskapsDashboardProps) {
  // Hent hovedboksdata
  const { data: ledgerData, isLoading: ledgerLoading, error: ledgerError } = useGeneralLedgerData(
    clientId,
    undefined,
    undefined,
    undefined
  );

  // Hent saldobalanse
  const { data: trialBalanceData, isLoading: trialLoading, error: trialError } = useTrialBalanceData(clientId);

  // Valider hovedboksdata
  const validationResults = useGeneralLedgerValidation(ledgerData || []);

  const isLoading = ledgerLoading || trialLoading;
  const hasError = ledgerError || trialError;

  // Beregn statistikk
  const statistics = useMemo((): StatisticsData | null => {
    if (!ledgerData || ledgerData.length === 0) return null;

    const amounts = ledgerData
      .map(t => Math.abs(t.balance_amount || 0))
      .filter(amount => amount > 0)
      .sort((a, b) => a - b);

    const vouchers = new Set(ledgerData.map(t => t.voucher_number).filter(Boolean));
    
    const totalDebit = ledgerData.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
    const totalCredit = ledgerData.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
    
    const avgAmount = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const medianAmount = amounts.length ? 
      amounts.length % 2 === 0 
        ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
        : amounts[Math.floor(amounts.length / 2)]
      : 0;

    // Standard deviation
    const variance = amounts.length ? 
      amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length
      : 0;
    const stdDeviation = Math.sqrt(variance);

    return {
      totalTransactions: ledgerData.length,
      uniqueVouchers: vouchers.size,
      minAmount: amounts.length ? amounts[0] : 0,
      maxAmount: amounts.length ? amounts[amounts.length - 1] : 0,
      avgAmount,
      medianAmount,
      stdDeviation,
      totalDebit,
      totalCredit,
      balanceDifference: totalDebit - totalCredit
    };
  }, [ledgerData]);

  // Kryssjekk hovedbok vs saldobalanse
  const crossCheck = useMemo((): CrossCheckResult | null => {
    if (!ledgerData || !trialBalanceData) return null;

    const ledgerAccounts = new Set(ledgerData.map(t => t.account_number).filter(Boolean));
    const trialAccounts = new Set(trialBalanceData.map(t => t.account_number).filter(Boolean));

    const accountsInLedgerOnly = Array.from(ledgerAccounts).filter(acc => !trialAccounts.has(acc));
    const accountsInTrialOnly = Array.from(trialAccounts).filter(acc => !ledgerAccounts.has(acc));

    // Sammenlign saldoer
    const balanceDiscrepancies: CrossCheckResult['balanceDiscrepancies'] = [];
    
    for (const trialEntry of trialBalanceData) {
      if (!trialEntry.account_number) continue;
      
      const ledgerSum = ledgerData
        .filter(t => t.account_number === trialEntry.account_number)
        .reduce((sum, t) => sum + (t.balance_amount || 0), 0);
      
      const trialBalance = trialEntry.closing_balance || 0;
      const difference = Math.abs(ledgerSum - trialBalance);
      
      if (difference > 0.01) { // Toleranse for avrundingsfeil
        balanceDiscrepancies.push({
          accountNumber: trialEntry.account_number,
          ledgerBalance: ledgerSum,
          trialBalance,
          difference
        });
      }
    }

    return {
      accountsInLedgerOnly,
      accountsInTrialOnly,
      balanceDiscrepancies
    };
  }, [ledgerData, trialBalanceData]);

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

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Kunne ikke laste regnskapsdata: {ledgerError?.message || trialError?.message}
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
    const diff = Math.abs(statistics.balanceDifference);
    if (diff < 0.01) return { status: 'success', text: 'Balansert' };
    if (diff < 100) return { status: 'warning', text: 'Mindre avvik' };
    return { status: 'destructive', text: 'Ubalanse' };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Unike bilag</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumeric(statistics.uniqueVouchers)}</div>
            <p className="text-xs text-muted-foreground">Bilagsnummer</p>
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
              <div className="text-2xl font-bold">{validationResults.totalValidationErrors}</div>
              <Badge variant={validationResults.totalValidationErrors === 0 ? 'success' : 'destructive'}>
                {validationResults.totalValidationErrors === 0 ? 'OK' : 'Feil'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Ubalanserte bilag</p>
          </CardContent>
        </Card>
      </div>

      {/* Beløpsstatistikk */}
      <Card>
        <CardHeader>
          <CardTitle>Beløpsanalyse</CardTitle>
          <CardDescription>Statistisk fordeling av transaksjonsbeløp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Minimum</div>
              <div className="text-lg font-medium">{formatNumeric(statistics.minAmount)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Gjennomsnitt</div>
              <div className="text-lg font-medium">{formatNumeric(statistics.avgAmount)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Median</div>
              <div className="text-lg font-medium">{formatNumeric(statistics.medianAmount)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Maksimum</div>
              <div className="text-lg font-medium">{formatNumeric(statistics.maxAmount)}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Standardavvik</div>
              <div className="text-lg font-medium">{formatNumeric(statistics.stdDeviation)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kryssjekk og datakvalitet */}
      {crossCheck && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Kryssjekk: Hovedbok vs Saldobalanse</CardTitle>
              <CardDescription>Sammenligning av kontoer og saldoer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Kontoer kun i hovedbok:</span>
                  <Badge variant={crossCheck.accountsInLedgerOnly.length > 0 ? 'warning' : 'success'}>
                    {crossCheck.accountsInLedgerOnly.length}
                  </Badge>
                </div>
                {crossCheck.accountsInLedgerOnly.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {crossCheck.accountsInLedgerOnly.slice(0, 5).join(', ')}
                    {crossCheck.accountsInLedgerOnly.length > 5 && ` +${crossCheck.accountsInLedgerOnly.length - 5} flere`}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Kontoer kun i saldobalanse:</span>
                  <Badge variant={crossCheck.accountsInTrialOnly.length > 0 ? 'warning' : 'success'}>
                    {crossCheck.accountsInTrialOnly.length}
                  </Badge>
                </div>
                {crossCheck.accountsInTrialOnly.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {crossCheck.accountsInTrialOnly.slice(0, 5).join(', ')}
                    {crossCheck.accountsInTrialOnly.length > 5 && ` +${crossCheck.accountsInTrialOnly.length - 5} flere`}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Saldoavvik:</span>
                  <Badge variant={crossCheck.balanceDiscrepancies.length > 0 ? 'destructive' : 'success'}>
                    {crossCheck.balanceDiscrepancies.length}
                  </Badge>
                </div>
                {crossCheck.balanceDiscrepancies.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Største avvik: {formatNumeric(Math.max(...crossCheck.balanceDiscrepancies.map(d => d.difference)))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datakvalitet detaljer</CardTitle>
              <CardDescription>Validering av regnskapsdata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ubalanserte bilag:</span>
                  <Badge variant={validationResults.totalValidationErrors > 0 ? 'destructive' : 'success'}>
                    {validationResults.totalValidationErrors}
                  </Badge>
                </div>
                {validationResults.vouchersWithImbalance.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Største ubalanse: {formatNumeric(Math.max(...validationResults.vouchersWithImbalance.map(v => Math.abs(v.balance))))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total hovedboksbalanse:</span>
                  <Badge variant={Math.abs(validationResults.overallBalance) < 0.01 ? 'success' : 'warning'}>
                    {formatNumeric(Math.abs(validationResults.overallBalance))}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gjennomsnittlig poster pr. bilag:</span>
                  <span className="text-sm font-medium">
                    {statistics.uniqueVouchers > 0 ? formatNumeric(statistics.totalTransactions / statistics.uniqueVouchers) : '0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}