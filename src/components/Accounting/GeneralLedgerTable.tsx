import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { GeneralLedgerTransaction, useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useGeneralLedgerCount } from '@/hooks/useGeneralLedgerCount';
import { getFieldDefinitions } from '@/utils/fieldDefinitions';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface GeneralLedgerTableProps {
  clientId: string;
  versionId?: string;
}

const GeneralLedgerTable = ({ clientId, versionId }: GeneralLedgerTableProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 100;
  
  const { data: transactions, isLoading, error } = useGeneralLedgerData(clientId, versionId, { page: currentPage, pageSize });
  const { data: totalCount, isLoading: isCountLoading } = useGeneralLedgerCount(clientId, versionId);
  const { data: allTransactions, isLoading: isExportLoading } = useGeneralLedgerData(clientId, versionId, undefined);
  
  // Get field definitions for general ledger
  const { data: fieldDefinitions } = useQuery({
    queryKey: ['field-definitions', 'general_ledger'],
    queryFn: () => getFieldDefinitions('general_ledger'),
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Define columns based on field definitions
  const columns: DataTableColumn<GeneralLedgerTransaction>[] = useMemo(() => {
    if (!fieldDefinitions) {
      // Fallback columns if field definitions are not loaded
      return [
        {
          key: 'transaction_date',
          header: 'Dato',
          accessor: 'transaction_date',
          sortable: true,
          format: (value: string) => format(new Date(value), 'dd.MM.yyyy'),
        },
        {
          key: 'account_info',
          header: 'Konto',
          accessor: (transaction: GeneralLedgerTransaction) => (
            <div>
              <div className="font-medium">{transaction.account_number}</div>
              <div className="text-sm text-muted-foreground">{transaction.account_name}</div>
            </div>
          ),
          sortable: true,
          searchable: true,
        },
        {
          key: 'description',
          header: 'Beskrivelse',
          accessor: 'description',
          sortable: true,
          searchable: true,
        },
        {
          key: 'voucher_number',
          header: 'Bilag',
          accessor: 'voucher_number',
          sortable: true,
          searchable: true,
          format: (value: string | null) => value || '-',
        },
        {
          key: 'balance_amount',
          header: 'Beløp',
          accessor: 'balance_amount',
          sortable: true,
          align: 'right',
          format: (value: number | null) => (
            <span className={value && value < 0 ? 'text-red-600' : ''}>
              {formatCurrency(value)}
            </span>
          ),
        },
      ];
    }

    // Map field definitions to columns
    const baseColumns: DataTableColumn<GeneralLedgerTransaction>[] = [];

    // Add columns based on field definitions
    const dateField = fieldDefinitions.find(f => f.field_key === 'transaction_date');
    const accountField = fieldDefinitions.find(f => f.field_key === 'account_number');
    const descriptionField = fieldDefinitions.find(f => f.field_key === 'description');
    const voucherField = fieldDefinitions.find(f => f.field_key === 'voucher_number');
    const amountField = fieldDefinitions.find(f => f.field_key === 'balance_amount') || 
                       fieldDefinitions.find(f => f.field_key === 'debit_amount');

    if (dateField) {
      baseColumns.push({
        key: 'transaction_date',
        header: dateField.field_label,
        accessor: 'transaction_date',
        sortable: true,
        format: (value: string) => format(new Date(value), 'dd.MM.yyyy'),
      });
    }

    if (accountField) {
      baseColumns.push({
        key: 'account_info',
        header: accountField.field_label,
        accessor: (transaction: GeneralLedgerTransaction) => (
          <div>
            <div className="font-medium">{transaction.account_number}</div>
            <div className="text-sm text-muted-foreground">{transaction.account_name}</div>
          </div>
        ),
        sortable: true,
        searchable: true,
      });
    }

    if (descriptionField) {
      baseColumns.push({
        key: 'description',
        header: descriptionField.field_label,
        accessor: 'description',
        sortable: true,
        searchable: true,
      });
    }

    if (voucherField) {
      baseColumns.push({
        key: 'voucher_number',
        header: voucherField.field_label,
        accessor: 'voucher_number',
        sortable: true,
        searchable: true,
        format: (value: string | null) => value || '-',
      });
    }

    if (amountField) {
      baseColumns.push({
        key: 'balance_amount',
        header: amountField.field_label,
        accessor: 'balance_amount',
        sortable: true,
        align: 'right',
        format: (value: number | null) => (
          <span className={value && value < 0 ? 'text-red-600' : ''}>
            {formatCurrency(value)}
          </span>
        ),
      });
    }

    return baseColumns;
  }, [fieldDefinitions]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!transactions) return null;
    
    return {
      balance: transactions.reduce((sum, t) => sum + (t.balance_amount || 0), 0),
      debit: transactions.reduce((sum, t) => {
        if (t.balance_amount !== null && t.balance_amount > 0) return sum + t.balance_amount;
        return sum;
      }, 0),
      credit: transactions.reduce((sum, t) => {
        if (t.balance_amount !== null && t.balance_amount < 0) return sum + Math.abs(t.balance_amount);
        return sum;
      }, 0),
    };
  }, [transactions]);

  // Create total row
  const totalRow = totals ? (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={4}>Sum</TableCell>
      <TableCell className="text-right">
        <span className={Math.abs(totals.balance) < 0.01 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(totals.balance)}
        </span>
      </TableCell>
    </TableRow>
  ) : null;

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  
  // Create description text
  const description = !isCountLoading ? 
    `Viser ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount || 0)} av ${totalCount || 0} transaksjoner${transactions && transactions.length > 0 ? ` • Side ${currentPage} av ${totalPages}` : ''}` :
    undefined;

  return (
    <DataTable
      title="Hovedbok"
      description={description}
      icon={<LineChart className="h-5 w-5" />}
      data={transactions || []}
      columns={columns}
      isLoading={isLoading}
      error={error}
      searchPlaceholder="Søk i transaksjoner..."
      enableExport={true}
      exportFileName={`hovedbok_${new Date().getFullYear()}`}
      enablePagination={true}
      pageSize={pageSize}
      totalCount={totalCount || 0}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      showTotals={true}
      totalRow={totalRow}
      emptyMessage="Ingen transaksjoner funnet"
    />
  );
};

export default GeneralLedgerTable;