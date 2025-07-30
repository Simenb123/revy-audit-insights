import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, LineChart, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { GeneralLedgerTransaction, useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useGeneralLedgerCount } from '@/hooks/useGeneralLedgerCount';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface GeneralLedgerTableProps {
  clientId: string;
  versionId?: string;
}

const GeneralLedgerTable = ({ clientId, versionId }: GeneralLedgerTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 100;
  
  const { data: transactions, isLoading, error } = useGeneralLedgerData(clientId, versionId, { page: currentPage, pageSize });
  const { data: totalCount, isLoading: isCountLoading } = useGeneralLedgerCount(clientId, versionId);
  const { data: allTransactions, isLoading: isExportLoading } = useGeneralLedgerData(clientId, versionId, undefined);

  // Filter and sort transactions
  const filteredAndSortedTransactions = React.useMemo(() => {
    if (!transactions) return [];
    
    // Filter first
    const filtered = transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.account_number.includes(searchTerm) ||
      transaction.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.voucher_number?.includes(searchTerm)
    );
    
    // Then sort
    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof GeneralLedgerTransaction];
      let bValue: any = b[sortBy as keyof GeneralLedgerTransaction];
      
      // Handle date sorting
      if (sortBy === 'transaction_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
   // Handle numeric sorting
   if (sortBy === 'balance_amount' || sortBy === 'debit_amount' || sortBy === 'credit_amount' || sortBy === 'account_number') {
     aValue = Number(aValue) || 0;
     bValue = Number(bValue) || 0;
   }
      
      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [transactions, searchTerm, sortBy, sortOrder]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals
  const totalBalance = filteredAndSortedTransactions.reduce((sum, t) => {
    return sum + (t.balance_amount || 0);
  }, 0);

  const totalDebit = filteredAndSortedTransactions.reduce((sum, t) => {
    if (t.balance_amount !== null && t.balance_amount > 0) return sum + t.balance_amount;
    return sum;
  }, 0);

  const totalCredit = filteredAndSortedTransactions.reduce((sum, t) => {
    if (t.balance_amount !== null && t.balance_amount < 0) return sum + Math.abs(t.balance_amount);
    return sum;
  }, 0);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleExport = () => {
    if (!allTransactions || allTransactions.length === 0) return;
    
    const csvContent = [
      ['Dato', 'Konto', 'Beskrivelse', 'Bilag', 'Beløp', 'Referanse'].join(','),
      ...allTransactions.map(transaction => [
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

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

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
              {!isCountLoading && (
                <span>Viser {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount || 0)} av {totalCount || 0} transaksjoner</span>
              )}
              {transactions && transactions.length > 0 && (
                <span> • Side {currentPage} av {totalPages}</span>
              )}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={isExportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportLoading ? 'Laster...' : 'Eksporter alle'}
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
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('transaction_date')}
                  >
                    <div className="flex items-center gap-2">
                      Dato
                      {getSortIcon('transaction_date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('account_number')}
                  >
                    <div className="flex items-center gap-2">
                      Konto
                      {getSortIcon('account_number')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-2">
                      Beskrivelse
                      {getSortIcon('description')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('voucher_number')}
                  >
                    <div className="flex items-center gap-2">
                      Bilag
                      {getSortIcon('voucher_number')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('debit_amount')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Debet
                      {getSortIcon('debit_amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('credit_amount')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Kredit
                      {getSortIcon('credit_amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('balance_amount')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Saldo
                      {getSortIcon('balance_amount')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} className="text-center text-muted-foreground">
                       Ingen transaksjoner funnet
                     </TableCell>
                   </TableRow>
                ) : (
                  <>
                    {filteredAndSortedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.transaction_date), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{transaction.account_number}</div>
                          <div className="text-sm text-muted-foreground">{transaction.account_name}</div>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                         <TableCell>{transaction.voucher_number || '-'}</TableCell>
                         <TableCell className="text-right">
                           {transaction.debit_amount !== null && transaction.debit_amount !== 0 ? formatCurrency(transaction.debit_amount) : '-'}
                         </TableCell>
                         <TableCell className="text-right">
                           {transaction.credit_amount !== null && transaction.credit_amount !== 0 ? formatCurrency(transaction.credit_amount) : '-'}
                         </TableCell>
                         <TableCell className="text-right">
                           {transaction.balance_amount !== null ? formatCurrency(transaction.balance_amount) : '-'}
                         </TableCell>
                      </TableRow>
                    ))}
                     <TableRow className="font-bold border-t-2 bg-muted/50">
                       <TableCell colSpan={4}>Sum</TableCell>
                       <TableCell className="text-right">{formatCurrency(filteredAndSortedTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0))}</TableCell>
                       <TableCell className="text-right">{formatCurrency(filteredAndSortedTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0))}</TableCell>
                       <TableCell className="text-right">{formatCurrency(totalBalance)}</TableCell>
                     </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {searchTerm ? `Viser ${filteredAndSortedTransactions.length} filtrerte av ${transactions?.length || 0} transaksjoner på denne siden` : `Side ${currentPage} av ${totalPages}`}
            </div>
            
            {!searchTerm && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!hasPrevPage || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Forrige
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Side {currentPage} av {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={!hasNextPage || isLoading}
                >
                  Neste
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralLedgerTable;