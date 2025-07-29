import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, LineChart } from 'lucide-react';
import { GeneralLedgerTransaction, useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface GeneralLedgerTableProps {
  clientId: string;
}

const GeneralLedgerTable = ({ clientId }: GeneralLedgerTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: transactions, isLoading, error } = useGeneralLedgerData(clientId);

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.account_number.includes(searchTerm) ||
    transaction.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.voucher_number?.includes(searchTerm)
  ) || [];

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals
  const totalBalance = filteredTransactions.reduce((sum, t) => {
    return sum + (t.balance_amount || 0);
  }, 0);

  const totalDebit = filteredTransactions.reduce((sum, t) => {
    if (t.balance_amount !== null && t.balance_amount > 0) return sum + t.balance_amount;
    return sum;
  }, 0);

  const totalCredit = filteredTransactions.reduce((sum, t) => {
    if (t.balance_amount !== null && t.balance_amount < 0) return sum + Math.abs(t.balance_amount);
    return sum;
  }, 0);

  const handleExport = () => {
    if (!transactions || transactions.length === 0) return;
    
    const csvContent = [
      ['Dato', 'Konto', 'Beskrivelse', 'Bilag', 'Beløp', 'Referanse'].join(','),
      ...transactions.map(transaction => [
        new Date(transaction.transaction_date).toLocaleDateString('nb-NO'),
        transaction.account_number,
        `"${transaction.description}"`,
        transaction.voucher_number || '',
        transaction.balance_amount || 0,
        transaction.reference_number || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hovedbok_${new Date().getFullYear()}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hovedbok</CardTitle>
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
          <CardTitle>Hovedbok</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved lasting av hovedbok: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Hovedbok
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Viser {transactions?.length || 0} transaksjoner
              {transactions && transactions.length > 0 && (
                <span> • Periode: {format(new Date(transactions[transactions.length - 1].transaction_date), 'dd.MM.yyyy')} - {format(new Date(transactions[0].transaction_date), 'dd.MM.yyyy')}</span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Eksporter alle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i transaksjoner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  <TableHead>Konto</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead>Bilag</TableHead>
                  <TableHead className="text-right">Beløp</TableHead>
                  <TableHead>Referanse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Ingen transaksjoner funnet
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.transaction_date), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{transaction.account_number}</div>
                          <div className="text-sm text-muted-foreground">{transaction.account_name}</div>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.voucher_number}</TableCell>
                        <TableCell className="text-right">
                          {transaction.balance_amount !== null ? formatCurrency(transaction.balance_amount) : '-'}
                        </TableCell>
                        <TableCell>{transaction.reference_number}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 bg-muted/50">
                      <TableCell colSpan={4}>Sum</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalBalance)}</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Viser {filteredTransactions.length} av {transactions?.length || 0} transaksjoner
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralLedgerTable;