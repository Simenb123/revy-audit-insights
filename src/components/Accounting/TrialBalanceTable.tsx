import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { TrialBalanceEntry, useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { Skeleton } from '@/components/ui/skeleton';

interface TrialBalanceTableProps {
  clientId: string;
}

const TrialBalanceTable = ({ clientId }: TrialBalanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: entries, isLoading, error } = useTrialBalanceData(clientId);

  const filteredEntries = entries?.filter(entry =>
    entry.account_number.includes(searchTerm) ||
    entry.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
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
    if (!entries || entries.length === 0) return;
    
    const csvContent = [
      ['Kontonummer', 'Kontonavn', 'Saldo i år', 'Inngående saldo', 'Debet omsetning', 'Kredit omsetning'].join(','),
      ...entries.map(entry => [
        entry.account_number,
        `"${entry.account_name}"`,
        entry.closing_balance,
        entry.opening_balance,
        entry.debit_turnover,
        entry.credit_turnover
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saldobalanse_${new Date().getFullYear()}.csv`;
    link.click();
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
          <CardTitle>Saldobalanse</CardTitle>
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
                  <TableHead className="text-right font-medium">Saldo i år</TableHead>
                  <TableHead className="text-right">Inngående saldo</TableHead>
                  <TableHead className="text-right">Debet omsetning</TableHead>
                  <TableHead className="text-right">Kredit omsetning</TableHead>
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
                          <TableCell>{entry.account_name}</TableCell>
                          <TableCell className="text-right font-medium text-lg">
                            {formatCurrency(entry.closing_balance)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(entry.opening_balance)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(entry.debit_turnover)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(entry.credit_turnover)}
                          </TableCell>
                        </TableRow>
                      ))}
                       <TableRow className="font-bold border-t-2 bg-muted/50">
                         <TableCell colSpan={2}>Sum</TableCell>
                         <TableCell className="text-right text-lg">{formatCurrency(totalClosingBalance)}</TableCell>
                         <TableCell className="text-right">{formatCurrency(totalOpeningBalance)}</TableCell>
                         <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                         <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
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

          <div className="text-sm text-muted-foreground">
            Viser {filteredEntries.length} av {entries?.length || 0} kontoer
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalanceTable;