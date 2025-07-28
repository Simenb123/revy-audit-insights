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
    entry.account_number.includes(searchTerm) ||
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

    const csvHeaders = ['Kontonummer', 'Kontonavn', 'Åpningsbalanse', 'Debet', 'Kredit', 'Sluttbalanse', 'Mappet til', 'Standard konto'];
    const csvData = filteredEntries.map(entry => [
      entry.account_number,
      entry.account_name,
      formatCurrency(entry.opening_balance),
      formatCurrency(entry.debit_turnover),
      formatCurrency(entry.credit_turnover),
      formatCurrency(entry.closing_balance),
      entry.is_mapped ? 'Ja' : 'Nei',
      entry.standard_name || 'Ikke mappet'
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
                  <TableHead>Kontonummer</TableHead>
                  <TableHead>Kontonavn</TableHead>
                  <TableHead className="text-right">Åpningsbalanse</TableHead>
                  <TableHead className="text-right">Debet</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Sluttbalanse</TableHead>
                  <TableHead>Mapping status</TableHead>
                  <TableHead>Standard konto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Ingen kontoer funnet
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.account_number}</TableCell>
                        <TableCell>{entry.account_name}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.opening_balance)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.debit_turnover)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.credit_turnover)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(entry.closing_balance)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.is_mapped 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {entry.is_mapped ? 'Mappet' : 'Ikke mappet'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.standard_name ? (
                            <div>
                              <span className="font-medium">{entry.standard_number}</span> - {entry.standard_name}
                            </div>
                          ) : (
                            <span className="text-orange-600">Ikke mappet</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 bg-muted/50">
                      <TableCell colSpan={2}>Sum</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalOpeningBalance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalClosingBalance)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    {!isBalanced && (
                      <TableRow className="border-t border-destructive bg-destructive/10">
                        <TableCell colSpan={8} className="text-center text-destructive font-medium">
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
            
            {trialBalanceData && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-muted-foreground">
                  <span className="font-medium text-green-700">{trialBalanceData.mappingStats.mappedAccounts}</span> mappet
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-orange-700">{trialBalanceData.mappingStats.unmappedAccounts}</span> umappet
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalanceTable;