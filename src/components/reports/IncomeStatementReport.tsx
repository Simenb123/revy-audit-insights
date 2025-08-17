import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useIncomeStatement } from '@/hooks/useFinancialReports';

interface IncomeStatementReportProps {
  clientId: string;
  periodStart: string;
  periodEnd: string;
}

export const IncomeStatementReport = ({
  clientId,
  periodStart,
  periodEnd,
}: IncomeStatementReportProps) => {
  const { data: incomeStatement, isLoading, error } = useIncomeStatement(
    clientId,
    periodStart,
    periodEnd
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultatregnskap</CardTitle>
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
          <CardTitle>Resultatregnskap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved henting av resultatregnskap</p>
        </CardContent>
      </Card>
    );
  }

  if (!incomeStatement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultatregnskap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingen data tilgjengelig</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultatregnskap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Periode: {new Date(periodStart).toLocaleDateString('nb-NO')} - {new Date(periodEnd).toLocaleDateString('nb-NO')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Driftsinntekter</h3>
          <div className="space-y-2">
            {incomeStatement.revenue.accounts?.map((account) => (
              <div key={account.account_number} className="flex justify-between text-sm">
                <span>{account.account_number} - {account.account_name}</span>
                <span className="font-mono">{formatCurrency(account.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Sum driftsinntekter</span>
              <span className="font-mono">{formatCurrency(incomeStatement.revenue.total)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Driftskostnader</h3>
          <div className="space-y-2">
            {incomeStatement.expenses.accounts?.map((account) => (
              <div key={account.account_number} className="flex justify-between text-sm">
                <span>{account.account_number} - {account.account_name}</span>
                <span className="font-mono">{formatCurrency(account.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Sum driftskostnader</span>
              <span className="font-mono">{formatCurrency(incomeStatement.expenses.total)}</span>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className="border-t-2 pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Nettoresultat</span>
            <span className={`font-mono ${incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(incomeStatement.net_income)}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          Generert: {new Date(incomeStatement.generated_at).toLocaleString('nb-NO')}
        </div>
      </CardContent>
    </Card>
  );
};