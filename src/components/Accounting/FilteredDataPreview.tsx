import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNorwegianNumber } from '@/utils/fileProcessing';

interface FilteredDataPreviewProps {
  originalData: any[];
  filteredData: any[];
  stats: {
    originalCount: number;
    filteredCount: number;
    removedCount: number;
    originalBalance: number;
    filteredBalance: number;
    balanceChange: number;
  };
  className?: string;
}

export const FilteredDataPreview = ({ 
  originalData, 
  filteredData, 
  stats, 
  className = "" 
}: FilteredDataPreviewProps) => {
  
  // Calculate balance validation for filtered data
  const isFilteredBalanced = Math.abs(stats.filteredBalance) < 1.0;
  
  // Calculate percentage of data filtered
  const filteredPercentage = stats.originalCount > 0 
    ? Math.round((stats.removedCount / stats.originalCount) * 100) 
    : 0;

  // Sample filtered data for preview
  const sampleSize = 5;
  const sampleData = filteredData.slice(0, sampleSize);

  // Account distribution in filtered data
  const accountDistribution = filteredData.reduce((acc, transaction) => {
    const accountNumber = String(transaction.account_number || 'Ukjent');
    acc[accountNumber] = (acc[accountNumber] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAccounts = Object.entries(accountDistribution)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Balance Status */}
      <Alert className={isFilteredBalanced ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        {isFilteredBalanced ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
        )}
        <AlertDescription className={isFilteredBalanced ? "text-green-800" : "text-yellow-800"}>
          {isFilteredBalanced ? (
            <>✅ Filtrerte data er i balanse ({formatNorwegianNumber(stats.filteredBalance)} kr)</>
          ) : (
            <>⚠️ Filtrerte data har ubalanse på {formatNorwegianNumber(Math.abs(stats.filteredBalance))} kr</>
          )}
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transaksjoner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.filteredCount.toLocaleString('nb-NO')}</div>
            <div className="text-xs text-muted-foreground">
              {filteredPercentage > 0 && (
                <span className="inline-flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -{filteredPercentage}% filtrert bort
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balanse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNorwegianNumber(stats.filteredBalance)} kr</div>
            <div className="text-xs text-muted-foreground">
              {stats.balanceChange !== 0 && (
                <span className={`inline-flex items-center ${stats.balanceChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {stats.balanceChange > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stats.balanceChange > 0 ? '+' : ''}{formatNorwegianNumber(stats.balanceChange)} kr endring
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kontoer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(accountDistribution).length}</div>
            <div className="text-xs text-muted-foreground">
              Unike kontonumre
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Accounts */}
      {topAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mest aktive kontoer</CardTitle>
            <CardDescription>
              Kontoer med flest transaksjoner i filtrerte data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topAccounts.map(([accountNumber, count]) => (
                <div key={accountNumber} className="flex justify-between items-center">
                  <span className="text-sm">{String(accountNumber)}</span>
                  <Badge variant="secondary">{Number(count)} transaksjoner</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Data Preview */}
      {sampleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eksempel på filtrerte data</CardTitle>
            <CardDescription>
              Viser de første {sampleSize} transaksjonene etter filtrering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Dato</th>
                    <th className="text-left p-2">Konto</th>
                    <th className="text-left p-2">Beskrivelse</th>
                    <th className="text-right p-2">Beløp</th>
                    <th className="text-left p-2">Bilag</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((transaction, index) => {
                    const amount = transaction.balance_amount || 
                                 (transaction.debit_amount || 0) - (transaction.credit_amount || 0);
                    
                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="p-2">
                          {new Date(transaction.transaction_date || transaction.date).toLocaleDateString('nb-NO')}
                        </td>
                        <td className="p-2 font-mono">{String(transaction.account_number || '')}</td>
                        <td className="p-2 max-w-xs truncate" title={transaction.description}>
                          {transaction.description || '-'}
                        </td>
                        <td className={`p-2 text-right font-mono ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNorwegianNumber(amount)} kr
                        </td>
                        <td className="p-2">{transaction.voucher_number || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredData.length > sampleSize && (
              <div className="mt-2 text-xs text-muted-foreground text-center">
                ... og {(filteredData.length - sampleSize).toLocaleString('nb-NO')} flere transaksjoner
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilteredDataPreview;