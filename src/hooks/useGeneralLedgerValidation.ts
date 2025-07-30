import { useMemo } from 'react';

interface TransactionValidation {
  vouchersWithImbalance: Array<{
    voucherNumber: string;
    balance: number;
    transactionCount: number;
  }>;
  totalValidationErrors: number;
  overallBalance: number;
}

export const useGeneralLedgerValidation = (transactions: any[]): TransactionValidation => {
  return useMemo(() => {
    const voucherGroups = new Map<string, number>();
    const voucherCounts = new Map<string, number>();
    let overallBalance = 0;

    transactions.forEach(transaction => {
      const balance = transaction.balance_amount || 0;
      const voucherNumber = transaction.voucher_number || 'NO_VOUCHER';
      
      overallBalance += balance;
      
      // Group by voucher number
      const currentBalance = voucherGroups.get(voucherNumber) || 0;
      const currentCount = voucherCounts.get(voucherNumber) || 0;
      
      voucherGroups.set(voucherNumber, currentBalance + balance);
      voucherCounts.set(voucherNumber, currentCount + 1);
    });

    // Find vouchers with imbalance (tolerance of 0.01)
    const vouchersWithImbalance: Array<{
      voucherNumber: string;
      balance: number;
      transactionCount: number;
    }> = [];

    voucherGroups.forEach((balance, voucherNumber) => {
      if (Math.abs(balance) > 0.01) {
        vouchersWithImbalance.push({
          voucherNumber,
          balance,
          transactionCount: voucherCounts.get(voucherNumber) || 0
        });
      }
    });

    return {
      vouchersWithImbalance,
      totalValidationErrors: vouchersWithImbalance.length,
      overallBalance: Math.round(overallBalance * 100) / 100 // Round to 2 decimals
    };
  }, [transactions]);
};