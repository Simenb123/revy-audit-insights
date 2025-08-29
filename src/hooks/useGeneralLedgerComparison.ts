import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GeneralLedgerTransaction } from './useGeneralLedgerData';

export interface VoucherComparison {
  voucherNumber: string;
  oldVersion?: VoucherInfo;
  newVersion?: VoucherInfo;
  status: 'new' | 'modified' | 'unchanged';
  riskLevel: 'low' | 'medium' | 'high';
  changeDescription?: string;
}

export interface VoucherInfo {
  transactionCount: number;
  totalAmount: number;
  transactions: GeneralLedgerTransaction[];
  periodStart: string;
  periodEnd: string;
}

export interface ComparisonResult {
  newVouchers: VoucherComparison[];
  modifiedVouchers: VoucherComparison[];
  unchangedVouchers: VoucherComparison[];
  statistics: {
    totalVouchersOld: number;
    totalVouchersNew: number;
    newCount: number;
    modifiedCount: number;
    unchangedCount: number;
    riskDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export const useGeneralLedgerComparison = (
  clientId: string, 
  oldVersionId?: string, 
  newVersionId?: string
) => {
  return useQuery({
    queryKey: ['general-ledger-comparison', clientId, oldVersionId, newVersionId],
    queryFn: async (): Promise<ComparisonResult> => {
      if (!oldVersionId || !newVersionId) {
        throw new Error('Both version IDs are required for comparison');
      }

      // Fetch data for both versions
      const [oldVersionData, newVersionData] = await Promise.all([
        fetchVersionData(clientId, oldVersionId),
        fetchVersionData(clientId, newVersionId)
      ]);

      // Group transactions by voucher number
      const oldVouchers = groupByVoucher(oldVersionData);
      const newVouchers = groupByVoucher(newVersionData);

      // Compare vouchers
      const comparison = compareVouchers(oldVouchers, newVouchers);

      return {
        newVouchers: comparison.filter(v => v.status === 'new'),
        modifiedVouchers: comparison.filter(v => v.status === 'modified'),
        unchangedVouchers: comparison.filter(v => v.status === 'unchanged'),
        statistics: {
          totalVouchersOld: Object.keys(oldVouchers).length,
          totalVouchersNew: Object.keys(newVouchers).length,
          newCount: comparison.filter(v => v.status === 'new').length,
          modifiedCount: comparison.filter(v => v.status === 'modified').length,
          unchangedCount: comparison.filter(v => v.status === 'unchanged').length,
          riskDistribution: {
            high: comparison.filter(v => v.riskLevel === 'high').length,
            medium: comparison.filter(v => v.riskLevel === 'medium').length,
            low: comparison.filter(v => v.riskLevel === 'low').length,
          }
        }
      };
    },
    enabled: !!clientId && !!oldVersionId && !!newVersionId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

async function fetchVersionData(clientId: string, versionId: string): Promise<GeneralLedgerTransaction[]> {
  const { data, error } = await supabase
    .from('general_ledger_transactions')
    .select(`
      id,
      transaction_date,
      client_account_id,
      description,
      debit_amount,
      credit_amount,
      balance_amount,
      reference_number,
      voucher_number,
      period_year,
      period_month,
      account_number,
      account_name
    `)
    .eq('client_id', clientId)
    .eq('version_id', versionId)
    .order('voucher_number')
    .order('transaction_date');

  if (error) throw error;

  return (data || []).map((transaction: any) => ({
    id: transaction.id,
    transaction_date: transaction.transaction_date,
    client_account_id: transaction.client_account_id,
    account_number: transaction.account_number || 'Ukjent',
    account_name: transaction.account_name || 'Ukjent konto',
    description: transaction.description,
    debit_amount: transaction.debit_amount,
    credit_amount: transaction.credit_amount,
    balance_amount: transaction.balance_amount,
    reference_number: transaction.reference_number || '',
    voucher_number: transaction.voucher_number || '',
    period_year: transaction.period_year,
    period_month: transaction.period_month,
  })) as GeneralLedgerTransaction[];
}

function groupByVoucher(transactions: GeneralLedgerTransaction[]): Record<string, VoucherInfo> {
  const grouped: Record<string, VoucherInfo> = {};

  transactions.forEach(transaction => {
    const voucherNumber = transaction.voucher_number || 'NO_VOUCHER';
    
    if (!grouped[voucherNumber]) {
      grouped[voucherNumber] = {
        transactionCount: 0,
        totalAmount: 0,
        transactions: [],
        periodStart: transaction.transaction_date,
        periodEnd: transaction.transaction_date
      };
    }

    const voucher = grouped[voucherNumber];
    voucher.transactionCount++;
    voucher.totalAmount += transaction.balance_amount || 0;
    voucher.transactions.push(transaction);
    
    // Update period range
    if (transaction.transaction_date < voucher.periodStart) {
      voucher.periodStart = transaction.transaction_date;
    }
    if (transaction.transaction_date > voucher.periodEnd) {
      voucher.periodEnd = transaction.transaction_date;
    }
  });

  return grouped;
}

function compareVouchers(
  oldVouchers: Record<string, VoucherInfo>, 
  newVouchers: Record<string, VoucherInfo>
): VoucherComparison[] {
  const allVoucherNumbers = new Set([
    ...Object.keys(oldVouchers),
    ...Object.keys(newVouchers)
  ]);

  return Array.from(allVoucherNumbers).map(voucherNumber => {
    const oldVoucher = oldVouchers[voucherNumber];
    const newVoucher = newVouchers[voucherNumber];

    if (!oldVoucher && newVoucher) {
      // New voucher
      return {
        voucherNumber,
        newVersion: newVoucher,
        status: 'new' as const,
        riskLevel: determineRiskLevel(newVoucher, 'new'),
        changeDescription: `Nytt bilag med ${newVoucher.transactionCount} linjer`
      };
    } else if (oldVoucher && !newVoucher) {
      // Deleted voucher (shouldn't happen in typical scenarios)
      return {
        voucherNumber,
        oldVersion: oldVoucher,
        status: 'modified' as const,
        riskLevel: 'high' as const,
        changeDescription: 'Bilag slettet'
      };
    } else if (oldVoucher && newVoucher) {
      // Compare existing vouchers
      const isModified = (
        oldVoucher.transactionCount !== newVoucher.transactionCount ||
        Math.abs(oldVoucher.totalAmount - newVoucher.totalAmount) > 0.01
      );

      return {
        voucherNumber,
        oldVersion: oldVoucher,
        newVersion: newVoucher,
        status: isModified ? 'modified' : 'unchanged',
        riskLevel: isModified ? determineRiskLevel(newVoucher, 'modified') : 'low',
        changeDescription: isModified ? generateChangeDescription(oldVoucher, newVoucher) : undefined
      };
    }

    // This shouldn't happen
    return {
      voucherNumber,
      status: 'unchanged' as const,
      riskLevel: 'low' as const
    };
  });
}

function determineRiskLevel(voucher: VoucherInfo, changeType: 'new' | 'modified'): 'low' | 'medium' | 'high' {
  const amount = Math.abs(voucher.totalAmount);
  
  // High risk criteria
  if (amount > 100000 || voucher.transactionCount > 10) {
    return 'high';
  }
  
  // Medium risk criteria
  if (amount > 10000 || voucher.transactionCount > 3 || changeType === 'modified') {
    return 'medium';
  }
  
  return 'low';
}

function generateChangeDescription(oldVoucher: VoucherInfo, newVoucher: VoucherInfo): string {
  const changes: string[] = [];
  
  if (oldVoucher.transactionCount !== newVoucher.transactionCount) {
    changes.push(`Linjer: ${oldVoucher.transactionCount} → ${newVoucher.transactionCount}`);
  }
  
  if (Math.abs(oldVoucher.totalAmount - newVoucher.totalAmount) > 0.01) {
    changes.push(`Beløp: ${formatCurrency(oldVoucher.totalAmount)} → ${formatCurrency(newVoucher.totalAmount)}`);
  }
  
  return changes.join(', ');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK'
  }).format(amount);
}