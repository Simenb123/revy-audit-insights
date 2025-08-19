import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Eye, FileText } from 'lucide-react';

interface VoucherTransaction {
  id: string;
  transaction_date: string;
  voucher_number: string;
  account_number: string;
  account_name: string;
  description: string;
  debit_amount: number | null;
  credit_amount: number | null;
  balance_amount: number;
  vat_code?: string;
  vat_rate?: number;
  vat_base?: number;
  vat_debit?: number;
  vat_credit?: number;
}

interface VoucherDrillDownDialogProps {
  voucherNumber: string;
  transactionDate: string;
  trigger?: React.ReactNode;
}

const VoucherDrillDownDialog: React.FC<VoucherDrillDownDialogProps> = ({
  voucherNumber,
  transactionDate,
  trigger,
}) => {
  // Fetch all transactions for the voucher
  const { data: voucherTransactions, isLoading, error } = useQuery({
    queryKey: ['voucher-transactions', voucherNumber, transactionDate],
    queryFn: async () => {
      // Get all transactions with same voucher number and date
      const { data, error } = await supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          voucher_number,
          account_number,
          account_name,
          description,
          debit_amount,
          credit_amount,
          balance_amount,
          vat_code,
          vat_rate,
          vat_base,
          vat_debit,
          vat_credit
        `)
        .eq('voucher_number', voucherNumber)
        .eq('transaction_date', transactionDate)
        .order('account_number', { ascending: true });

      if (error) throw error;
      return data as VoucherTransaction[];
    },
    enabled: !!voucherNumber && !!transactionDate,
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === 0) return '-';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  // Calculate totals
  const totals = voucherTransactions ? {
    totalDebit: voucherTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0),
    totalCredit: voucherTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0),
    totalBalance: voucherTransactions.reduce((sum, t) => sum + t.balance_amount, 0),
  } : { totalDebit: 0, totalCredit: 0, totalBalance: 0 };

  const isBalanced = Math.abs(totals.totalDebit - totals.totalCredit) < 0.01;

  const columns: DataTableColumn<VoucherTransaction>[] = [
    {
      key: 'account_number',
      header: 'Kontonr',
      accessor: 'account_number',
      sortable: true,
      className: 'font-medium',
    },
    {
      key: 'account_name',
      header: 'Kontonavn',
      accessor: 'account_name',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Beskrivelse',
      accessor: 'description',
      className: 'max-w-xs truncate',
    },
    {
      key: 'debit_amount',
      header: 'Debet',
      accessor: 'debit_amount',
      align: 'right',
      format: (value: number | null) => formatCurrency(value),
    },
    {
      key: 'credit_amount',
      header: 'Kredit',
      accessor: 'credit_amount',
      align: 'right',
      format: (value: number | null) => formatCurrency(value),
    },
    {
      key: 'balance_amount',
      header: 'Beløp',
      accessor: 'balance_amount',
      align: 'right',
      format: (value: number) => (
        <span className={value < 0 ? 'text-red-600' : ''}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'vat_code',
      header: 'MVA',
      accessor: 'vat_code',
      format: (value: string | undefined, row: VoucherTransaction) => {
        if (!value) return '-';
        return (
          <div className="text-sm">
            <div>{value}</div>
            {row.vat_rate && (
              <div className="text-muted-foreground">
                {row.vat_rate}%
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4 mr-2" />
      Vis bilag
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bilag: {voucherNumber}
              </DialogTitle>
              <DialogDescription>
                Dato: {formatDate(transactionDate)} • 
                {voucherTransactions?.length || 0} posteringer
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isBalanced ? "default" : "destructive"}>
                {isBalanced ? "Balansert" : "Ikke balansert"}
              </Badge>
              {!isBalanced && (
                <Badge variant="outline">
                  Differanse: {formatCurrency(totals.totalDebit - totals.totalCredit)}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <DataTable
            title=""
            data={voucherTransactions || []}
            columns={columns}
            isLoading={isLoading}
            enableExport={true}
            exportFileName={`bilag-${voucherNumber}-${transactionDate}`}
            enablePagination={false}
            showTotals={true}
            totalRow={
              <tr className="border-t-2 font-medium bg-muted/50">
                <td className="px-4 py-2" colSpan={3}>Totaler:</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totals.totalDebit)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totals.totalCredit)}</td>
                <td className="px-4 py-2 text-right">
                  <span className={totals.totalBalance < 0 ? 'text-red-600' : ''}>
                    {formatCurrency(totals.totalBalance)}
                  </span>
                </td>
                <td className="px-4 py-2"></td>
              </tr>
            }
            emptyMessage={error ? "Feil ved lasting av data" : "Ingen transaksjoner funnet"}
            wrapInCard={false}
            showSearch={false}
            maxBodyHeight="60vh"
            stickyHeader={true}
          />
        </div>

        {error && (
          <div className="text-center py-4 text-red-600">
            Kunne ikke laste transaksjoner for bilag {voucherNumber}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDrillDownDialog;