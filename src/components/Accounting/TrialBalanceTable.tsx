import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { TrialBalanceEntryWithMapping, useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { Skeleton } from '@/components/ui/skeleton';

interface TrialBalanceTableProps {
  clientId: string;
}

const TrialBalanceTable = ({ clientId }: TrialBalanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: trialBalanceData, isLoading, error } = useTrialBalanceWithMappings(clientId);

  const entries = trialBalanceData?.trialBalanceEntries || [];
  
  const filteredEntries = entries.filter(entry =>
    entry.account_number.toString().includes(searchTerm) ||
    entry.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit_turnover, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit_turnover, 0);
  const totalOpeningBalance = filteredEntries.reduce((sum, entry) => sum + entry.opening_balance, 0);
  const totalClosingBalance = filteredEntries.reduce((sum, entry) => sum + entry.closing_balance, 0);
  
  // Check if trial balance is balanced (difference should be close to 0)
  const balanceDifference = Math.abs(totalDebit - totalCredit);
  const isBalanced = balanceDifference <= 1; // Allow rounding up to 1 kr

  const handleExport = () => {
    if (!entries.length) return;

    const csvHeaders = ['Konto-ID', 'Periode', 'Åpningsbalanse', 'Debet', 'Kredit', 'Sluttsaldo'];
    const csvData = filteredEntries.map(entry => [
      entry.account_number,
      `${entry.period_year} (${entry.period_end_date})`,
      formatCurrency(entry.opening_balance),
      formatCurrency(entry.debit_turnover),
      formatCurrency(entry.credit_turnover),
      formatCurrency(entry.closing_balance)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `saldobalanse_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved lasting av saldobalanse: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Saldobalanse</CardTitle>
            {trialBalanceData && (
              <p className="text-sm text-muted-foreground mt-1">
                {trialBalanceData.mappingStats.mappedAccounts} av {trialBalanceData.mappingStats.totalAccounts} kontoer mappet til standardkontoer
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i kontoer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konto-ID</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Åpningsbalanse</TableHead>
                  <TableHead className="text-right">Debet</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Sluttsaldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Ingen kontoer funnet
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.account_number}</TableCell>
                        <TableCell>{entry.period_year} ({entry.period_end_date})</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.opening_balance)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.debit_turnover)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.credit_turnover)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.closing_balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 bg-muted/50">
                      <TableCell colSpan={2}>Sum</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalOpeningBalance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalClosingBalance)}</TableCell>
                    </TableRow>
                    {!isBalanced && (
                      <TableRow className="border-t border-destructive bg-destructive/10">
                        <TableCell colSpan={6} className="text-center text-destructive font-medium">
                          ⚠️ Advarsel: Saldobalansen er ikke i balanse. Differanse: {formatCurrency(balanceDifference)}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="text-sm text-muted-foreground">
              Viser {filteredEntries.length} av {entries.length} kontoer
            </div>
            
            <div className="text-muted-foreground">
              Periode: {entries.length > 0 ? `${entries[0].period_year} (${entries[0].period_end_date})` : 'Ingen data'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalanceTable;