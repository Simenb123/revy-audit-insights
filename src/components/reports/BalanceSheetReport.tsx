import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useBalanceSheet } from '@/hooks/useFinancialReports';

interface BalanceSheetReportProps {
  clientId: string;
  asOfDate: string;
}

export const BalanceSheetReport = ({
  clientId,
  asOfDate,
}: BalanceSheetReportProps) => {
  const { data: balanceSheet, isLoading, error } = useBalanceSheet(
    clientId,
    asOfDate
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balanse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balanse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved henting av balanse</p>
        </CardContent>
      </Card>
    );
  }

  if (!balanceSheet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balanse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingen data tilgjengelig</p>
        </CardContent>
      </Card>
    );
  }

  const totalLiabilitiesAndEquity = balanceSheet.liabilities.total + balanceSheet.equity.total;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balanse</CardTitle>
        <p className="text-sm text-muted-foreground">
          Per: {new Date(asOfDate).toLocaleDateString('nb-NO')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Assets */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Eiendeler</h3>
            <div className="space-y-2">
              {balanceSheet.assets.accounts?.map((account) => (
                <div key={account.account_number} className="flex justify-between text-sm">
                  <span className="text-xs">{account.account_number} - {account.account_name}</span>
                  <span className="font-mono text-sm">{formatCurrency(account.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Sum eiendeler</span>
                <span className="font-mono">{formatCurrency(balanceSheet.assets.total)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities and Equity */}
          <div className="space-y-6">
            {/* Liabilities */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Gjeld</h3>
              <div className="space-y-2">
                {balanceSheet.liabilities.accounts?.map((account) => (
                  <div key={account.account_number} className="flex justify-between text-sm">
                    <span className="text-xs">{account.account_number} - {account.account_name}</span>
                    <span className="font-mono text-sm">{formatCurrency(account.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Sum gjeld</span>
                  <span className="font-mono">{formatCurrency(balanceSheet.liabilities.total)}</span>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Egenkapital</h3>
              <div className="space-y-2">
                {balanceSheet.equity.accounts?.map((account) => (
                  <div key={account.account_number} className="flex justify-between text-sm">
                    <span className="text-xs">{account.account_number} - {account.account_name}</span>
                    <span className="font-mono text-sm">{formatCurrency(account.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Sum egenkapital</span>
                  <span className="font-mono">{formatCurrency(balanceSheet.equity.total)}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilities and Equity */}
            <div className="border-t-2 pt-2">
              <div className="flex justify-between font-semibold text-base">
                <span>Sum gjeld og egenkapital</span>
                <span className="font-mono">{formatCurrency(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className="border-t pt-4">
          <div className={`flex justify-between text-sm ${
            Math.abs(balanceSheet.assets.total - totalLiabilitiesAndEquity) < 0.01 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            <span>Balansekontroll:</span>
            <span className="font-mono">
              {Math.abs(balanceSheet.assets.total - totalLiabilitiesAndEquity) < 0.01 
                ? '✓ Balansert' 
                : `Differanse: ${formatCurrency(balanceSheet.assets.total - totalLiabilitiesAndEquity)}`
              }
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          Generert: {new Date(balanceSheet.generated_at).toLocaleString('nb-NO')}
        </div>
      </CardContent>
    </Card>
  );
};