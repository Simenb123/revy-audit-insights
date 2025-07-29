import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
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
  const totalDebit = filteredTransactions.reduce((sum, t) => {
    if (t.debit_amount !== null) return sum + t.debit_amount;
    if (t.balance_amount !== null && t.balance_amount > 0) return sum + t.balance_amount;
    return sum;
  }, 0);

  const totalCredit = filteredTransactions.reduce((sum, t) => {
    if (t.credit_amount !== null) return sum + t.credit_amount;
    if (t.balance_amount !== null && t.balance_amount < 0) return sum + Math.abs(t.balance_amount);
    return sum;
  }, 0);

  const handleExport = () => {
    if (!transactions || transactions.length === 0) return;
    
    const csvContent = [
      ['Dato', 'Konto', 'Beskrivelse', 'Bilag', 'Debet', 'Kredit', 'Referanse'].join(','),
      ...transactions.map(transaction => [
        new Date(transaction.transaction_date).toLocaleDateString('nb-NO'),
        transaction.account_number,
        `"${transaction.description}"`,
        transaction.voucher_number || '',
        transaction.debit_amount || (transaction.balance_amount && transaction.balance_amount > 0 ? transaction.balance_amount : 0),
        transaction.credit_amount || (transaction.balance_amount && transaction.balance_amount < 0 ? Math.abs(transaction.balance_amount) : 0),
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
          <CardTitle>Hovedbok</CardTitle>
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
                  <TableHead className="text-right">Debet</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead>Referanse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                           {transaction.debit_amount !== null ? formatCurrency(transaction.debit_amount) : 
                            (transaction.balance_amount !== null && transaction.balance_amount > 0 ? formatCurrency(transaction.balance_amount) : '-')}
                         </TableCell>
                         <TableCell className="text-right">
                           {transaction.credit_amount !== null ? formatCurrency(transaction.credit_amount) : 
                            (transaction.balance_amount !== null && transaction.balance_amount < 0 ? formatCurrency(Math.abs(transaction.balance_amount)) : '-')}
                         </TableCell>
                        <TableCell>{transaction.reference_number}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 bg-muted/50">
                      <TableCell colSpan={4}>Sum</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
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